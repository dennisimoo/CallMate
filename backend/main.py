import os
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from datetime import datetime
import json
from typing import List, Dict, Any, Optional
import httpx
from supabase import create_client, Client
import re
try:
    from deepmultilingualpunctuation import PunctuationModel
    punctuation_model = PunctuationModel()
except ImportError:
    punctuation_model = None

load_dotenv()

BLAND_API_KEY = os.getenv("BLAND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized successfully")
    except Exception as e:
        print(f"Error initializing Supabase client: {str(e)}")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for authenticated user ID through headers
def get_current_user_id(user_id: str = Header(None)):
    return user_id

# Constants    
MAX_CALLS_PER_GUEST = 10
MAX_CALLS_PER_USER = 5
MAX_DURATION = 60  # seconds

# Simple in-memory storage for call history (fallback if Supabase fails)
call_history: Dict[str, List[Dict[str, Any]]] = {}

class CallRequest(BaseModel):
    phone_number: str
    topic: str
    admin: Optional[bool] = False
    user_id: Optional[str] = None

class CallRecord(BaseModel):
    topic: str
    status: str
    timestamp: str
    call_id: str = None
    transcript: str = None
    user_id: str = None

# Gemini moderation function
def moderate_call(topic: str, phone_number: str = None) -> dict:
    """Moderate call content using Gemini API and check for emergency numbers"""
    # Block emergency numbers
    emergency_numbers = ["911", "999", "112", "000"]
    if phone_number and any(phone_number.endswith(num) for num in emergency_numbers):
        return {"allowed": False, "reason": "Emergency services number detected"}
        
    if not GEMINI_API_KEY:
        return {"allowed": True, "reason": ""}
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        prompt = f"""
        Assess if the following phone call topic is appropriate:
        Phone number: {phone_number}
        Topic: {topic}
        
        Only block if the topic is clearly illegal, abusive, or a direct emergency services abuse. Allow vague, general, or unclear topics. Be lenient and allow most topics unless they are obviously problematic.
        
        Respond in exactly this format:
        {{\n  \"allowed\": true/false,\n  \"reason\": \"<short reason>\"\n}}
        """
        
        data = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ]
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 200:
            return {"allowed": True, "reason": "Moderation service unavailable"}
        result = response.json()
        # Extract the allowed/reason from Gemini response
        import re, json as pyjson
        match = re.search(r'\{.*\}', result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', ''))
        if match:
            try:
                moderation = pyjson.loads(match.group(0))
                return moderation
            except Exception:
                pass
        return {"allowed": True, "reason": "Could not parse moderation response"}
    except Exception as e:
        return {"allowed": True, "reason": f"Moderation error: {str(e)}"}

# Path to the frontend build directory
frontend_build_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

# IMPORTANT: Define API routes BEFORE mounting static files

@app.post("/api/call")
async def trigger_call(req: CallRequest):
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # Get admin flag from request body, if any
    is_admin = req.admin
    
    # Skip moderation for admin users
    if not is_admin:
        # Moderate the call topic and phone number
        moderation_result = moderate_call(req.topic, req.phone_number)
        if not moderation_result["allowed"]:
            return {"message": f"Call topic or phone number rejected by moderation: {moderation_result['reason']}"}
    
    # Check call history for this phone number
    phone_history = call_history.get(req.phone_number, [])
    
    # If not admin, check call limits
    if req.user_id:
        # Authenticated user: 5 calls
        max_calls = MAX_CALLS_PER_USER
    else:
        # Guest user: 3 calls
        max_calls = MAX_CALLS_PER_GUEST
        
    # Count current successful calls
    current_calls = len([c for c in phone_history if c.get("status") == "success"])
    calls_left = max_calls - current_calls
        
    if calls_left <= 0 and not is_admin:
        return {"message": "You have reached the maximum number of calls."}
    
    # Call Bland.ai
    bland_url = "https://api.bland.ai/v1/calls"
    headers = {'Authorization': BLAND_API_KEY}
    
    call_data = {
        "phone_number": req.phone_number,
        "task": req.topic,
        "max_duration": 2,
        "voice": "josh", # Changed to a voice that exists in Bland.ai's system (confirmed from documentation)
        "reduce_latency": True,
        "wait_for_greeting": True,
        "record": True
    }
    
    try:
        # Make the call to Bland.ai
        resp = requests.post(bland_url, json=call_data, headers=headers)
        
        if resp.ok:
            data = resp.json()
            call_id = data.get("call_id")
            
            # Summarize the topic if possible
            summary = ""
            try:
                summary_resp = await summarize_topic_internal(req.topic)
                summary = summary_resp.get("summary") if summary_resp else ""
            except:
                summary = req.topic
                
            # Store in our in-memory history (fallback)
            new_call = {
                "topic": req.topic,
                "summary": summary,
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "call_id": call_id
            }
            
            if req.phone_number not in call_history:
                call_history[req.phone_number] = []
                
            call_history[req.phone_number].append(new_call)
            
            # Save to Supabase if possible
            if supabase and req.user_id:
                try:
                    db_call = {
                        "user_id": req.user_id,
                        "phone_number": req.phone_number,
                        "call_time": datetime.now().isoformat(),
                        "call_id": call_id,
                        "topic": req.topic,
                        "summary": summary
                    }
                    supabase.table("call_history").insert(db_call).execute()
                except Exception as e:
                    print(f"Error saving call to Supabase: {str(e)}")
            
            # Return call info
            return {
                "message": "Bland.ai call triggered!",
                "call_id": call_id,
                "calls_left": calls_left if not is_admin else "unlimited"
            }
        else:
            # Handle Bland.ai API error
            new_call = {
                "topic": req.topic,
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "error": resp.text
            }
            
            if req.phone_number not in call_history:
                call_history[req.phone_number] = []
                
            call_history[req.phone_number].append(new_call)
            
            raise HTTPException(status_code=500, detail=f"Bland.ai call failed: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Bland.ai: {e}")

def improve_transcript_readability(text):
    # Add punctuation if model is available
    if punctuation_model:
        try:
            text = punctuation_model.restore_punctuation(text)
        except Exception:
            pass
    # Split into sentences for readability
    sentences = re.split(r'(?<=[.!?]) +', text)
    return '\n'.join(sentences)

@app.get("/api/history/{phone_number}")
def get_history(phone_number: str, user_id: Optional[str] = None):
    """Get call history for a specific phone number"""
    # Try to get from Supabase first if user_id is provided
    if supabase and user_id:
        try:
            # Query Supabase for this user's history
            response = supabase.table("call_history")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("phone_number", phone_number)\
                .order("call_time", desc=True)\
                .execute()
            
            if response.data:
                return response.data
        except Exception as e:
            print(f"Error retrieving history from Supabase: {str(e)}")
            # Fall back to in-memory storage
    
    # Privacy protection - only show call history for the user's own phone number
    if not user_id:
        return []
        
    # Fallback to in-memory storage but only if they have a user_id
    if phone_number not in call_history:
        return []
    return call_history[phone_number]

# New endpoint to get all call history for a user regardless of phone number
@app.get("/api/history")
def get_user_history(user_id: Optional[str] = None):
    """Get all call history for a specific user regardless of phone number"""
    if not user_id:
        return []  # No user_id, no history
        
    # Try to get from Supabase first if user_id is provided
    if supabase:
        try:
            # Query Supabase for this user's entire history
            response = supabase.table("call_history")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("call_time", desc=True)\
                .execute()
            
            if response.data:
                return response.data
            else:
                print(f"No call history found for user {user_id}")
                return []
                
        except Exception as e:
            print(f"Error retrieving history from Supabase: {str(e)}")
            # Fall back to in-memory storage
    
    # Fallback to in-memory storage - aggregate all calls for this user
    all_user_calls = []
    for phone, calls in call_history.items():
        # Filter for just this user's calls
        user_calls = [call for call in calls if call.get("user_id") == user_id]
        all_user_calls.extend(user_calls)
    
    # Sort by timestamp descending
    all_user_calls.sort(key=lambda x: x.get("call_time", ""), reverse=True)
    return all_user_calls

@app.get("/api/call_details/{call_id}")
def get_call_details(call_id: str):
    """Get details for a specific call from Bland.ai"""
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    bland_url = f"https://api.bland.ai/v1/calls/{call_id}"
    headers = {'Authorization': BLAND_API_KEY}
    
    try:
        resp = requests.get(bland_url, headers=headers)
        if resp.ok:
            return resp.json()
        else:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call details: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting call details: {str(e)}")

@app.get("/api/call_transcript/{call_id}")
def get_call_transcript(call_id: str, user_id: Optional[str] = None):
    """Get call transcript for a specific call"""
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # First try Supabase for stored transcript
    if supabase and user_id:
        try:
            response = supabase.table("call_transcript")\
                .select("*")\
                .eq("call_id", call_id)\
                .single()\
                .execute()
                
            if response.data:
                return {
                    "status": "success", 
                    "transcript": response.data.get("transcript"),
                    "aligned": json.loads(response.data.get("aligned_transcript")) if response.data.get("aligned_transcript") else None
                }
        except Exception as e:
            print(f"Error retrieving transcript from Supabase: {str(e)}")
    
    # Try to get corrected transcript first (better quality)
    try:
        corrected_url = f"https://api.bland.ai/v1/calls/{call_id}/correct"
        headers = {'Authorization': BLAND_API_KEY}
        
        corrected_resp = requests.get(corrected_url, headers=headers)
        if corrected_resp.ok:
            corrected_data = corrected_resp.json()
            
            # If we have corrected/aligned transcript data
            if corrected_data.get("aligned"):
                aligned = corrected_data.get("aligned")
                concat_transcript = ""
                
                # Format transcript text
                for segment in aligned:
                    speaker = segment.get("speaker", "Unknown")
                    text = segment.get("text", "").strip()
                    if text:
                        concat_transcript += f"{speaker}: {text}\n"
                
                # Save to Supabase if possible
                if supabase and user_id:
                    try:
                        db_transcript = {
                            "call_id": call_id,
                            "user_id": user_id,
                            "transcript": concat_transcript,
                            "aligned_transcript": json.dumps(aligned)
                        }
                        supabase.table("call_transcript").upsert(db_transcript).execute()
                    except Exception as e:
                        print(f"Error saving corrected transcript to Supabase: {str(e)}")
                
                return {"status": "success", "transcript": concat_transcript, "aligned": aligned}
    except Exception as e:
        print(f"Error getting corrected transcript: {str(e)}")
        # Fall back to regular transcript below
    
    # If corrected transcript fails, fall back to regular transcript
    try:
        # Get call details which includes transcript from Bland.ai
        bland_url = f"https://api.bland.ai/v1/calls/{call_id}"
        headers = {'Authorization': BLAND_API_KEY}
        
        resp = requests.get(bland_url, headers=headers)
        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call transcript: {resp.text}")
        
        data = resp.json()
        
        # Check for transcript API v2 (aligned transcript)
        if data.get("transcript_aligned"):
            aligned = []
            concat_transcript = ""
            
            for segment in data.get("transcript_aligned", []):
                speaker = "Agent" if segment.get("from") == "ai" else "User"
                text = segment.get("text", "").strip()
                if text:
                    aligned.append({"speaker": speaker, "text": text})
                    concat_transcript += f"{speaker}: {text}\n"
                    
            # Save to Supabase if possible
            if supabase and user_id:
                try:
                    db_transcript = {
                        "call_id": data.get("call_id"),
                        "user_id": user_id,
                        "transcript": concat_transcript,
                        "aligned_transcript": json.dumps(aligned)
                    }
                    supabase.table("call_transcript").insert(db_transcript).execute()
                except Exception as e:
                    print(f"Error saving transcript to Supabase: {str(e)}")
            
            return {"status": "success", "transcript": concat_transcript, "aligned": aligned}
        
        # Check for transcript field
        elif data.get("transcript"):
            transcript = data.get("transcript", "")
            # IMPROVEMENT: Add punctuation and sentence segmentation
            improved_transcript = improve_transcript_readability(transcript)
            # Process transcript to create agent/user segments
            try:
                aligned = []
                lines = improved_transcript.split("\n")
                current_speaker = None
                for idx, line in enumerate(lines):
                    line = line.strip()
                    if not line:
                        continue
                    # Check for speaker change
                    if line.startswith("AI:") or line.startswith("Agent:"):
                        current_speaker = "Agent"
                        text = line.split(":", 1)[1].strip()
                        aligned.append({"speaker": current_speaker, "text": text})
                    elif line.startswith("Human:") or line.startswith("User:"):
                        current_speaker = "User"
                        text = line.split(":", 1)[1].strip()
                        aligned.append({"speaker": current_speaker, "text": text})
                    else:
                        # If transcript is a single block, alternate speakers every sentence
                        if not aligned:
                            current_speaker = "Agent"
                            aligned.append({"speaker": current_speaker, "text": line})
                        else:
                            # Alternate speakers for each new sentence if no prefix
                            current_speaker = "User" if aligned[-1]["speaker"] == "Agent" else "Agent"
                            aligned.append({"speaker": current_speaker, "text": line})
                if aligned:
                    # Save to Supabase if possible
                    if supabase and user_id:
                        try:
                            db_transcript = {
                                "call_id": data.get("call_id"),
                                "user_id": user_id,
                                "transcript": improved_transcript,
                                "aligned_transcript": json.dumps(aligned)
                            }
                            supabase.table("call_transcript").insert(db_transcript).execute()
                        except Exception as e:
                            print(f"Error saving transcript to Supabase: {str(e)}")
                    
                    return {"status": "success", "transcript": improved_transcript, "aligned": aligned}
            except Exception as e:
                print(f"Error processing concatenated transcript: {str(e)}")
                
        # Check if call is still in progress
        if data.get("status") == "in-progress" or data.get("completed") is False:
            return {"status": "pending", "message": "Call still in progress, transcript not available yet"}
            
        return {"status": "error", "message": "Transcript not available for this call"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting call transcript: {str(e)}")

@app.get("/api/call_recording/{call_id}")
def get_call_recording(call_id: str):
    """Get call audio recording URL for a specific call"""
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # Get recording URL from Bland.ai
    bland_url = f"https://api.bland.ai/v1/calls/{call_id}/recording"
    headers = {'Authorization': BLAND_API_KEY}
    
    try:
        resp = requests.get(bland_url, headers=headers)
        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call recording: {resp.text}")
        
        data = resp.json()
        if data.get("status") == "success" and data.get("url"):
            return {"status": "success", "recording_url": data.get("url")}
        else:
            return {"status": "error", "message": "Recording not available"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting call recording: {str(e)}")

@app.post("/api/chat_history")
async def save_chat(request: Request):
    """Save chat message to history"""
    body = await request.json()
    user_id = body.get("user_id")
    message = body.get("message")
    
    if not user_id or not message:
        raise HTTPException(status_code=400, detail="User ID and message are required")
    
    if supabase:
        try:
            # Save to Supabase
            chat_data = {
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            result = supabase.table("chat_history").insert(chat_data).execute()
            return {"status": "success", "id": result.data[0]["id"] if result.data else None}
        except Exception as e:
            print(f"Error saving chat to Supabase: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error saving chat history: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Supabase client not initialized")

@app.get("/api/chat_history/{user_id}")
def get_chat_history(user_id: str):
    """Get chat history for a user"""
    if supabase:
        try:
            response = supabase.table("chat_history")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("timestamp", desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error retrieving chat history from Supabase: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Supabase client not initialized")

# New endpoint for getting corrected transcripts using Bland.ai's corrected transcript API
@app.get("/api/call_corrected_transcript/{call_id}")
def get_call_corrected_transcript(call_id: str, user_id: Optional[str] = None):
    """Get corrected call transcript for a specific call"""
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # First try Supabase for stored transcript
    if supabase and user_id:
        try:
            response = supabase.table("call_transcript")\
                .select("*")\
                .eq("call_id", call_id)\
                .single()\
                .execute()
                
            if response.data:
                return {
                    "status": "success", 
                    "transcript": response.data.get("transcript"),
                    "aligned": json.loads(response.data.get("aligned_transcript")) if response.data.get("aligned_transcript") else None
                }
        except Exception as e:
            print(f"Error retrieving transcript from Supabase: {str(e)}")
    
    # Try to get corrected transcript first (better quality)
    try:
        corrected_url = f"https://api.bland.ai/v1/calls/{call_id}/correct"
        headers = {'Authorization': BLAND_API_KEY}
        
        corrected_resp = requests.get(corrected_url, headers=headers)
        if corrected_resp.ok:
            corrected_data = corrected_resp.json()
            
            # If we have corrected/aligned transcript data
            if corrected_data.get("aligned"):
                aligned = corrected_data.get("aligned")
                concat_transcript = ""
                
                # Format transcript text
                for segment in aligned:
                    speaker = segment.get("speaker", "Unknown")
                    text = segment.get("text", "").strip()
                    if text:
                        concat_transcript += f"{speaker}: {text}\n"
                
                # Save to Supabase if possible
                if supabase and user_id:
                    try:
                        db_transcript = {
                            "call_id": call_id,
                            "user_id": user_id,
                            "transcript": concat_transcript,
                            "aligned_transcript": json.dumps(aligned)
                        }
                        supabase.table("call_transcript").upsert(db_transcript).execute()
                    except Exception as e:
                        print(f"Error saving corrected transcript to Supabase: {str(e)}")
                
                return {"status": "success", "transcript": concat_transcript, "aligned": aligned}
    except Exception as e:
        print(f"Error getting corrected transcript: {str(e)}")
        # Fall back to regular transcript below
    
    # If corrected transcript fails, fall back to regular transcript
    try:
        # Get call details which includes transcript from Bland.ai
        bland_url = f"https://api.bland.ai/v1/calls/{call_id}"
        headers = {'Authorization': BLAND_API_KEY}
        
        resp = requests.get(bland_url, headers=headers)
        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call transcript: {resp.text}")
        
        data = resp.json()
        
        # Check for transcript API v2 (aligned transcript)
        if data.get("transcript_aligned"):
            aligned = []
            concat_transcript = ""
            
            for segment in data.get("transcript_aligned", []):
                speaker = "Agent" if segment.get("from") == "ai" else "User"
                text = segment.get("text", "").strip()
                if text:
                    aligned.append({"speaker": speaker, "text": text})
                    concat_transcript += f"{speaker}: {text}\n"
                    
            # Save to Supabase if possible
            if supabase and user_id:
                try:
                    db_transcript = {
                        "call_id": data.get("call_id"),
                        "user_id": user_id,
                        "transcript": concat_transcript,
                        "aligned_transcript": json.dumps(aligned)
                    }
                    supabase.table("call_transcript").insert(db_transcript).execute()
                except Exception as e:
                    print(f"Error saving transcript to Supabase: {str(e)}")
            
            return {"status": "success", "transcript": concat_transcript, "aligned": aligned}
        
        # Check for transcript field
        elif data.get("transcript"):
            transcript = data.get("transcript", "")
            # IMPROVEMENT: Add punctuation and sentence segmentation
            improved_transcript = improve_transcript_readability(transcript)
            # Process transcript to create agent/user segments
            try:
                aligned = []
                lines = improved_transcript.split("\n")
                current_speaker = None
                for idx, line in enumerate(lines):
                    line = line.strip()
                    if not line:
                        continue
                    # Check for speaker change
                    if line.startswith("AI:") or line.startswith("Agent:"):
                        current_speaker = "Agent"
                        text = line.split(":", 1)[1].strip()
                        aligned.append({"speaker": current_speaker, "text": text})
                    elif line.startswith("Human:") or line.startswith("User:"):
                        current_speaker = "User"
                        text = line.split(":", 1)[1].strip()
                        aligned.append({"speaker": current_speaker, "text": text})
                    else:
                        # If transcript is a single block, alternate speakers every sentence
                        if not aligned:
                            current_speaker = "Agent"
                            aligned.append({"speaker": current_speaker, "text": line})
                        else:
                            # Alternate speakers for each new sentence if no prefix
                            current_speaker = "User" if aligned[-1]["speaker"] == "Agent" else "Agent"
                            aligned.append({"speaker": current_speaker, "text": line})
                if aligned:
                    # Save to Supabase if possible
                    if supabase and user_id:
                        try:
                            db_transcript = {
                                "call_id": data.get("call_id"),
                                "user_id": user_id,
                                "transcript": improved_transcript,
                                "aligned_transcript": json.dumps(aligned)
                            }
                            supabase.table("call_transcript").insert(db_transcript).execute()
                        except Exception as e:
                            print(f"Error saving transcript to Supabase: {str(e)}")
                    
                    return {"status": "success", "transcript": improved_transcript, "aligned": aligned}
            except Exception as e:
                print(f"Error processing concatenated transcript: {str(e)}")
                
        # Check if call is still in progress
        if data.get("status") == "in-progress" or data.get("completed") is False:
            return {"status": "pending", "message": "Call still in progress, transcript not available yet"}
            
        return {"status": "error", "message": "Transcript not available for this call"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting call transcript: {str(e)}")

# --- Gemini summarization for call topics ---
async def summarize_topic_internal(topic: str):
    """Internal function for summarizing topics to avoid duplicating code"""
    return {"summary": topic}

@app.post("/api/summarize_topic")
async def summarize_topic(request: Request):
    body = await request.json()
    topic = body.get("topic", "")
    # Return the original topic without summarization
    return {"summary": topic}

# IMPORTANT: Mount static files AFTER defining all API routes
# Serve React static files only if the build directory exists (for production)
if os.path.exists(frontend_build_dir):
    app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="static")
else:
    print("Frontend build directory not found - running in development mode without static files")
    # In development mode, React app will be served separately by npm start
