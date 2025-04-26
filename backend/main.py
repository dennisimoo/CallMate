import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from datetime import datetime
import json
from typing import List, Dict, Any, Optional

load_dotenv()

BLAND_API_KEY = os.getenv("BLAND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_CALLS_PER_USER = 3
MAX_DURATION = 60  # seconds

# Simple in-memory storage for call history (will reset on service restart)
# In a production app, this would be a database
call_history: Dict[str, List[Dict[str, Any]]] = {}

class CallRequest(BaseModel):
    phone_number: str
    topic: str
    admin: Optional[bool] = False

class CallRecord(BaseModel):
    topic: str
    status: str
    timestamp: str
    call_id: str = None
    transcript: str = None

# Gemini moderation function
def moderate_call(topic: str):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in environment.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    moderation_prompt = (
        "Analyze the following phone call topic for any inappropriate, offensive, insulting, bullying, dangerous, prank, or emergency (like 911) content. "
        "If the topic contains anything that is not safe, respectful, or appropriate for a phone call, answer ONLY 'yes'. Otherwise, answer ONLY 'no'. "
        f"Topic: {topic}"
    )
    data = {
        "contents": [{
            "parts": [{"text": moderation_prompt}]
        }]
    }
    resp = requests.post(url, json=data, headers=headers)
    if not resp.ok:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {resp.text}")
    result = resp.json()
    try:
        answer = result['candidates'][0]['content']['parts'][0]['text'].strip().lower()
        # Accept only if the answer is exactly 'no'. Otherwise, block.
        if answer == 'no':
            return True
        return False
    except Exception:
        raise HTTPException(status_code=500, detail="Gemini API response parsing error.")

# Path to the frontend build directory
frontend_build_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

# IMPORTANT: Define API routes BEFORE mounting static files

@app.post("/call")
def trigger_call(req: CallRequest):
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # Get admin flag from request body, if any
    is_admin = req.admin
    
    # Skip moderation for admin users
    if not is_admin:
        # Moderate the call topic
        if not moderate_call(req.topic):
            return {"message": "Call topic rejected by moderation."}
    
    # Check call history for this phone number
    phone_history = call_history.get(req.phone_number, [])
    calls_made = len([call for call in phone_history if call.get("status") != "error"])
    
    # Skip call limit check for admin users
    if not is_admin and calls_made >= MAX_CALLS_PER_USER:
        return {"message": "Call limit reached", "calls_left": 0}
    
    # Actually trigger the call via Bland.ai
    bland_url = "https://api.bland.ai/v1/calls"
    headers = {'Authorization': BLAND_API_KEY, 'Content-Type': 'application/json'}
    payload = {
        "phone_number": req.phone_number,
        "task": req.topic,
        "record": True,
        "max_duration": MAX_DURATION
    }
    
    try:
        resp = requests.post(bland_url, json=payload, headers=headers)
        if resp.ok:
            data = resp.json()
            call_id = data.get("call_id")
            
            # Store call in history
            new_call = {
                "topic": req.topic,
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "call_id": call_id
            }
            
            if req.phone_number not in call_history:
                call_history[req.phone_number] = []
            
            call_history[req.phone_number].append(new_call)
            
            # Calculate calls left (only matters for non-admin users)
            calls_left = MAX_CALLS_PER_USER - calls_made - 1 if not is_admin else MAX_CALLS_PER_USER
            
            return {
                "message": "Bland.ai call triggered!", 
                "call_id": call_id,
                "calls_left": calls_left
            }
        else:
            # Add failed call to history
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

@app.get("/history/{phone_number}")
def get_history(phone_number: str):
    """Get call history for a specific phone number"""
    if phone_number not in call_history:
        return []
    return call_history[phone_number]

@app.get("/call_details/{call_id}")
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

@app.get("/call_transcript/{call_id}")
def get_call_transcript(call_id: str):
    """Get call transcript for a specific call"""
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    
    # Get call details which includes transcript from Bland.ai
    bland_url = f"https://api.bland.ai/v1/calls/{call_id}"
    headers = {'Authorization': BLAND_API_KEY}
    
    try:
        # First try to get regular transcript
        resp = requests.get(bland_url, headers=headers)
        if not resp.ok:
            print(f"Error fetching transcript: {resp.status_code}, {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call transcript: {resp.text}")
        
        data = resp.json()
        
        # Try to get corrected transcript if available
        try:
            corrected_url = f"https://api.bland.ai/v1/calls/{call_id}/correct"
            corrected_resp = requests.get(corrected_url, headers=headers)
            if corrected_resp.ok:
                corrected_data = corrected_resp.json()
                if corrected_data.get("aligned") and len(corrected_data["aligned"]) > 0:
                    print(f"Using corrected transcript for call {call_id}")
                    # Use corrected transcripts if available
                    return {
                        "status": "success", 
                        "aligned": corrected_data["aligned"],
                        "is_corrected": True
                    }
        except Exception as corrected_err:
            print(f"Error fetching corrected transcript: {str(corrected_err)}")
            # Continue with regular transcript if corrected transcript fails
            pass
            
        # Process regular transcript if corrected not available
        transcript = data.get("transcript", "")
        transcripts = data.get("transcripts", [])
        
        if transcripts and len(transcripts) > 0:
            # Use transcripts array if available
            aligned = []
            for item in transcripts:
                speaker = item.get("user", "unknown")
                text = item.get("text", "")
                if text and speaker:
                    aligned.append({"speaker": speaker, "text": text})
            
            if aligned:
                return {"status": "success", "transcript": transcript, "aligned": aligned}
        
        # Fallback: try to parse transcript string if transcripts array not available
        if transcript:
            try:
                # Simple parsing of the transcript into user/agent segments
                lines = transcript.strip().split("\n")
                aligned = []
                
                for line in lines:
                    if line.startswith("User:"):
                        aligned.append({"speaker": "user", "text": line[5:].strip()})
                    elif line.startswith("Agent:") or line.startswith("Assistant:"):
                        prefix_len = 6 if line.startswith("Agent:") else 11
                        aligned.append({"speaker": "assistant", "text": line[prefix_len:].strip()})
                    # Handle other formats or continue the previous speaker
                    elif aligned and line.strip():
                        aligned[-1]["text"] += " " + line.strip()
                
                if aligned:
                    return {"status": "success", "transcript": transcript, "aligned": aligned}
            except Exception as e:
                print(f"Error processing transcript text: {str(e)}")
                return {"status": "error", "message": f"Error processing transcript: {str(e)}"}
        
        # If we have a concatenated transcript, try using that as a last resort
        concat_transcript = data.get("concatenated_transcript", "")
        if concat_transcript and not aligned:
            try:
                lines = concat_transcript.strip().split("\n")
                aligned = []
                
                for line in lines:
                    if line.startswith("user:"):
                        aligned.append({"speaker": "user", "text": line[5:].strip()})
                    elif line.startswith("assistant:"):
                        aligned.append({"speaker": "assistant", "text": line[10:].strip()})
                    elif aligned and line.strip():
                        aligned[-1]["text"] += " " + line.strip()
                
                if aligned:
                    return {"status": "success", "transcript": concat_transcript, "aligned": aligned}
            except Exception as e:
                print(f"Error processing concatenated transcript: {str(e)}")
                
        # Check if call is still in progress
        if data.get("status") == "in-progress" or data.get("completed") is False:
            return {"status": "pending", "message": "Call still in progress, transcript not available yet"}
            
        return {"status": "pending", "message": "Transcript not available yet"}
    except Exception as e:
        print(f"Exception in call_transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting call transcript: {str(e)}")

@app.get("/call_recording/{call_id}")
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

# IMPORTANT: Mount static files AFTER defining all API routes
# Serve React static files
app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="static")
