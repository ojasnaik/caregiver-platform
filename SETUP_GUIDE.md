# Caregiver Platform Setup Guide

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE** tier (M0 Sandbox)

### 2. Create a New Cluster
1. Click "Build a Database"
2. Choose "FREE" tier
3. Select a cloud provider and region (choose one closest to your users)
4. Give your cluster a name (e.g., "caregiver-platform")
5. Click "Create"

### 3. Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password (save these!)
5. Under "Database User Privileges", select "Read and write to any database"
6. Click "Add User"

### 4. Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

> **Production note:** Most backend hosts use rotating egress IPs, so `0.0.0.0/0`
> is often the practical choice — keep it safe by pairing it with a least-privilege
> database user (read/write to `caregiver-app` only) and a strong password. If your
> host offers static egress IPs, allowlist those instead.

### 5. Get Your Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Environment Setup

### 1. Create Environment File
Copy `.env.example` to `.env` in the root directory and fill in your values:

```env
# ── Backend ──
# MongoDB Atlas Connection String
# Replace <username>, <password>, and <cluster-url> with your actual credentials
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/caregiver-platform?retryWrites=true&w=majority

# Server Port (optional, defaults to 5000; most hosts inject this)
PORT=5000

# Google Gemini API Key for Support Chat — https://aistudio.google.com/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Groq API Key for chat history compaction (optional) — https://console.groq.com/keys
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Comma-separated allowed origins for CORS in production (blank = allow all)
# e.g. CORS_ORIGINS=https://your-app.vercel.app
CORS_ORIGINS=

# "production" on the deployed backend; suppresses verbose prompt/response logging
NODE_ENV=development

# ── Frontend (Vite, build-time) ──
# Deployed backend URL. Blank locally -> defaults to http://localhost:5000
VITE_API_URL=
```

**Important:** Replace `<username>`, `<password>`, and `<cluster-url>` with your actual MongoDB Atlas credentials.

## Installation and Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
To run both frontend and backend simultaneously:
```bash
npm run dev:full
```

Or run them separately:

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Deployment

For deploying to production (static frontend on Vercel + containerized backend on
any host, sharing MongoDB Atlas), see the **Deployment** section in
[README.md](README.md). In short: build the backend with the provided
[`Dockerfile`](Dockerfile), set `VITE_API_URL` on Vercel to the backend URL, and set
`CORS_ORIGINS` on the backend to the Vercel URL.

## User Profile Schema

The user profile includes the following fields:

### Basic Information
- **Name**: Full name (2-50 characters)
- **Age**: Age (18-100 years)
- **Caregiver Type**: parent, guardian, or grandparent
- **Email**: Valid email address (unique)
- **Password**: Minimum 6 characters (hashed with bcrypt)

### Family Information
- **Number of Kids**: 1-20 children
- **Kids Ages**: Array of ages for each child (0-25 years)
- **Additional Info**: Optional text field (max 500 characters)

### System Fields
- **Profile Picture**: URL for profile image (optional)
- **Is Verified**: Email verification status
- **Created At**: Account creation timestamp
- **Last Login**: Last login timestamp

## API Endpoints

### POST /api/auth/signup
Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 30,
  "caregiverType": "parent",
  "email": "john@example.com",
  "password": "password123",
  "familyInfo": {
    "numberOfKids": 2,
    "kidsAges": [5, 8],
    "additionalInfo": "Love hiking with my kids"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "caregiverType": "parent",
    "familyInfo": {
      "numberOfKids": 2,
      "kidsAges": [5, 8],
      "additionalInfo": "Love hiking with my kids"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/auth/login
Authenticates a user (for future implementation).

## Features

### Signup Form Features
- ✅ Real-time form validation
- ✅ Dynamic children age inputs
- ✅ Password confirmation
- ✅ Responsive design
- ✅ Error handling and user feedback
- ✅ Character count for additional info
- ✅ Modern, accessible UI

### Security Features
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Email uniqueness validation
- ✅ CORS enabled for cross-origin requests

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your connection string in `.env`
   - Check that your IP is whitelisted in MongoDB Atlas
   - Ensure your database user has proper permissions

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Or kill the process using the port: `npx kill-port 5000`

3. **CORS Issues**
   - The backend allows all origins when `CORS_ORIGINS` is unset (local dev)
   - For production, set `CORS_ORIGINS` to your frontend origin(s), e.g. `https://your-app.vercel.app` (comma-separated for multiple) — no code change needed

4. **Form Validation Errors**
   - Check that all required fields are filled
   - Ensure email format is valid
   - Verify password confirmation matches
   - Check that number of kids ages matches number of kids

## Next Steps

1. Set up email verification for new accounts
2. Implement login functionality
3. Add profile picture upload
4. Create user dashboard
5. Add social features (posts, comments, etc.)
6. Implement search and filtering
7. Add mobile app support

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your MongoDB Atlas setup
3. Ensure all dependencies are installed
4. Check that both frontend and backend servers are running
