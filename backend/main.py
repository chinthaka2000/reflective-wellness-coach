#!/usr/bin/env python3
"""
🧠 LangChain Mental Wellness AI Assistant - Flask Backend
Main entry point for the mental wellness chatbot API.

Features:
- LangChain-powered conversations with memory
- ChromaDB for long-term memory storage
- Mood tracking and sentiment analysis
- Task management and reflection tools
- Multilingual support (English, Sinhala, Tamil)
- Multiple AI personality modes
"""

import os
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import our custom modules
from chains.conversation_chain import ConversationChain
from memory.memory_manager import MemoryManager
from analytics.mood_tracker import MoodTracker
from analytics.sentiment_analyzer import SentimentAnalyzer
from personality_modes.mode_manager import PersonalityModeManager
from todo.task_manager import TaskManager

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with more permissive settings for development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Add explicit OPTIONS handling for preflight requests
@app.route('/api/chat', methods=['OPTIONS'])
def handle_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3001')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return response

# Global instances
memory_manager = None
conversation_chain = None
mood_tracker = None
sentiment_analyzer = None
personality_manager = None
task_manager = None

def initialize_services():
    """Initialize all AI and memory services"""
    global memory_manager, conversation_chain, mood_tracker
    global sentiment_analyzer, personality_manager, task_manager
    
    try:
        # Initialize memory systems
        memory_manager = MemoryManager()
        
        # Initialize conversation chain with memory
        conversation_chain = ConversationChain(memory_manager)
        
        # Initialize analytics
        mood_tracker = MoodTracker(memory_manager)
        sentiment_analyzer = SentimentAnalyzer()
        
        # Initialize personality modes
        personality_manager = PersonalityModeManager()
        
        # Initialize task manager
        task_manager = TaskManager(memory_manager)
        
        print("✅ All services initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing services: {e}")
        raise

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Mental Wellness AI Assistant"
    })

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "Backend is working!"})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint for AI conversations"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = data['message']
        personality_mode = data.get('personality_mode', 'calm_coach')
        language = data.get('language', 'english')
        
        # Set personality mode
        personality_manager.set_mode(personality_mode)
        
        # Process the message through conversation chain
        response = conversation_chain.process_message(
            user_message, 
            personality_mode=personality_mode,
            language=language
        )
        
        # Analyze sentiment
        sentiment = sentiment_analyzer.analyze(user_message)
        
        # Check for special commands
        command_result = None
        if user_message.startswith('#'):
            command_result = process_command(user_message, data)
        
        return jsonify({
            "response": response,
            "sentiment": sentiment,
            "personality_mode": personality_mode,
            "language": language,
            "command_result": command_result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/mood', methods=['POST'])
def log_mood():
    """Endpoint for mood logging"""
    try:
        data = request.get_json()
        
        if not data or 'mood' not in data:
            return jsonify({"error": "Mood is required"}), 400
        
        mood = data['mood']
        note = data.get('note', '')
        
        # Log mood
        result = mood_tracker.log_mood(mood, note)
        
        return jsonify({
            "success": True,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Mood logging error: {e}")
        return jsonify({"error": "Failed to log mood"}), 500

@app.route('/api/mood/analytics', methods=['GET'])
def get_mood_analytics():
    """Get mood analytics and insights"""
    try:
        days = int(request.args.get('days', 7))
        analytics = mood_tracker.get_analytics(days)
        
        return jsonify({
            "analytics": analytics,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Mood analytics error: {e}")
        return jsonify({"error": "Failed to get analytics"}), 500

@app.route('/api/tasks', methods=['GET', 'POST'])
def manage_tasks():
    """Task management endpoint"""
    try:
        if request.method == 'GET':
            # Get all tasks
            tasks = task_manager.get_all_tasks()
            return jsonify({"tasks": tasks})
            
        elif request.method == 'POST':
            # Add new task
            data = request.get_json()
            
            if not data or 'title' not in data:
                return jsonify({"error": "Task title is required"}), 400
            
            task = task_manager.add_task(
                title=data['title'],
                description=data.get('description', ''),
                priority=data.get('priority', 'medium'),
                due_date=data.get('due_date')
            )
            
            return jsonify({
                "success": True,
                "task": task,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
    except Exception as e:
        print(f"❌ Task management error: {e}")
        return jsonify({"error": "Task operation failed"}), 500

@app.route('/api/tasks/analytics', methods=['GET'])
def get_task_analytics():
    """Get task analytics, insights, and recommendations"""
    try:
        days = int(request.args.get('days', 30))
        analytics = task_manager.get_task_analytics(days=days)
        return jsonify({
            "success": True,
            "analytics": analytics,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"❌ Task analytics error: {e}")
        return jsonify({"error": "Failed to get analytics"}), 500

@app.route('/api/tasks/upcoming', methods=['GET'])
def get_upcoming_tasks():
    """Get tasks due in the next N days (default 7)"""
    try:
        days = int(request.args.get('days', 7))
        tasks = task_manager.get_upcoming_tasks(days=days)
        return jsonify({
            "success": True,
            "tasks": tasks,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"❌ Upcoming tasks error: {e}")
        return jsonify({"error": "Failed to get upcoming tasks"}), 500

@app.route('/api/tasks/suggested', methods=['GET'])
def get_suggested_tasks():
    """Get daily suggested wellness tasks, optionally using user context (e.g., mood)"""
    try:
        # Optionally accept user context (e.g., mood) as query param
        mood = request.args.get('mood')
        user_context = {"mood": mood} if mood else None
        suggestions = task_manager.suggest_daily_tasks(user_context=user_context)
        return jsonify({
            "success": True,
            "suggestions": suggestions,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"❌ Suggested tasks error: {e}")
        return jsonify({"error": "Failed to get suggested tasks"}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT', 'DELETE'])
def update_task(task_id):
    """Update or delete specific task"""
    try:
        if request.method == 'PUT':
            # Update task
            data = request.get_json()
            task = task_manager.update_task(task_id, data)
            return jsonify({"success": True, "task": task})
            
        elif request.method == 'DELETE':
            # Delete task
            success = task_manager.delete_task(task_id)
            return jsonify({"success": success})
            
    except Exception as e:
        print(f"❌ Task update error: {e}")
        return jsonify({"error": "Task operation failed"}), 500

@app.route('/api/memory/reflect', methods=['POST'])
def save_reflection():
    """Save user reflection to long-term memory"""
    try:
        data = request.get_json()
        
        if not data or 'reflection' not in data:
            return jsonify({"error": "Reflection content is required"}), 400
        
        reflection = data['reflection']
        category = data.get('category', 'general')
        
        # Save to long-term memory
        result = memory_manager.save_reflection(reflection, category)
        
        return jsonify({
            "success": True,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Reflection save error: {e}")
        return jsonify({"error": "Failed to save reflection"}), 500

@app.route('/api/memory/remember', methods=['POST'])
def remember_conversation():
    """Move important conversation data to long-term memory"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({"error": "Content is required"}), 400
        
        content = data['content']
        importance = data.get('importance', 'medium')
        
        # Save to long-term memory
        result = memory_manager.remember_important(content, importance)
        
        return jsonify({
            "success": True,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Remember operation error: {e}")
        return jsonify({"error": "Failed to save to memory"}), 500

@app.route('/api/memory/show', methods=['GET'])
def show_memories():
    """Show user's stored memories and facts"""
    try:
        # Get user profile and memories
        user_profile = memory_manager.get_user_profile()
        reflections = memory_manager.get_user_reflections(limit=5)
        important_memories = memory_manager.get_relevant_memories("", n_results=5)
        
        # Format memories for display
        memories = {
            "profile": user_profile.get("profile", {}),
            "recent_reflections": reflections,
            "important_memories": important_memories,
            "memory_stats": memory_manager.get_memory_stats()
        }
        
        return jsonify({
            "success": True,
            "memories": memories,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error showing memories: {e}")
        return jsonify({"error": "Failed to retrieve memories"}), 500

@app.route('/api/memory/category', methods=['GET'])
def get_memory_by_category():
    """Get user memories by category (e.g., support_preferences, pets, feelings)"""
    try:
        category = request.args.get('category')
        if not category:
            return jsonify({"error": "Category is required as a query parameter."}), 400
        facts = memory_manager.get_user_memory_category(category)
        return jsonify({
            "success": True,
            "category": category,
            "facts": facts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"❌ Error getting memory by category: {e}")
        return jsonify({"error": "Failed to retrieve category memories"}), 500

@app.route('/api/personality/modes', methods=['GET'])
def get_personality_modes():
    """Get available personality modes"""
    try:
        modes = personality_manager.get_available_modes()
        current_mode = personality_manager.get_current_mode()
        
        return jsonify({
            "modes": modes,
            "current_mode": current_mode,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Personality modes error: {e}")
        return jsonify({"error": "Failed to get personality modes"}), 500

@app.route('/api/personality/mode', methods=['POST'])
def set_personality_mode():
    """Set the AI personality mode"""
    try:
        data = request.get_json()
        
        if not data or 'mode' not in data:
            return jsonify({"error": "Personality mode is required"}), 400
        
        mode = data['mode']
        success = personality_manager.set_mode(mode)
        
        return jsonify({
            "success": success,
            "current_mode": mode,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"❌ Set personality mode error: {e}")
        return jsonify({"error": "Failed to set personality mode"}), 500

@app.route('/api/journal/start', methods=['POST'])
def start_journal_entry():
    """Start a new journal entry (save to journals collection)"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        text = data.get('text')
        if not user_id or not text:
            return jsonify({"error": "userId and text are required."}), 400
        result = memory_manager.save_journal_entry(user_id, text)
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error saving journal entry: {e}")
        return jsonify({"error": "Failed to save journal entry."}), 500

@app.route('/api/journal/latest', methods=['GET'])
def get_latest_journal_entry():
    """Get the latest journal entry for a user"""
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({"error": "userId is required as a query parameter."}), 400
        result = memory_manager.get_latest_journal_entry(user_id)
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error retrieving latest journal entry: {e}")
        return jsonify({"error": "Failed to retrieve journal entry."}), 500

def process_command(message: str, data: dict) -> dict:
    """Process special commands like #reflect, #mood, #todo, #sos, #remember"""
    try:
        command_parts = message.split(' ', 1)
        command = command_parts[0].lower()
        content = command_parts[1] if len(command_parts) > 1 else ""
        
        if command == '#reflect':
            # Save reflection
            category = data.get('category', 'general')
            result = memory_manager.save_reflection(content, category)
            return {"type": "reflection", "success": True, "result": result}
            
        elif command == '#mood':
            # Log mood
            mood_value = content if content else data.get('mood', 'neutral')
            note = data.get('note', '')
            result = mood_tracker.log_mood(mood_value, note)
            return {"type": "mood", "success": True, "result": result}
            
        elif command == '#todo':
            # Add task
            priority = data.get('priority', 'medium')
            due_date = data.get('due_date')
            task = task_manager.add_task(content, priority=priority, due_date=due_date)
            return {"type": "task", "success": True, "task": task}
            
        elif command == '#remember':
            # Save to long-term memory
            importance = data.get('importance', 'medium')
            result = memory_manager.remember_important(content, importance)
            return {"type": "remember", "success": True, "result": result}
            
        elif command == '#sos':
            # Emergency support
            result = handle_sos_request(content, data)
            return {"type": "sos", "success": True, "result": result}
            
        elif command == '#show':
            # Show user memories
            return {"type": "show_memories", "success": True, "result": show_memories()}
            
        else:
            return {"type": "unknown", "success": False, "error": "Unknown command"}
            
    except Exception as e:
        print(f"❌ Command processing error: {e}")
        return {"type": "error", "success": False, "error": str(e)}

def handle_sos_request(content: str, data: dict) -> dict:
    """Handle SOS emergency support requests"""
    try:
        # Log the SOS request
        sos_data = {
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "urgency": data.get('urgency', 'medium'),
            "location": data.get('location', 'unknown')
        }
        
        # Save to memory for tracking
        memory_manager.save_sos_request(sos_data)
        
        # Generate supportive response
        support_message = generate_sos_response(content, data.get('urgency', 'medium'))
        
        return {
            "message": support_message,
            "resources": get_emergency_resources(),
            "logged": True
        }
        
    except Exception as e:
        print(f"❌ SOS handling error: {e}")
        return {"error": "Failed to process SOS request"}

def generate_sos_response(content: str, urgency: str) -> str:
    """Generate appropriate SOS response based on urgency"""
    if urgency == 'high':
        return ("🚨 I'm here for you. If you're in immediate danger, please contact emergency services "
                "(911, 988 Suicide & Crisis Lifeline). You're not alone - there are people who want to help. "
                "Would you like me to provide some immediate coping strategies?")
    else:
        return ("💙 I hear that you're going through a difficult time. Remember that it's okay to ask for help. "
                "I'm here to listen and support you. Would you like to talk about what's on your mind or "
                "explore some coping techniques together?")

def get_emergency_resources() -> list:
    """Get list of emergency mental health resources"""
    return [
        {
            "name": "988 Suicide & Crisis Lifeline",
            "phone": "988",
            "description": "24/7 crisis support",
            "website": "https://988lifeline.org"
        },
        {
            "name": "Crisis Text Line",
            "phone": "Text HOME to 741741",
            "description": "24/7 text-based crisis support",
            "website": "https://www.crisistextline.org"
        },
        {
            "name": "NAMI (National Alliance on Mental Illness)",
            "phone": "1-800-950-NAMI",
            "description": "Mental health information and support",
            "website": "https://www.nami.org"
        }
    ]

if __name__ == '__main__':
    try:
        # Check for required environment variables
        if not os.getenv('OPENAI_API_KEY'):
            print("⚠️  Warning: OPENAI_API_KEY not found in environment variables")
            print("Please add your OpenAI API key to the .env file")
        
        # Initialize all services
        initialize_services()
        
        # Start the Flask app
        port = int(os.getenv('PORT', 5000))
        debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
        
        print(f"🚀 Starting Mental Wellness AI Assistant on port {port}")
        print(f"🧠 Debug mode: {debug_mode}")
        
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug_mode
        )
        
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        exit(1)
