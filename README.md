# Plektu - AI Phone Call Assistant

Plektu is an application that connects users with intelligent AI assistants through phone calls. Built with React, FastAPI, Supabase, and advanced AI technologies, it allows you to have natural conversations on any topic simply by entering your phone number.

## ✨ Features

• **Simple Interface** - Just enter your phone number and topic to receive a call
• **Call Transcription** - View full transcripts of your conversations with download option
• **Audio Recordings** - Listen to recordings of your calls
• **Call History** - Keep track of all your previous calls
• **Adaptive UI** - Responsive design with light and dark mode
• **Smart Suggestions** - Dynamic typewriter-style suggested topics
• **Content Moderation** - Smart screening of call topics via Gemini API
• **User Authentication** - Google account login with different privileges
• **Feedback System** - In-app feedback collection for continuous improvement
• **Admin Portal** - Special access for unlimited calls without moderation

## 🚀 Getting Started

### Prerequisites

• Python 3.11+
• Node.js & npm
• Supabase account
• API keys (see Environment Variables section)

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/CallMate.git
cd CallMate
```

**2. Set up environment variables**

Create a `.env` file in the root directory with the following content:
```
BLAND_API_KEY=your_bland_ai_key_here
GEMINI_API_KEY=your_gemini_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**3. Quick Start**

The easiest way to start both frontend and backend together:
```bash
chmod +x start.sh
./start.sh
```

For production mode:
```bash
./start.sh --prod
```

**4. Manual Setup (Alternative)**

Install and run backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Install and run frontend (in a different terminal):
```bash
cd frontend
npm install
npm start
```

**5. Access the application**
Open your browser to [http://localhost:3000](http://localhost:3000)

## 🔒 Authentication & User Tiers

### Guest Users
- Can access the application without signing in
- Limited to 3 calls
- Call history is stored based on phone number

### Authenticated Users (Google Sign-In)
- Can access with Google account
- 5 calls allowed
- Personalized call history
- Preferences saved between sessions

### Admin Access
To access the admin panel:
1. Click the "Admin" tab at the top of the page
2. Enter the password: `admin`
3. You now have unlimited calls without content moderation

## 📊 Supabase Database Setup

The application uses Supabase as the backend database. A setup script is provided:

```bash
# Connect to your Supabase instance and run:
psql -U postgres -h your_supabase_host -d postgres -f database/supabase_schema.sql
```

Tables include:
- `user_preferences` - User settings and call limits
- `call_history` - Record of all calls made
- `call_transcript` - Full transcripts from calls
- `chat_history` - Chat message history
- `feedback` - User feedback submissions

## 🌐 Deployment

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select "Docker" as the Environment
4. Add the required environment variables
5. Click "Create Web Service"

## 🛠️ Project Structure

```
CallMate/
├── backend/                # FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   └── utils/              # Utility functions
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   │   ├── components/     # React components
│   │   ├── App.js          # Main application component
│   │   └── TypewriterEffect.js # Typewriter animation
│   └── package.json        # Frontend dependencies
├── database/               # Database scripts
│   └── supabase_schema.sql # Database schema
├── start.sh                # Combined starter script
└── README.md               # This file
```

## 📋 API Endpoints

• `POST /call` - Trigger a new call
• `GET /history/{phone_number}` - Get call history for a phone number
• `GET /call_details/{call_id}` - Get details for a specific call
• `GET /call_transcript/{call_id}` - Get transcript for a call
• `POST /summarize_topic` - Get topic summary
• `POST /moderate_call` - Check if call content is appropriate

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| BLAND_API_KEY | API key for Bland.ai phone service |
| GEMINI_API_KEY | API key for Google's Gemini AI |
| SUPABASE_URL | URL for your Supabase instance |
| SUPABASE_ANON_KEY | Anonymous key for Supabase access |

## 📝 User Feedback

The application includes a built-in feedback system. Users can submit feedback via the floating feedback button, and admin users can view all feedback submissions in Supabase.

## 🔄 Version History

- v1.3.0 - Added Supabase integration, feedback system, improved moderation, better UI
- v1.2.0 - Added user authentication and call history
- v1.1.0 - Added transcript downloads and improved UI
- v1.0.0 - Initial release

---

Developed by Dennis K. & Nicholas L.
