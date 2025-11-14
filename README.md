# ReAct RAG Visualizer

A professional, creative system for visualizing the reasoning process of ReAct (Reasoning + Acting) agents powered by LangChain and Google's Gemini API. Watch AI agents think through complex queries in real-time with an interactive slideshow interface.

## 🎯 Features

- **ReAct Agent**: Implements the Reasoning + Acting pattern with LangChain for step-by-step problem solving
- **Live Visualization**: Interactive slideshow interface showing each reasoning step (Thought → Action → Observation → Result)
- **Document Management**: Upload and manage documents in the knowledge base
- **Real-time Streaming**: WebSocket support for live updates during query processing
- **Professional UI**: Dark-themed, gradient-based interface with smooth animations
- **Gemini API Integration**: Powered by Google's advanced language model

## 🏗️ Architecture

```
ReAct RAG Visualizer
├── Frontend (React + TypeScript)
│   ├── Landing page with feature overview
│   ├── RAG Visualizer dashboard
│   ├── Document management interface
│   └── Real-time step visualization
│
├── Backend (Python FastAPI)
│   ├── ReAct agent with LangChain
│   ├── Document retrieval system
│   ├── REST API endpoints
│   └── WebSocket for streaming
│
└── Database (MySQL)
    ├── User management
    ├── Document storage
    └── Query history
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- Python 3.11+
- MySQL database
- Gemini API key

### Installation

#### 1. Frontend Setup

```bash
cd react_rag_visualizer
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:5173` (or port shown in terminal)

#### 2. Python Backend Setup

```bash
cd python_backend
pip install -r requirements.txt
export GEMINI_API_KEY="your-api-key-here"
python run.py
```

Backend runs on `http://localhost:8000`

#### 3. Database Setup

```bash
cd ..
pnpm db:push
```

## 📚 API Endpoints

### Documents

- **POST** `/api/documents/upload` - Upload a document
- **GET** `/api/documents` - List all documents

### Queries

- **POST** `/api/query` - Process a query with the ReAct agent
- **GET** `/api/queries/history` - Get query history
- **WS** `/ws/query` - WebSocket for real-time query streaming

### Health

- **GET** `/health` - Health check endpoint

## 🧠 How It Works

### ReAct Pattern

The agent follows a structured reasoning pattern:

1. **Thought**: Analyzes the query and decides what to do
2. **Action**: Retrieves relevant documents or analyzes text
3. **Observation**: Processes the results
4. **Repeat**: Continues until enough information is gathered
5. **Result**: Provides the final answer

### Example Flow

```
User Query: "What are the key benefits of Python?"
    ↓
Thought: "I need to search for information about Python benefits"
    ↓
Action: "Retrieving documents about Python"
    ↓
Observation: "Found 3 relevant documents with Python information"
    ↓
Action: "Analyzing the retrieved documents"
    ↓
Result: "Python offers excellent readability, extensive libraries, 
         and strong community support..."
```

## 🎨 Frontend Components

### RagVisualizer.tsx

Main component featuring:
- Document upload interface
- Query input form
- Slideshow-style step visualization
- Navigation controls
- Progress tracking
- Results display

### Home.tsx

Landing page with:
- Feature overview
- Technology stack showcase
- Call-to-action buttons
- Responsive design

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `python_backend/`:

```env
GEMINI_API_KEY=your-api-key-here
FASTAPI_ENV=development
FASTAPI_DEBUG=true
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
```

## 📊 Database Schema

### Users Table
- `id` (int, PK)
- `openId` (varchar, unique)
- `name` (text)
- `email` (varchar)
- `role` (enum: user, admin)
- `createdAt`, `updatedAt` (timestamp)

### Documents Table
- `id` (int, PK)
- `userId` (int, FK)
- `title` (varchar)
- `content` (longtext)
- `status` (enum: pending, processing, completed, failed)
- `createdAt`, `updatedAt` (timestamp)

### RagQueries Table
- `id` (int, PK)
- `userId` (int, FK)
- `query` (text)
- `steps` (longtext, JSON)
- `result` (longtext)
- `status` (enum: pending, processing, completed, failed)
- `createdAt`, `updatedAt` (timestamp)

## 🔌 Technology Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons
- **Wouter** - Routing

### Backend
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **LangChain** - Agent framework
- **Gemini API** - Language model
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Database
- **MySQL** - Data persistence
- **Drizzle ORM** - Database toolkit

## 🚢 Deployment

### Frontend
The React frontend is deployed automatically through the Manus platform.

### Backend
To deploy the Python backend:

1. Ensure all dependencies are installed
2. Set environment variables on the deployment platform
3. Run: `python run.py`

## 📝 Development Workflow

1. **Backend Development**: Modify files in `python_backend/app/` and `python_backend/models/`
2. **Frontend Development**: Modify files in `client/src/pages/` and `client/src/components/`
3. **Database Changes**: Update `drizzle/schema.ts` and run `pnpm db:push`

## 🐛 Troubleshooting

### Backend not connecting
- Ensure FastAPI is running on `http://localhost:8000`
- Check GEMINI_API_KEY is set correctly
- Verify CORS is enabled in FastAPI

### Frontend not loading documents
- Check browser console for errors
- Verify backend is running
- Ensure documents were uploaded successfully

### Query processing fails
- Check Gemini API key is valid
- Verify documents are uploaded
- Check backend logs for errors

## 📄 License

This project is built with ❤️ using LangChain and Gemini API.

## 🤝 Support

For issues or questions, please refer to the documentation or contact support.

---

**Built with**: Python, FastAPI, React, TypeScript, LangChain, Gemini API
