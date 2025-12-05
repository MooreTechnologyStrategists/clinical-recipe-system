# Clinical Nutritional Recipe System 🏥

> AI-powered recipe recommendations tailored to your unique health conditions

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-blue.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com)

## ✨ Features

- 🏥 **Health Profiles**: Track 13+ medical conditions
- ⚡ **Fast Generation**: 10-15 second AI-powered recipes
- 📊 **Nutritional Analysis**: 10 nutrients per serving
- ⚕️ **Health Warnings**: Condition-specific guidance
- 🔍 **Smart Search**: Find recipes instantly
- 🌿 **Ingredient Benefits**: Therapeutic properties
- 🎯 **Agentic Database**: Community-powered ingredients
- ⭐ **Favorites**: Organize your collection

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB 7.0+
- Emergent LLM API Key

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your EMERGENT_LLM_KEY
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env
yarn start
```

App opens at `http://localhost:3000`

## 📖 Documentation

- [Integration Guide](INTEGRATION_GUIDE.md)
- [Features](FEATURES_UPDATE.md)
- [Performance](PERFORMANCE_AND_UX_IMPROVEMENTS.md)
- [GitHub Deployment](GITHUB_DEPLOYMENT.md)

## 🏗️ Tech Stack

- Frontend: React 19 + Tailwind CSS
- Backend: FastAPI + Python
- Database: MongoDB
- AI: OpenAI GPT-4o (Emergent LLM)

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

Made with 💚 for better health through nutrition