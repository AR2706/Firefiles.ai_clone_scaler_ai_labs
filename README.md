## 🚀 Live Demo
- **Frontend (Vercel):** [Insert your Vercel URL here]
- **Backend API (Render):** [Insert your Render URL here]/docs
# Fireflies.ai Clone 🎙️

A full-stack AI meeting note-taker application built with Next.js, FastAPI, and robust LLM orchestration. This project automatically processes meeting transcripts, generates intelligent summaries, and allows users to search, annotate, and manage their meeting history.

## 🚀 Live Demo
- **Frontend (Vercel):** *[Insert your Vercel URL here]*
- **Backend API (Render):** *[Insert your Render URL here]/docs*

---

## ✨ Key Features

### Core Requirements
- **Transcript Processing:** Upload `.txt` or `.vtt` transcripts. The system automatically parses speakers and timestamps.
- **AI Summarization:** Automatically generates high-level overviews, chapter markers, and actionable next steps.
- **Interactive UI:** Click on any transcript sentence to navigate through the meeting, filter by speakers, and view dynamic tags.

### 🌟 Advanced / Bonus Features Implemented
- **Multi-LLM Fallback Architecture:** The summarization engine is highly fault-tolerant. It attempts to use **Mistral**, falls back to **Groq**, then **Gemini**, and finally gracefully degrades to an offline **Extractive Text Algorithm** if all APIs are rate-limited.
- **Lightning-Fast Global Search:** Implemented **SQLite FTS5 (Full-Text Search)** to allow instant searching across thousands of meeting transcripts simultaneously.
- **Annotations & Comments:** Users can select specific segments of a transcript and leave persistent comments.
- **Export Functionality:** Export meeting summaries and action items directly to Markdown or TXT files.
- **Dark Mode:** Fully responsive UI with a built-in theme toggle.
- **Enterprise-Ready Deployment:** Containerized with multi-stage Docker builds for minimal image sizes.

---

## 🏗️ Tech Stack
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, TypeScript
- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite (with FTS5 module)
- **AI / LLMs:** Mistral, Groq, Gemini
- **Infrastructure:** Docker, Docker Compose, Vercel, Render

---

## 🧠 Architecture & Design Decisions

1. **Protocol-Oriented AI Services:** The backend uses Python `Protocol` classes (`SummaryProvider`) to define the AI contract. This allowed for clean dependency injection and made the Multi-LLM fallback mechanism modular and testable.
2. **Mocked Authentication:** As per project scope, real authentication is deferred. However, the database and API routes strictly enforce `owner_id` filtering via a `get_current_user` FastAPI dependency, ensuring a real JWT auth system can be dropped in later with zero changes to the core business logic.
3. **Frontend API Proxying:** The frontend utilizes centralized API fetch wrappers with robust error handling and Next.js environment variable configurations to seamlessly bridge local development and cloud deployments.
4. **Smart Database Seeding:** To provide an immediate, rich experience for reviewers, the backend includes an automated seeding script (`seed.py`). On first startup, it populates the database with realistic mock meetings, calculating dynamic timestamps relative to the current day (e.g., "Yesterday", "3 days ago") so the dashboard UI and date-grouping logic can be evaluated instantly.

## 🧪 Quick Testing Guide
I have included a sample transcript file named **`test-meeting.txt`** in the root of this repository. 
When testing the application, you can upload this file via the "Create meeting" button in the UI to instantly evaluate the parsing, LLM summarization, and action-item generation features without needing to supply your own transcript.

---

## 🛠️ Local Development

### Prerequisites
- Docker & Docker Compose OR Node.js 20+ and Python 3.13+
- API Keys for Mistral, Groq, or Gemini

### Option 1: Docker (Recommended)
1. Clone the repository.
2. Create a `.env` file in the `backend/` directory with your API keys:
   ```env
   MISTRAL_API_KEY=your_key
   GROQ_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ```
3. Run the complete stack:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:3001` and the backend at `http://localhost:8001`.

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `.\venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev -p 3001
```
