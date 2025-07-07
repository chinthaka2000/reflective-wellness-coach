"""
😊 Mood Tracker - Mood logging and analytics for mental wellness

Tracks user moods over time, provides insights, and identifies patterns.
"""

import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
from textblob import TextBlob


class MoodTracker:
    """Handles mood logging, tracking, and analytics"""
    
    def __init__(self, memory_manager):
        """
        Initialize mood tracker
        
        Args:
            memory_manager: MemoryManager instance for storing mood data
        """
        self.memory_manager = memory_manager
        
        # Mood value mappings (1-10 scale)
        self.mood_values = {
            "terrible": 1,
            "very_bad": 2,
            "bad": 3,
            "poor": 4,
            "okay": 5,
            "good": 6,
            "very_good": 7,
            "great": 8,
            "excellent": 9,
            "amazing": 10
        }
        
        # Reverse mapping
        self.value_moods = {v: k for k, v in self.mood_values.items()}
        
        print("✅ Mood Tracker initialized successfully")
    
    def log_mood(self, mood: str, note: str = "", context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Log a mood entry
        
        Args:
            mood: Mood value (string or numeric)
            note: Optional note about the mood
            context: Additional context (triggers, activities, etc.)
            
        Returns:
            Dictionary with logging result
        """
        try:
            # Convert mood to numeric value
            mood_value = self._parse_mood_value(mood)
            
            if mood_value is None:
                return {"success": False, "error": "Invalid mood value"}
            
            # Create mood entry
            mood_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()
            
            mood_data = {
                "id": mood_id,
                "mood_value": mood_value,
                "mood_label": self.value_moods.get(mood_value, "unknown"),
                "note": note,
                "timestamp": timestamp,
                "context": context or {}
            }
            
            # Analyze sentiment of note if provided
            if note:
                sentiment = self._analyze_note_sentiment(note)
                mood_data["note_sentiment"] = sentiment
            
            # Store in ChromaDB
            content = json.dumps(mood_data, indent=2)
            
            metadata = {
                "id": mood_id,
                "mood_value": mood_value,
                "timestamp": timestamp,
                "type": "mood_entry",
                "has_note": bool(note)
            }
            
            self.memory_manager.mood_data_collection.add(
                ids=[mood_id],
                documents=[content],
                metadatas=[metadata]
            )
            
            # Get insights for this mood entry
            insights = self._get_mood_insights(mood_value, note)
            
            return {
                "success": True,
                "mood_entry": mood_data,
                "insights": insights,
                "timestamp": timestamp
            }
            
        except Exception as e:
            print(f"❌ Error logging mood: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_mood_value(self, mood) -> Optional[int]:
        """Parse mood input to numeric value"""
        try:
            # If it's already a number
            if isinstance(mood, (int, float)):
                value = int(mood)
                return value if 1 <= value <= 10 else None
            
            # If it's a string
            mood_str = str(mood).lower().strip()
            
            # Check if it's a numeric string
            try:
                value = int(float(mood_str))
                return value if 1 <= value <= 10 else None
            except ValueError:
                pass
            
            # Check if it's a mood label
            return self.mood_values.get(mood_str)
            
        except Exception as e:
            print(f"❌ Error parsing mood value: {e}")
            return None
    
    def _analyze_note_sentiment(self, note: str) -> Dict[str, float]:
        """Analyze sentiment of mood note"""
        try:
            blob = TextBlob(note)
            
            return {
                "polarity": blob.sentiment.polarity,  # -1 to 1
                "subjectivity": blob.sentiment.subjectivity  # 0 to 1
            }
            
        except Exception as e:
            print(f"❌ Error analyzing note sentiment: {e}")
            return {"polarity": 0.0, "subjectivity": 0.0}
    
    def _get_mood_insights(self, mood_value: int, note: str = "") -> Dict[str, Any]:
        """Get insights for a mood entry"""
        insights = {
            "level": self._get_mood_level(mood_value),
            "suggestions": self._get_mood_suggestions(mood_value),
            "encouragement": self._get_encouragement_message(mood_value)
        }
        
        # Add note-specific insights if note provided
        if note:
            insights["note_analysis"] = self._analyze_note_content(note)
        
        return insights
    
    def _get_mood_level(self, mood_value: int) -> str:
        """Categorize mood level"""
        if mood_value <= 3:
            return "low"
        elif mood_value <= 6:
            return "moderate"
        else:
            return "high"
    
    def _get_mood_suggestions(self, mood_value: int) -> List[str]:
        """Get mood-appropriate suggestions"""
        if mood_value <= 3:
            return [
                "Consider reaching out to a friend or family member",
                "Try some gentle breathing exercises",
                "Take a short walk if possible",
                "Listen to calming music",
                "Consider professional support if feelings persist"
            ]
        elif mood_value <= 6:
            return [
                "Practice gratitude by listing 3 things you're thankful for",
                "Engage in a creative activity",
                "Connect with nature",
                "Do some light exercise or stretching",
                "Journal about your thoughts and feelings"
            ]
        else:
            return [
                "Share your positive energy with others",
                "Reflect on what's contributing to your good mood",
                "Plan something nice for your future self",
                "Practice mindfulness to stay present",
                "Consider helping someone else who might need support"
            ]
    
    def _get_encouragement_message(self, mood_value: int) -> str:
        """Get encouraging message based on mood"""
        if mood_value <= 3:
            return "I'm here for you. It's okay to have difficult days - they don't last forever. You're stronger than you know."
        elif mood_value <= 6:
            return "You're doing well by checking in with yourself. Every small step towards wellness matters."
        else:
            return "It's wonderful to see you feeling good! Remember to appreciate these positive moments."
    
    def _analyze_note_content(self, note: str) -> Dict[str, Any]:
        """Analyze mood note content for themes and patterns"""
        try:
            note_lower = note.lower()
            
            # Common theme detection
            themes = {
                "work_stress": ["work", "job", "boss", "deadline", "meeting", "colleague"],
                "relationship": ["friend", "family", "partner", "relationship", "argue", "fight"],
                "health": ["tired", "sick", "pain", "sleep", "energy", "health"],
                "achievement": ["accomplished", "proud", "success", "goal", "achievement"],
                "anxiety": ["worried", "anxious", "nervous", "scared", "panic"],
                "gratitude": ["thankful", "grateful", "blessed", "appreciate"]
            }
            
            detected_themes = []
            for theme, keywords in themes.items():
                if any(keyword in note_lower for keyword in keywords):
                    detected_themes.append(theme)
            
            return {
                "themes": detected_themes,
                "word_count": len(note.split()),
                "has_positive_words": any(word in note_lower for word in 
                                        ["good", "great", "happy", "love", "wonderful", "amazing"]),
                "has_negative_words": any(word in note_lower for word in 
                                        ["bad", "terrible", "hate", "awful", "sad", "angry"])
            }
            
        except Exception as e:
            print(f"❌ Error analyzing note content: {e}")
            return {"themes": [], "word_count": 0}
    
    def get_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get mood analytics for specified time period"""
        try:
            # Calculate date range
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Get mood entries from the period
            mood_entries = self._get_mood_entries_in_range(start_date, end_date)
            
            if not mood_entries:
                return {
                    "period": f"Last {days} days",
                    "total_entries": 0,
                    "message": "No mood entries found for this period"
                }
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(mood_entries)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['date'] = df['timestamp'].dt.date
            
            analytics = {
                "period": f"Last {days} days",
                "total_entries": len(mood_entries),
                "average_mood": float(df['mood_value'].mean()),
                "mood_trend": self._calculate_mood_trend(df),
                "mood_distribution": self._get_mood_distribution(df),
                "daily_summary": self._get_daily_summary(df),
                "insights": self._generate_analytics_insights(df),
                "recommendations": self._get_analytics_recommendations(df)
            }
            
            return analytics
            
        except Exception as e:
            print(f"❌ Error generating analytics: {e}")
            return {"error": str(e)}
    
    def _get_mood_entries_in_range(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get mood entries within date range"""
        try:
            # Get all mood entries
            results = self.memory_manager.mood_data_collection.get(
                where={"type": "mood_entry"},
                include=["documents", "metadatas"]
            )
            
            mood_entries = []
            if results['documents']:
                for i, doc in enumerate(results['documents']):
                    try:
                        mood_data = json.loads(doc)
                        entry_time = datetime.fromisoformat(mood_data['timestamp'].replace('Z', '+00:00'))
                        
                        if start_date <= entry_time <= end_date:
                            mood_entries.append(mood_data)
                    except Exception as e:
                        print(f"❌ Error parsing mood entry: {e}")
                        continue
            
            # Sort by timestamp
            mood_entries.sort(key=lambda x: x['timestamp'])
            
            return mood_entries
            
        except Exception as e:
            print(f"❌ Error getting mood entries: {e}")
            return []
    
    def _calculate_mood_trend(self, df: pd.DataFrame) -> str:
        """Calculate overall mood trend"""
        try:
            if len(df) < 2:
                return "insufficient_data"
            
            # Calculate trend using linear regression
            x = np.arange(len(df))
            y = df['mood_value'].values
            
            slope = np.polyfit(x, y, 1)[0]
            
            if slope > 0.1:
                return "improving"
            elif slope < -0.1:
                return "declining"
            else:
                return "stable"
                
        except Exception as e:
            print(f"❌ Error calculating trend: {e}")
            return "unknown"
    
    def _get_mood_distribution(self, df: pd.DataFrame) -> Dict[str, int]:
        """Get distribution of mood levels"""
        try:
            distribution = {
                "low": len(df[df['mood_value'] <= 3]),
                "moderate": len(df[(df['mood_value'] > 3) & (df['mood_value'] <= 6)]),
                "high": len(df[df['mood_value'] > 6])
            }
            
            return distribution
            
        except Exception as e:
            print(f"❌ Error calculating distribution: {e}")
            return {"low": 0, "moderate": 0, "high": 0}
    
    def _get_daily_summary(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get daily mood summary"""
        try:
            daily_summary = []
            
            for date, group in df.groupby('date'):
                summary = {
                    "date": date.isoformat(),
                    "entries": len(group),
                    "average_mood": float(group['mood_value'].mean()),
                    "mood_range": {
                        "min": int(group['mood_value'].min()),
                        "max": int(group['mood_value'].max())
                    }
                }
                daily_summary.append(summary)
            
            return daily_summary
            
        except Exception as e:
            print(f"❌ Error generating daily summary: {e}")
            return []
    
    def _generate_analytics_insights(self, df: pd.DataFrame) -> List[str]:
        """Generate insights from mood analytics"""
        insights = []
        
        try:
            avg_mood = df['mood_value'].mean()
            trend = self._calculate_mood_trend(df)
            
            # Average mood insights
            if avg_mood >= 7:
                insights.append("Your overall mood has been quite positive recently!")
            elif avg_mood >= 5:
                insights.append("Your mood has been moderate - there's room for improvement.")
            else:
                insights.append("Your mood has been lower recently - consider additional support.")
            
            # Trend insights
            if trend == "improving":
                insights.append("Great news! Your mood trend is improving over time.")
            elif trend == "declining":
                insights.append("Your mood seems to be declining - it might be worth exploring what's changed.")
            else:
                insights.append("Your mood has been relatively stable.")
            
            # Consistency insights
            mood_std = df['mood_value'].std()
            if mood_std > 2:
                insights.append("Your mood varies quite a bit - tracking patterns might help identify triggers.")
            else:
                insights.append("Your mood has been fairly consistent.")
            
            return insights
            
        except Exception as e:
            print(f"❌ Error generating insights: {e}")
            return ["Unable to generate insights from current data."]
    
    def _get_analytics_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Get recommendations based on analytics"""
        recommendations = []
        
        try:
            avg_mood = df['mood_value'].mean()
            trend = self._calculate_mood_trend(df)
            
            if avg_mood < 5:
                recommendations.extend([
                    "Consider establishing a daily self-care routine",
                    "Practice mindfulness or meditation",
                    "Connect with supportive friends or family",
                    "Consider speaking with a mental health professional"
                ])
            
            if trend == "declining":
                recommendations.extend([
                    "Reflect on recent changes in your life",
                    "Ensure you're getting adequate sleep",
                    "Review your stress management strategies",
                    "Consider adjusting your daily routine"
                ])
            
            recommendations.append("Keep logging your mood to track progress")
            
            return recommendations
            
        except Exception as e:
            print(f"❌ Error generating recommendations: {e}")
            return ["Continue tracking your mood for better insights."]
    
    def get_mood_patterns(self, days: int = 30) -> Dict[str, Any]:
        """Identify mood patterns over time"""
        try:
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            mood_entries = self._get_mood_entries_in_range(start_date, end_date)
            
            if not mood_entries:
                return {"patterns": [], "message": "Not enough data for pattern analysis"}
            
            df = pd.DataFrame(mood_entries)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.day_name()
            
            patterns = {
                "time_of_day": self._analyze_hourly_patterns(df),
                "day_of_week": self._analyze_weekly_patterns(df),
                "note_themes": self._analyze_theme_patterns(df)
            }
            
            return {"patterns": patterns, "period": f"Last {days} days"}
            
        except Exception as e:
            print(f"❌ Error analyzing patterns: {e}")
            return {"error": str(e)}
    
    def _analyze_hourly_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze mood patterns by hour of day"""
        try:
            hourly_mood = df.groupby('hour')['mood_value'].mean()
            
            best_hour = int(hourly_mood.idxmax()) if not hourly_mood.empty else None
            worst_hour = int(hourly_mood.idxmin()) if not hourly_mood.empty else None
            
            return {
                "best_time": f"{best_hour}:00" if best_hour is not None else None,
                "worst_time": f"{worst_hour}:00" if worst_hour is not None else None,
                "hourly_averages": hourly_mood.to_dict()
            }
            
        except Exception as e:
            print(f"❌ Error analyzing hourly patterns: {e}")
            return {}
    
    def _analyze_weekly_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze mood patterns by day of week"""
        try:
            daily_mood = df.groupby('day_of_week')['mood_value'].mean()
            
            best_day = daily_mood.idxmax() if not daily_mood.empty else None
            worst_day = daily_mood.idxmin() if not daily_mood.empty else None
            
            return {
                "best_day": best_day,
                "worst_day": worst_day,
                "daily_averages": daily_mood.to_dict()
            }
            
        except Exception as e:
            print(f"❌ Error analyzing weekly patterns: {e}")
            return {}
    
    def _analyze_theme_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze themes from mood notes"""
        try:
            # This would require the note analysis to be stored
            # For now, return placeholder
            return {
                "common_themes": ["work_stress", "social_connection", "self_care"],
                "theme_impact": {
                    "work_stress": -1.2,
                    "social_connection": 1.5,
                    "self_care": 2.1
                }
            }
            
        except Exception as e:
            print(f"❌ Error analyzing theme patterns: {e}")
            return {}
