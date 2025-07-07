# Mental Health AI Assistant

A full-stack AI-powered mental wellness assistant designed to provide empathetic conversations, personalized memory, mood and sentiment analysis, personality modes, to-do/goal setting, and downloadable sentiment summaries for healthcare professionals. Built with a modern React frontend and a Python backend leveraging advanced NLP and memory management.

## Features

- **Conversational AI**: Engage in supportive, empathetic conversations with an AI trained for mental wellness.
- **Personalized Memory**: The assistant remembers user facts and preferences for more tailored interactions.
- **Mood & Sentiment Analysis**: Real-time analysis of user sentiment and mood, with downloadable summaries for doctors or therapists.
- **Personality Modes**: Switch between different AI personalities to match user comfort and needs.
- **To-Do & Goal Setting**: Set, track, and manage personal goals and tasks within the chat interface.
- **Crisis Support**: Detects crisis language and provides immediate resources or escalation.
- **Privacy First**: User data is securely managed and never shared without consent.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Python (Flask), ChromaDB, Custom NLP chains
- **State Management**: React Context API
- **API Communication**: RESTful endpoints

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+
- pip (Python package manager)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mental-health-bot.git
cd mental-health-bot
```

#### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env as needed
python main.py
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env  # Edit .env as needed
npm run dev
```

- The frontend will run on [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001) if configured).
- The backend API runs on [http://localhost:5001](http://localhost:5001).

## Usage

- Open the frontend in your browser.
- Start a conversation with the AI assistant.
- Set goals, track mood, and download sentiment summaries as needed.
- Switch personality modes for different conversational styles.

## Downloading Sentiment Summaries
- After several conversations, navigate to the "Download Summary" section in the UI.
- Click to download a PDF/CSV summary of your mood and sentiment trends for sharing with your doctor or therapist.

## Customization
- Update personality modes in `backend/personality_modes/mode_manager.py`.
- Adjust memory and sentiment logic in `backend/chains/conversation_chain.py`.
- Modify frontend UI in `frontend/src/components/`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is not licensed under the MIT License. All rights reserved to chinthaka2000. Please contact chinthaka2000 for permissions regarding use, distribution, or modification.

## Acknowledgements
- OpenAI for foundational NLP models
- ChromaDB for vector memory storage
- All contributors and testers

---

For questions or support, please open an issue or contact the maintainer.

---

**Credit:** Project created and maintained by chinthaka2000.
