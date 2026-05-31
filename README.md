# 🐙 GitJourney — Visual GitHub Profile Analyzer

> Explore any GitHub developer's coding journey with AI-powered personality analysis, fun roasts, achievement badges, and shareable developer cards.

![GitJourney](https://img.shields.io/badge/GitJourney-Live-58a6ff?style=for-the-badge&logo=github)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-Flask-3776ab?style=flat-square&logo=python)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-bc8cff?style=flat-square&logo=google)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎬 **Coding Journey Timeline** | Animated bar chart showing repos created per year |
| 💻 **Language Breakdown** | Interactive donut chart of top programming languages |
| 🧬 **Developer Personality** | AI-generated personality type (e.g., "Night-Owl Full-Stack Hustler 🦉") |
| 🔥 **AI Roast** | Fun, kind observations about coding habits |
| 🏆 **Achievement Badges** | 8 unlockable badges based on GitHub stats |
| 🎴 **Shareable Card** | Beautiful summary card — download as PNG for social media |
| ⚔️ **Profile Battle** | Compare two GitHub profiles head-to-head |
| 📖 **Journey Summary** | AI-generated narrative of coding evolution |
| 💡 **Growth Tips** | Personalized improvement suggestions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Recharts, Framer Motion |
| **Backend** | Python, Flask, Flask-CORS, Flask-Limiter |
| **AI** | Google Gemini 2.0 Flash |
| **APIs** | GitHub REST API (public, no auth needed) |
| **Styling** | Custom CSS (dark theme, glassmorphism, animations) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+) — [Download](https://nodejs.org/)
- **Python** (v3.10+) — [Download](https://python.org/)
- **Gemini API Key** (free) — [Get it here](https://aistudio.google.com/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gitjourney.git
cd gitjourney
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
python app.py
```

The API runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`

---

## 📸 Screenshots

> *Screenshots will be added after first run*

---

## 🔒 Security

- ✅ Only reads **public** GitHub data (no auth, no private repos)
- ✅ No database — zero user data stored
- ✅ API key hidden in `.env` (never exposed to browser)
- ✅ Rate limiting (30 requests/minute)
- ✅ Input validation with regex
- ✅ CORS restricted to frontend origin
- ✅ HTTPS on deployment (Vercel + Render)

---

## 🌐 Deployment

### Frontend → Vercel (FREE)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo → Select `frontend` folder
4. Deploy!

### Backend → Render (FREE)

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your repo → Select `backend` folder
4. Add `GEMINI_API_KEY` as environment variable
5. Deploy!

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Analyze a GitHub profile |
| `POST` | `/api/battle` | Compare two profiles |

### Example Request

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"username": "torvalds"}'
```

---

## 💰 Cost

| Resource | Cost |
|----------|------|
| GitHub API | **FREE** (60 req/hr unauthenticated) |
| Gemini AI | **FREE** (Google free tier) |
| Vercel | **FREE** |
| Render | **FREE** |
| **Total** | **₹0** |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

---

> Built with ❤️ and ☕ | Powered by GitHub API & Google Gemini AI
