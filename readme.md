# Medical Chatbot

A medical chatbot application built with Flask (backend) and Next.js (frontend) that provides medical guidance, symptom analysis, and specialist recommendations based on the OpenAI API.

## Features

- 🔒 **Secure Authentication**: JWT-based user authentication and authorization
- 🤖 **AI-Powered Responses**: Medical guidance using OpenAI's GPT-4 model
- 💬 **Interactive Chat Interface**: Real-time chat experience with typing indicators
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌙 **Dark/Light Mode**: Toggle between dark and light themes
- 📋 **Chat History**: Store and revisit previous conversations
- 🔄 **Session Management**: Create and manage multiple chat sessions
- ⚡ **Redis Caching**: Cache common queries for improved performance
- 🐳 **Docker Support**: Easy deployment with Docker and docker-compose

## System Architecture

### Backend (Flask)

- **Flask**: Lightweight Python web framework
- **Flask-SQLAlchemy**: ORM for database interactions
- **Flask-CORS**: Handle cross-origin requests
- **PyJWT**: Authentication using JSON Web Tokens
- **OpenAI API**: Integration with GPT-4 for medical responses
- **Redis**: Caching layer for performance
- **SQLite/PostgreSQL**: Database for storing user data and chat history

### Frontend (Next.js)

- **Next.js**: React framework with SSR capabilities
- **Tailwind CSS**: Utility-first CSS framework for styling
- **NextAuth.js**: Authentication for Next.js applications
- **Zustand**: Lightweight state management
- **Framer Motion**: Animations for a polished user experience
- **Axios**: API client for backend communication
- **React Markdown**: Render markdown content in chat messages

## Project Structure

```
📂 medical-chatbot (Root Directory)
 ├── 📂 backend 
 │   ├── 📂 models/
 │   ├── 📂 routes/
 │   ├── app.py
 │   ├── config.py
 │   ├── requirements.txt
 │   ├── wsgi.py
 │
 ├── 📂 frontend
 │   ├── 📂 components/
 │   ├── 📂 pages/
 │   ├── 📂 styles/
 │   ├── 📂 utils/
 │   ├── package.json
 │
 ├── docker-compose.yml
 ├── README.md
```

## Installation and Setup

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Docker and docker-compose (optional)
- OpenAI API key

### Running with Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/medical-chatbot.git
   cd medical-chatbot
   ```

2. Configure environment variables:
   - Update `backend/.env` with your OpenAI API key and other settings
   - Update `frontend/.env.local` with your frontend settings

3. Start the containers:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Setup (Development)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit the .env file with your API keys and settings
   ```

5. Run the Flask server:
   ```bash
   flask run
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit the .env.local file with your settings
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Access the application at http://localhost:3000

## API Documentation

### Authentication Endpoints

- **POST /api/auth/register**: Register a new user
- **POST /api/auth/login**: Login and get access token
- **POST /api/auth/refresh**: Refresh access token
- **GET /api/auth/me**: Get current user profile

### Chat Endpoints

- **POST /api/chat/send**: Send a message and get a response
- **GET /api/chat/sessions**: Get all chat sessions
- **GET /api/chat/sessions/:session_id**: Get a specific chat session
- **DELETE /api/chat/sessions/:session_id**: Delete a chat session

### History Endpoints

- **GET /api/history**: Get chat history with pagination
- **GET /api/history/:history_id**: Get a specific history item
- **DELETE /api/history/:history_id**: Delete a history item
- **DELETE /api/history/clear**: Clear all history

## Important Notes

- This application is designed for **informational purposes only** and is not a substitute for professional medical advice, diagnosis, or treatment.
- Always consult with a qualified healthcare provider for medical concerns.

## Future Enhancements

- 🔊 Voice input/output support
- 📊 Analytics dashboard for usage patterns
- 📱 Native mobile applications
- 🌐 Multi-language support
- 🔍 Integration with medical databases for more accurate information

## License

This project is licensed under the MIT License - see the LICENSE file for details.