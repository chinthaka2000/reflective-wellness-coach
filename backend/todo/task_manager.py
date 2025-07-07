"""
📋 Task Manager - Mental wellness-focused task and goal management

Manages tasks with a focus on mental health, wellbeing, and gradual progress.
Integrates with the memory system for persistence and insights.
"""

import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional


class TaskManager:
    """Manages tasks and goals with mental wellness focus"""
    
    def __init__(self, memory_manager):
        """
        Initialize task manager
        
        Args:
            memory_manager: MemoryManager instance for storing task data
        """
        self.memory_manager = memory_manager
        
        # Task priority levels
        self.priority_levels = {
            "low": 1,
            "medium": 2,
            "high": 3,
            "urgent": 4
        }
        
        # Task categories focused on mental wellness
        self.task_categories = {
            "self_care": "Self-care and wellness activities",
            "mindfulness": "Mindfulness and meditation practices",
            "exercise": "Physical activity and movement",
            "social": "Social connections and relationships",
            "work": "Work and professional tasks",
            "personal": "Personal goals and projects",
            "health": "Health and medical appointments",
            "learning": "Learning and skill development",
            "creative": "Creative activities and hobbies",
            "household": "Home and daily maintenance"
        }
        
        print("✅ Task Manager initialized successfully")
    
    def add_task(self, title: str, description: str = "", priority: str = "medium", 
                 due_date: str = None, category: str = "personal", 
                 wellness_impact: str = "neutral") -> Dict[str, Any]:
        """
        Add a new task
        
        Args:
            title: Task title
            description: Task description
            priority: Priority level (low, medium, high, urgent)
            due_date: Due date (ISO format string)
            category: Task category
            wellness_impact: Expected impact on wellness (positive, neutral, challenging)
            
        Returns:
            Created task dictionary
        """
        try:
            # Generate task ID
            task_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()
            
            # Validate and process due date
            parsed_due_date = None
            if due_date:
                try:
                    parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00')).isoformat()
                except (ValueError, AttributeError):
                    # Try parsing common date formats
                    for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M', '%m/%d/%Y', '%d/%m/%Y']:
                        try:
                            parsed_due_date = datetime.strptime(due_date, fmt).replace(tzinfo=timezone.utc).isoformat()
                            break
                        except ValueError:
                            continue
            
            # Create task object
            task = {
                "id": task_id,
                "title": title.strip(),
                "description": description.strip(),
                "priority": priority if priority in self.priority_levels else "medium",
                "category": category if category in self.task_categories else "personal",
                "wellness_impact": wellness_impact,
                "status": "pending",
                "created_at": timestamp,
                "due_date": parsed_due_date,
                "completed_at": None,
                "tags": self._extract_tags(title + " " + description),
                "estimated_effort": self._estimate_effort(title, description),
                "wellness_suggestions": self._generate_wellness_suggestions(category, wellness_impact)
            }
            
            # Store in memory
            self._save_task_to_memory(task)
            
            # Generate motivational message
            motivation = self._generate_task_motivation(task)
            
            return {
                "success": True,
                "task": task,
                "motivation": motivation,
                "wellness_tip": self._get_wellness_tip_for_task(task)
            }
            
        except Exception as e:
            print(f"❌ Error adding task: {e}")
            return {"success": False, "error": str(e)}
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract relevant tags from task text"""
        text_lower = text.lower()
        
        # Common wellness-related tags
        tag_keywords = {
            "exercise": ["exercise", "workout", "gym", "run", "walk", "bike"],
            "meditation": ["meditate", "mindfulness", "breathe", "calm"],
            "social": ["call", "meet", "friend", "family", "visit"],
            "creative": ["draw", "write", "paint", "music", "create"],
            "learning": ["study", "learn", "read", "course", "skill"],
            "health": ["doctor", "appointment", "medicine", "therapy"],
            "urgent": ["urgent", "asap", "deadline", "important"],
            "relaxing": ["relax", "rest", "sleep", "break", "vacation"]
        }
        
        tags = []
        for tag, keywords in tag_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                tags.append(tag)
        
        return tags
    
    def _estimate_effort(self, title: str, description: str) -> str:
        """Estimate effort level for task"""
        text = (title + " " + description).lower()
        
        # High effort keywords
        high_effort_keywords = ["project", "complete", "finish", "major", "big", "complex"]
        
        # Low effort keywords  
        low_effort_keywords = ["quick", "simple", "easy", "call", "email", "check"]
        
        if any(keyword in text for keyword in high_effort_keywords):
            return "high"
        elif any(keyword in text for keyword in low_effort_keywords):
            return "low"
        else:
            return "medium"
    
    def _generate_wellness_suggestions(self, category: str, wellness_impact: str) -> List[str]:
        """Generate wellness suggestions for the task"""
        suggestions = []
        
        # Category-specific suggestions
        category_suggestions = {
            "self_care": [
                "Set a peaceful environment before starting",
                "Practice self-compassion throughout",
                "Celebrate completing this self-care activity"
            ],
            "work": [
                "Take breaks every hour",
                "Practice deep breathing if you feel stressed",
                "Remember that your worth isn't tied to productivity"
            ],
            "exercise": [
                "Start slowly and listen to your body",
                "Focus on how movement makes you feel",
                "Celebrate any movement, no matter how small"
            ],
            "social": [
                "Be present and engaged",
                "Practice active listening",
                "It's okay if social interactions feel challenging"
            ]
        }
        
        suggestions.extend(category_suggestions.get(category, []))
        
        # Wellness impact suggestions
        if wellness_impact == "challenging":
            suggestions.extend([
                "Break this task into smaller, manageable steps",
                "Plan a self-care activity for after completion",
                "Remember it's okay to ask for help"
            ])
        elif wellness_impact == "positive":
            suggestions.extend([
                "Savor the positive feelings this task brings",
                "Notice how accomplishing this improves your mood"
            ])
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def _save_task_to_memory(self, task: Dict[str, Any]):
        """Save task to ChromaDB memory"""
        try:
            # Prepare content for storage
            content = json.dumps(task, indent=2)
            
            metadata = {
                "id": task["id"],
                "type": "task",
                "status": task["status"],
                "priority": task["priority"],
                "category": task["category"],
                "created_at": task["created_at"],
                "due_date": task.get("due_date"),
                "wellness_impact": task["wellness_impact"]
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}

            # Use a collection specifically for tasks (we'll create it in memory manager)
            # For now, use the important_memories collection
            self.memory_manager.important_memories_collection.add(
                ids=[task["id"]],
                documents=[content],
                metadatas=[metadata]
            )
            
            print(f"✅ Task saved to memory: {task['title']}")
            
        except Exception as e:
            print(f"❌ Error saving task to memory: {e}")
    
    def get_all_tasks(self, status: str = None, category: str = None) -> List[Dict[str, Any]]:
        """Get all tasks, optionally filtered by status or category"""
        try:
            # Build filter criteria
            where_filter = {"type": "task"}
            
            if status:
                where_filter["status"] = status
            
            if category:
                where_filter["category"] = category
            
            # Query tasks from memory
            results = self.memory_manager.important_memories_collection.get(
                where=where_filter,
                include=["documents", "metadatas"]
            )
            
            tasks = []
            if results['documents']:
                for i, doc in enumerate(results['documents']):
                    try:
                        task = json.loads(doc)
                        tasks.append(task)
                    except json.JSONDecodeError as e:
                        print(f"❌ Error parsing task: {e}")
                        continue
            
            # Sort tasks by priority and due date
            tasks.sort(key=lambda t: (
                -self.priority_levels.get(t.get('priority', 'medium'), 2),
                t.get('due_date', '9999-12-31')
            ))
            
            return tasks
            
        except Exception as e:
            print(f"❌ Error getting tasks: {e}")
            return []
    
    def update_task(self, task_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing task"""
        try:
            # Get existing task
            existing_tasks = self.get_all_tasks()
            task = next((t for t in existing_tasks if t['id'] == task_id), None)
            
            if not task:
                return {"success": False, "error": "Task not found"}
            
            # Apply updates
            allowed_updates = ['title', 'description', 'priority', 'category', 'status', 
                             'due_date', 'wellness_impact']
            
            for key, value in updates.items():
                if key in allowed_updates:
                    if key == 'status' and value == 'completed' and task['status'] != 'completed':
                        task['completed_at'] = datetime.now(timezone.utc).isoformat()
                    task[key] = value
            
            # Update last modified timestamp
            task['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Save updated task
            self._update_task_in_memory(task)
            
            # Generate completion celebration if task was completed
            celebration = None
            if updates.get('status') == 'completed':
                celebration = self._generate_completion_celebration(task)
            
            return {
                "success": True,
                "task": task,
                "celebration": celebration
            }
            
        except Exception as e:
            print(f"❌ Error updating task: {e}")
            return {"success": False, "error": str(e)}
    
    def _update_task_in_memory(self, task: Dict[str, Any]):
        """Update task in ChromaDB memory"""
        try:
            content = json.dumps(task, indent=2)
            
            metadata = {
                "id": task["id"],
                "type": "task",
                "status": task["status"],
                "priority": task["priority"],
                "category": task["category"],
                "created_at": task["created_at"],
                "due_date": task.get("due_date"),
                "wellness_impact": task["wellness_impact"]
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            # Update in memory
            self.memory_manager.important_memories_collection.update(
                ids=[task["id"]],
                documents=[content],
                metadatas=[metadata]
            )
            
            print(f"✅ Task updated in memory: {task['title']}")
            
        except Exception as e:
            print(f"❌ Error updating task in memory: {e}")
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        try:
            # Delete from memory
            self.memory_manager.important_memories_collection.delete(ids=[task_id])
            
            print(f"✅ Task deleted: {task_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting task: {e}")
            return False
    
    def get_task_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get task completion analytics"""
        try:
            tasks = self.get_all_tasks()
            
            # Filter tasks from the specified period
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            period_tasks = []
            for task in tasks:
                created_at = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
                if created_at >= start_date:
                    period_tasks.append(task)
            
            if not period_tasks:
                return {
                    "period": f"Last {days} days",
                    "total_tasks": 0,
                    "message": "No tasks found for this period"
                }
            
            # Calculate analytics
            total_tasks = len(period_tasks)
            completed_tasks = [t for t in period_tasks if t['status'] == 'completed']
            completion_rate = len(completed_tasks) / total_tasks if total_tasks > 0 else 0
            
            # Category breakdown
            category_counts = {}
            for task in period_tasks:
                category = task.get('category', 'personal')
                category_counts[category] = category_counts.get(category, 0) + 1
            
            # Priority breakdown
            priority_counts = {}
            for task in period_tasks:
                priority = task.get('priority', 'medium')
                priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            # Wellness impact analysis
            wellness_impact_counts = {}
            for task in period_tasks:
                impact = task.get('wellness_impact', 'neutral')
                wellness_impact_counts[impact] = wellness_impact_counts.get(impact, 0) + 1
            
            analytics = {
                "period": f"Last {days} days",
                "total_tasks": total_tasks,
                "completed_tasks": len(completed_tasks),
                "completion_rate": completion_rate,
                "category_breakdown": category_counts,
                "priority_breakdown": priority_counts,
                "wellness_impact_breakdown": wellness_impact_counts,
                "insights": self._generate_task_insights(period_tasks, completed_tasks),
                "recommendations": self._generate_task_recommendations(period_tasks, completion_rate)
            }
            
            return analytics
            
        except Exception as e:
            print(f"❌ Error generating task analytics: {e}")
            return {"error": str(e)}
    
    def _generate_task_insights(self, all_tasks: List[Dict], completed_tasks: List[Dict]) -> List[str]:
        """Generate insights from task data"""
        insights = []
        
        try:
            completion_rate = len(completed_tasks) / len(all_tasks) if all_tasks else 0
            
            # Completion rate insights
            if completion_rate >= 0.8:
                insights.append("🏆 Excellent! You're completing most of your tasks.")
            elif completion_rate >= 0.6:
                insights.append("👍 Good job! You're making solid progress on your tasks.")
            elif completion_rate >= 0.4:
                insights.append("📈 You're making progress, but there's room to improve completion rates.")
            else:
                insights.append("💪 Consider breaking larger tasks into smaller, more manageable steps.")
            
            # Category insights
            category_counts = {}
            for task in all_tasks:
                category = task.get('category', 'personal')
                category_counts[category] = category_counts.get(category, 0) + 1
            
            if category_counts:
                most_common_category = max(category_counts.items(), key=lambda x: x[1])[0]
                insights.append(f"📊 Your most common task category is '{most_common_category}'.")
            
            # Wellness impact insights
            positive_wellness_tasks = [t for t in completed_tasks if t.get('wellness_impact') == 'positive']
            if positive_wellness_tasks:
                insights.append(f"🌟 You completed {len(positive_wellness_tasks)} wellness-positive tasks!")
            
            return insights
            
        except Exception as e:
            print(f"❌ Error generating task insights: {e}")
            return ["Unable to generate insights from current task data."]
    
    def _generate_task_recommendations(self, tasks: List[Dict], completion_rate: float) -> List[str]:
        """Generate task management recommendations"""
        recommendations = []
        
        try:
            # Completion rate recommendations
            if completion_rate < 0.5:
                recommendations.extend([
                    "Consider breaking large tasks into smaller, manageable steps",
                    "Set realistic deadlines that account for your schedule",
                    "Focus on completing 2-3 important tasks rather than many small ones"
                ])
            
            # Category balance recommendations
            category_counts = {}
            for task in tasks:
                category = task.get('category', 'personal')
                category_counts[category] = category_counts.get(category, 0) + 1
            
            self_care_count = category_counts.get('self_care', 0)
            total_tasks = len(tasks)
            
            if total_tasks > 0 and self_care_count / total_tasks < 0.2:
                recommendations.append("Consider adding more self-care tasks to maintain balance")
            
            # General wellness recommendations
            recommendations.extend([
                "Celebrate each completed task, no matter how small",
                "Use the task completion as an opportunity for mindfulness",
                "Remember that productivity doesn't define your worth"
            ])
            
            return recommendations[:5]  # Return top 5 recommendations
            
        except Exception as e:
            print(f"❌ Error generating recommendations: {e}")
            return ["Continue tracking tasks to identify improvement opportunities."]
    
    def _generate_task_motivation(self, task: Dict[str, Any]) -> str:
        """Generate motivational message for new task"""
        category = task.get('category', 'personal')
        wellness_impact = task.get('wellness_impact', 'neutral')
        priority = task.get('priority', 'medium')
        
        motivational_messages = {
            'self_care': "🌸 Taking care of yourself is not selfish—it's essential!",
            'exercise': "💪 Every step counts towards a healthier, happier you!",
            'social': "🤝 Connection is a fundamental human need. Great choice!",
            'mindfulness': "🧘‍♀️ A few moments of mindfulness can transform your entire day.",
            'creative': "🎨 Creativity feeds the soul. Enjoy this creative journey!",
            'work': "⭐ Approach this with intention and remember to take breaks.",
            'learning': "📚 Learning is growing. Your mind will thank you!",
            'health': "❤️ Prioritizing your health is an act of self-love."
        }
        
        base_message = motivational_messages.get(category, "🌟 You've got this! Every task completed is progress made.")
        
        # Add priority-specific encouragement
        if priority == 'urgent':
            base_message += " Remember to breathe and take it one step at a time."
        elif wellness_impact == 'challenging':
            base_message += " Be gentle with yourself as you work on this."
        
        return base_message
    
    def _generate_completion_celebration(self, task: Dict[str, Any]) -> str:
        """Generate celebration message for completed task"""
        celebrations = [
            "🎉 Fantastic! You completed '{}'! Take a moment to appreciate your accomplishment.",
            "✨ Well done! Finishing '{}' shows your dedication and strength.",
            "🏆 Awesome job completing '{}'! You're making great progress.",
            "🌟 Congratulations on finishing '{}'! Your effort is paying off.",
            "💪 You did it! '{}' is complete. Feel proud of your achievement!"
        ]
        
        import random
        celebration = random.choice(celebrations).format(task['title'])
        
        # Add category-specific celebration
        category = task.get('category', 'personal')
        if category == 'self_care':
            celebration += " Your future self will thank you for this self-care! 💖"
        elif category == 'exercise':
            celebration += " Your body and mind are stronger for it! 💪"
        elif category == 'social':
            celebration += " Connection and relationships matter so much! 🤗"
        
        return celebration
    
    def _get_wellness_tip_for_task(self, task: Dict[str, Any]) -> str:
        """Get a wellness tip related to the task"""
        category = task.get('category', 'personal')
        
        wellness_tips = {
            'work': "Remember: You are not your productivity. Take breaks and be kind to yourself.",
            'self_care': "Self-care isn't selfish—it's how you show up better for everything else.",
            'exercise': "Listen to your body. The goal is to feel good, not to punish yourself.",
            'social': "Quality over quantity. One meaningful connection is worth more than many shallow ones.",
            'mindfulness': "Start small. Even 3 minutes of mindfulness can shift your entire day.",
            'creative': "There's no wrong way to be creative. Enjoy the process, not just the outcome.",
            'health': "Small, consistent actions in health create the biggest transformations.",
            'learning': "Learning is a gift you give yourself. Be patient with the process."
        }
        
        return wellness_tips.get(category, "Remember to be patient and kind with yourself through this task. 🌸")
    
    def get_upcoming_tasks(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get tasks due in the next specified days"""
        try:
            all_tasks = self.get_all_tasks(status="pending")
            
            end_date = datetime.now(timezone.utc) + timedelta(days=days)
            upcoming_tasks = []
            
            for task in all_tasks:
                if task.get('due_date'):
                    try:
                        due_date = datetime.fromisoformat(task['due_date'].replace('Z', '+00:00'))
                        if due_date <= end_date:
                            # Calculate days until due
                            days_until_due = (due_date - datetime.now(timezone.utc)).days
                            task['days_until_due'] = days_until_due
                            upcoming_tasks.append(task)
                    except (ValueError, AttributeError):
                        continue
            
            # Sort by due date
            upcoming_tasks.sort(key=lambda t: t['due_date'])
            
            return upcoming_tasks
            
        except Exception as e:
            print(f"❌ Error getting upcoming tasks: {e}")
            return []
    
    def suggest_daily_tasks(self, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Suggest wellness-focused daily tasks based on user context"""
        try:
            suggestions = {
                "self_care": [
                    "Take 5 deep breaths mindfully",
                    "Write down 3 things you're grateful for",
                    "Do something kind for yourself"
                ],
                "movement": [
                    "Take a 10-minute walk",
                    "Do gentle stretches",
                    "Dance to your favorite song"
                ],
                "connection": [
                    "Text a friend to check in",
                    "Call a family member",
                    "Smile at a stranger"
                ],
                "mindfulness": [
                    "Practice 5 minutes of meditation",
                    "Eat one meal mindfully",
                    "Notice 5 things you can see, 4 you can hear, 3 you can touch"
                ],
                "creativity": [
                    "Doodle or draw for 10 minutes",
                    "Write in a journal",
                    "Try a new recipe"
                ]
            }
            
            # Customize based on user context if provided
            if user_context:
                mood = user_context.get('mood', '')
                if mood in ['stressed', 'anxious']:
                    suggestions['priority'] = suggestions['mindfulness'] + suggestions['self_care']
                elif mood in ['sad', 'lonely']:
                    suggestions['priority'] = suggestions['connection'] + suggestions['movement']
                elif mood in ['bored', 'restless']:
                    suggestions['priority'] = suggestions['creativity'] + suggestions['movement']
            
            return {
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "suggestions": suggestions,
                "tip": "Pick just 1-2 activities that feel good to you today. Small actions create big changes! 🌱"
            }
            
        except Exception as e:
            print(f"❌ Error generating daily task suggestions: {e}")
            return {"error": str(e)}
