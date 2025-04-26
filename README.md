# Plektu - AI Phone Call Assistant

Plektu is an application that connects users with intelligent AI assistants through phone calls. Built with React, FastAPI, and advanced AI technologies, it allows you to have natural conversations on any topic simply by entering your phone number.

## ✨ Features

• **Simple Interface** - Just enter your phone number and topic to receive a call
• **Call Transcription** - View full transcripts of your conversations
• **Audio Recordings** - Listen to recordings of your calls
• **Call History** - Keep track of all your previous calls
• **Admin Portal** - Special access for unlimited calls without moderation

## 🚀 Getting Started

### Prerequisites

• Python 3.11+
• Node.js & npm
• API keys (see Environment Variables section)

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/Plektu.git
cd Plektu
```

**2. Set up environment variables**

Create a `.env` file in the backend directory with the following content:
```
BLAND_API_KEY=your_bland_ai_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**3. Install backend dependencies**
```bash
pip install -r backend/requirements.txt
```

**4. Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

**5. Run the backend server**
```bash
# From the project root
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**6. In a new terminal, run the frontend development server**
```bash
# From the project root
cd frontend
npm start
```

**7. Access the application**
Open your browser to [http://localhost:3000](http://localhost:3000)

## 🔒 Admin Access

To access the admin panel:
1. Click the "Admin" tab at the top of the page
2. Enter the password: `admin`
3. You now have unlimited calls without content moderation

## 🌐 Deployment

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select "Docker" as the Environment
4. Add the following environment variables:
   - `BLAND_API_KEY`
   - `GEMINI_API_KEY`
5. Click "Create Web Service"

## 🛠️ Project Structure

```
Plektu/
├── backend/             # FastAPI backend
│   ├── main.py          # Main application file
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   └── src/             # React source code
├── Dockerfile           # Docker configuration
└── README.md            # This file
```

## 📋 API Endpoints

• `POST /call` - Trigger a new call
• `GET /history/{phone_number}` - Get call history for a phone number
• `GET /call_details/{call_id}` - Get details for a specific call
• `GET /call_transcript/{call_id}` - Get transcript for a specific call
• `GET /call_recording/{call_id}` - Get recording URL for a specific call

## ⚠️ Troubleshooting

• **API Key Errors**: Make sure your environment variables are set correctly
• **Proxy Errors in Development**: Ensure both frontend and backend servers are running
• **Missing Transcripts**: Some calls may take time to generate transcripts

## 🔮 Future Improvements

• User authentication system
• Custom voice selection
• Scheduled calls
• Multi-language support
