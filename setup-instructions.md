# Setup Instructions for Plektu

## 1. Supabase Configuration

### Create User Preferences Table
Run the SQL from `/database/supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

### Fix Google OAuth Configuration

1. Go to your Google Cloud Console
2. Navigate to the OAuth consent screen settings
3. Make sure your app is properly configured with the right scopes

4. Go to the "Credentials" section
5. Edit your Web client 1 credentials
6. Update the "Authorized redirect URIs" to include:
   - `https://tnrnldbtcdhtsphnhvpx.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/v1/callback`
   - `http://localhost:3001/auth/v1/callback` (for development)

7. Save the changes and wait for them to propagate (can take 5-15 minutes)

### Configure Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers → Google
3. Ensure the Google provider is enabled
4. Make sure the Client ID and Client Secret are correctly set
5. The Callback URL should be: `https://tnrnldbtcdhtsphnhvpx.supabase.co/auth/v1/callback`
6. Save the settings

## 2. Running the App

The app now includes:
- Google Sign-in
- Guest login option
- User preferences stored in Supabase
- Dark mode preference persistence
- Call limits tracked per user

Run the frontend:
```
cd /Users/dennis/Downloads/Call_Mentor/frontend
npm start
```

## 3. Testing Authentication

1. When you launch the app, you should see the new login screen
2. Try both the Google login and the Guest login options
3. After logging in, your preferences will be saved to Supabase
4. Sign out and sign back in to verify persistence
