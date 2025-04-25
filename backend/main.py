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

# Serve React static files
app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="static")

@app.post("/call")
def trigger_call(req: CallRequest):
    if not BLAND_API_KEY:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not set in environment.")
    # Moderate the call topic
    if not moderate_call(req.topic):
        return {"message": "Call topic rejected by moderation."}
    
    # Check call history for this phone number
    phone_history = call_history.get(req.phone_number, [])
    calls_made = len([call for call in phone_history if call.get("status") != "error"])
    
    # Check if user has reached the call limit
    if calls_made >= MAX_CALLS_PER_USER:
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
            
            return {
                "message": "Bland.ai call triggered!", 
                "call_id": call_id,
                "calls_left": MAX_CALLS_PER_USER - calls_made - 1
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
        resp = requests.get(bland_url, headers=headers)
        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to get call transcript: {resp.text}")
        
        data = resp.json()
        transcript = data.get("transcript", "")
        
        # Process transcript data
        # If transcript is available, parse it into an aligned format
        if transcript:
            try:
                # Simple parsing of the transcript into user/agent segments
                lines = transcript.strip().split("\n")
                aligned = []
                
                for line in lines:
                    if line.startswith("User:"):
                        aligned.append({"speaker": "user", "text": line[5:].strip()})
                    elif line.startswith("Agent:"):
                        aligned.append({"speaker": "agent", "text": line[6:].strip()})
                    # Handle other formats or continue the previous speaker
                    elif aligned and line.strip():
                        aligned[-1]["text"] += " " + line.strip()
                
                return {"status": "success", "transcript": transcript, "aligned": aligned}
            except Exception as e:
                return {"status": "error", "message": f"Error processing transcript: {str(e)}"}
        else:
            return {"status": "pending", "message": "Transcript not available yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting call transcript: {str(e)}")
