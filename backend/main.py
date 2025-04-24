import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from datetime import datetime

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
    # Only moderate and trigger the call; do not store any history or count
    if not moderate_call(req.topic):
        return {"message": "Call topic rejected by moderation."}
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
            return {"message": "Bland.ai call triggered!", "call_id": call_id}
        else:
            raise HTTPException(status_code=500, detail=f"Bland.ai call failed: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Bland.ai: {e}")
