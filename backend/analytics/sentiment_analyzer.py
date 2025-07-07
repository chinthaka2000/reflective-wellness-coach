"""
💭 Sentiment Analyzer - Real-time sentiment analysis for user messages

Analyzes emotional tone and sentiment of user messages to provide
better contextual responses and insights.
"""

import re
from typing import Dict, List, Any, Optional
from textblob import TextBlob
import numpy as np


class SentimentAnalyzer:
    """Analyzes sentiment and emotional tone of user messages"""
    
    def __init__(self):
        """Initialize sentiment analyzer with emotion keywords"""
        self.emotion_keywords = self._load_emotion_keywords()
        self.intensity_modifiers = self._load_intensity_modifiers()
        
        print("✅ Sentiment Analyzer initialized successfully")
    
    def _load_emotion_keywords(self) -> Dict[str, List[str]]:
        """Load emotion keyword dictionaries"""
        return {
            "joy": [
                "happy", "joyful", "excited", "thrilled", "elated", "cheerful",
                "delighted", "pleased", "content", "glad", "euphoric", "blissful",
                "overjoyed", "ecstatic", "wonderful", "amazing", "fantastic"
            ],
            "sadness": [
                "sad", "depressed", "down", "blue", "melancholy", "gloomy",
                "dejected", "despondent", "heartbroken", "miserable", "sorrowful",
                "grief", "mourn", "weep", "cry", "tearful", "devastated"
            ],
            "anger": [
                "angry", "mad", "furious", "rage", "irritated", "annoyed",
                "frustrated", "outraged", "livid", "enraged", "hostile",
                "resentful", "bitter", "aggravated", "pissed", "irate"
            ],
            "fear": [
                "afraid", "scared", "terrified", "frightened", "anxious",
                "worried", "nervous", "panic", "phobia", "dread", "alarmed",
                "apprehensive", "uneasy", "concerned", "stressed", "overwhelmed"
            ],
            "disgust": [
                "disgusted", "revolted", "repulsed", "sickened", "nauseated",
                "appalled", "horrified", "repelled", "grossed", "offended"
            ],
            "surprise": [
                "surprised", "shocked", "amazed", "astonished", "stunned",
                "bewildered", "startled", "astounded", "flabbergasted"
            ],
            "trust": [
                "trust", "confident", "secure", "safe", "comfortable",
                "reassured", "certain", "believing", "faith", "reliable"
            ],
            "anticipation": [
                "excited", "eager", "hopeful", "optimistic", "expectant",
                "anticipating", "looking forward", "can't wait", "pumped"
            ]
        }
    
    def _load_intensity_modifiers(self) -> Dict[str, float]:
        """Load intensity modifier words"""
        return {
            # Amplifiers
            "very": 1.5,
            "extremely": 2.0,
            "incredibly": 2.0,
            "absolutely": 1.8,
            "completely": 1.7,
            "totally": 1.6,
            "really": 1.4,
            "quite": 1.3,
            "pretty": 1.2,
            "so": 1.4,
            "super": 1.6,
            "ultra": 1.8,
            
            # Diminishers
            "slightly": 0.7,
            "somewhat": 0.8,
            "kind of": 0.8,
            "sort of": 0.8,
            "a bit": 0.7,
            "a little": 0.6,
            "barely": 0.5,
            "hardly": 0.4,
            "scarcely": 0.4,
            
            # Negations (handled separately)
            "not": -1.0,
            "no": -1.0,
            "never": -1.0,
            "nothing": -1.0,
            "nobody": -1.0,
            "nowhere": -1.0
        }
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Perform comprehensive sentiment analysis
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        try:
            if not text or not text.strip():
                return self._get_neutral_sentiment()
            
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Basic sentiment analysis using TextBlob
            blob_sentiment = self._get_textblob_sentiment(cleaned_text)
            
            # Emotion detection
            emotions = self._detect_emotions(cleaned_text)
            
            # Mental health indicators
            mental_health_indicators = self._detect_mental_health_indicators(cleaned_text)
            
            # Urgency detection
            urgency_level = self._detect_urgency(cleaned_text)
            
            # Overall sentiment classification
            overall_sentiment = self._classify_overall_sentiment(blob_sentiment, emotions)
            
            # Generate insights
            insights = self._generate_sentiment_insights(
                overall_sentiment, emotions, mental_health_indicators, urgency_level
            )
            
            return {
                "overall_sentiment": overall_sentiment,
                "polarity": blob_sentiment["polarity"],
                "subjectivity": blob_sentiment["subjectivity"],
                "emotions": emotions,
                "mental_health_indicators": mental_health_indicators,
                "urgency_level": urgency_level,
                "insights": insights,
                "confidence": self._calculate_confidence(blob_sentiment, emotions)
            }
            
        except Exception as e:
            print(f"❌ Error in sentiment analysis: {e}")
            return self._get_error_sentiment()
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for analysis"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove excessive punctuation
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        text = re.sub(r'[.]{3,}', '...', text)
        
        # Handle contractions
        contractions = {
            "won't": "will not",
            "can't": "cannot",
            "n't": " not",
            "'re": " are",
            "'ve": " have",
            "'ll": " will",
            "'d": " would",
            "'m": " am"
        }
        
        for contraction, expansion in contractions.items():
            text = text.replace(contraction, expansion)
        
        return text
    
    def _get_textblob_sentiment(self, text: str) -> Dict[str, float]:
        """Get sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            return {
                "polarity": blob.sentiment.polarity,
                "subjectivity": blob.sentiment.subjectivity
            }
        except Exception as e:
            print(f"❌ Error in TextBlob sentiment: {e}")
            return {"polarity": 0.0, "subjectivity": 0.0}
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect emotions in text using keyword matching"""
        emotion_scores = {}
        words = text.split()
        
        for emotion, keywords in self.emotion_keywords.items():
            score = 0.0
            
            for i, word in enumerate(words):
                # Check if word matches emotion keyword
                if any(keyword in word for keyword in keywords):
                    base_score = 1.0
                    
                    # Apply intensity modifiers
                    if i > 0:
                        prev_word = words[i-1]
                        if prev_word in self.intensity_modifiers:
                            modifier = self.intensity_modifiers[prev_word]
                            if modifier < 0:  # Negation
                                base_score *= -1
                            else:
                                base_score *= modifier
                    
                    score += base_score
            
            # Normalize score
            emotion_scores[emotion] = min(score / max(len(words) / 10, 1), 1.0)
        
        return emotion_scores
    
    def _detect_mental_health_indicators(self, text: str) -> Dict[str, Any]:
        """Detect mental health-related indicators"""
        indicators = {
            "depression_signs": [],
            "anxiety_signs": [],
            "stress_indicators": [],
            "positive_coping": [],
            "support_seeking": [],
            "crisis_indicators": []
        }
        
        # Depression indicators
        depression_keywords = [
            "hopeless", "worthless", "empty", "numb", "exhausted",
            "can't sleep", "no energy", "don't care", "giving up",
            "pointless", "useless", "burden"
        ]
        
        # Anxiety indicators
        anxiety_keywords = [
            "panic", "racing thoughts", "can't breathe", "heart racing",
            "sweating", "shaking", "dizzy", "nauseous", "restless",
            "on edge", "jumpy"
        ]
        
        # Stress indicators
        stress_keywords = [
            "overwhelmed", "pressure", "deadline", "too much",
            "can't handle", "breaking point", "stressed out",
            "burned out", "exhausted"
        ]
        
        # Positive coping
        positive_keywords = [
            "meditation", "exercise", "therapy", "counseling",
            "support group", "self care", "journaling", "mindfulness",
            "breathing exercises", "talking to someone"
        ]
        
        # Support seeking
        support_keywords = [
            "need help", "talk to someone", "therapist", "counselor",
            "support", "advice", "guidance", "professional help"
        ]
        
        # Crisis indicators
        crisis_keywords = [
            "end it all", "can't go on", "no point", "better off dead",
            "hurt myself", "suicide", "kill myself", "end my life"
        ]
        
        # Check for indicators
        for keyword in depression_keywords:
            if keyword in text:
                indicators["depression_signs"].append(keyword)
        
        for keyword in anxiety_keywords:
            if keyword in text:
                indicators["anxiety_signs"].append(keyword)
        
        for keyword in stress_keywords:
            if keyword in text:
                indicators["stress_indicators"].append(keyword)
        
        for keyword in positive_keywords:
            if keyword in text:
                indicators["positive_coping"].append(keyword)
        
        for keyword in support_keywords:
            if keyword in text:
                indicators["support_seeking"].append(keyword)
        
        for keyword in crisis_keywords:
            if keyword in text:
                indicators["crisis_indicators"].append(keyword)
        
        return indicators
    
    def _detect_urgency(self, text: str) -> str:
        """Detect urgency level of the message"""
        # Crisis indicators
        crisis_patterns = [
            "end it all", "can't go on", "hurt myself", "kill myself",
            "suicide", "end my life", "no point living"
        ]
        
        # High urgency indicators
        high_urgency_patterns = [
            "emergency", "urgent", "crisis", "immediate help",
            "can't breathe", "panic attack", "breaking down"
        ]
        
        # Medium urgency indicators
        medium_urgency_patterns = [
            "really struggling", "need help", "can't handle",
            "breaking point", "overwhelmed", "desperate"
        ]
        
        # Check patterns
        if any(pattern in text for pattern in crisis_patterns):
            return "crisis"
        elif any(pattern in text for pattern in high_urgency_patterns):
            return "high"
        elif any(pattern in text for pattern in medium_urgency_patterns):
            return "medium"
        else:
            return "low"
    
    def _classify_overall_sentiment(self, blob_sentiment: Dict[str, float], 
                                  emotions: Dict[str, float]) -> str:
        """Classify overall sentiment"""
        polarity = blob_sentiment["polarity"]
        
        # Get dominant emotion
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else None
        
        # Classify based on polarity and emotions
        if polarity >= 0.3:
            return "positive"
        elif polarity <= -0.3:
            return "negative"
        elif dominant_emotion in ["sadness", "fear", "anger", "disgust"]:
            return "negative"
        elif dominant_emotion in ["joy", "trust", "anticipation"]:
            return "positive"
        else:
            return "neutral"
    
    def _generate_sentiment_insights(self, sentiment: str, emotions: Dict[str, float],
                                   mental_health: Dict[str, Any], urgency: str) -> List[str]:
        """Generate insights based on sentiment analysis"""
        insights = []
        
        # Sentiment insights
        if sentiment == "negative":
            insights.append("The message expresses negative emotions or concerns")
        elif sentiment == "positive":
            insights.append("The message expresses positive emotions or experiences")
        else:
            insights.append("The message has a neutral emotional tone")
        
        # Emotion insights
        dominant_emotions = [k for k, v in emotions.items() if v > 0.3]
        if dominant_emotions:
            insights.append(f"Dominant emotions detected: {', '.join(dominant_emotions)}")
        
        # Mental health insights
        if mental_health["crisis_indicators"]:
            insights.append("⚠️ Crisis indicators detected - immediate support may be needed")
        elif mental_health["depression_signs"]:
            insights.append("Signs of depression detected")
        elif mental_health["anxiety_signs"]:
            insights.append("Signs of anxiety detected")
        
        if mental_health["positive_coping"]:
            insights.append("✅ Positive coping strategies mentioned")
        
        if mental_health["support_seeking"]:
            insights.append("User appears to be seeking support or help")
        
        # Urgency insights
        if urgency == "crisis":
            insights.append("🚨 CRISIS LEVEL: Immediate intervention may be required")
        elif urgency == "high":
            insights.append("High urgency: User needs prompt support")
        elif urgency == "medium":
            insights.append("Medium urgency: User would benefit from support")
        
        return insights
    
    def _calculate_confidence(self, blob_sentiment: Dict[str, float], 
                            emotions: Dict[str, float]) -> float:
        """Calculate confidence score for the analysis"""
        try:
            # Base confidence from subjectivity (more subjective = more confident about sentiment)
            subjectivity_confidence = blob_sentiment["subjectivity"]
            
            # Emotion detection confidence
            emotion_confidence = max(emotions.values()) if emotions else 0.0
            
            # Combined confidence
            confidence = (subjectivity_confidence + emotion_confidence) / 2
            
            return min(confidence, 1.0)
            
        except Exception:
            return 0.5
    
    def _get_neutral_sentiment(self) -> Dict[str, Any]:
        """Return neutral sentiment for empty input"""
        return {
            "overall_sentiment": "neutral",
            "polarity": 0.0,
            "subjectivity": 0.0,
            "emotions": {},
            "mental_health_indicators": {
                "depression_signs": [],
                "anxiety_signs": [],
                "stress_indicators": [],
                "positive_coping": [],
                "support_seeking": [],
                "crisis_indicators": []
            },
            "urgency_level": "low",
            "insights": ["No text provided for analysis"],
            "confidence": 0.0
        }
    
    def _get_error_sentiment(self) -> Dict[str, Any]:
        """Return error sentiment for analysis failures"""
        return {
            "overall_sentiment": "unknown",
            "polarity": 0.0,
            "subjectivity": 0.0,
            "emotions": {},
            "mental_health_indicators": {
                "depression_signs": [],
                "anxiety_signs": [],
                "stress_indicators": [],
                "positive_coping": [],
                "support_seeking": [],
                "crisis_indicators": []
            },
            "urgency_level": "low",
            "insights": ["Error occurred during sentiment analysis"],
            "confidence": 0.0
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyze sentiment for multiple texts"""
        return [self.analyze(text) for text in texts]
    
    def get_emotional_summary(self, sentiments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get emotional summary from multiple sentiment analyses"""
        try:
            if not sentiments:
                return {"error": "No sentiments to summarize"}
            
            # Aggregate emotions
            emotion_totals = {}
            total_polarity = 0
            total_subjectivity = 0
            urgency_counts = {"low": 0, "medium": 0, "high": 0, "crisis": 0}
            
            for sentiment in sentiments:
                # Sum emotions
                for emotion, score in sentiment.get("emotions", {}).items():
                    emotion_totals[emotion] = emotion_totals.get(emotion, 0) + score
                
                # Sum polarities
                total_polarity += sentiment.get("polarity", 0)
                total_subjectivity += sentiment.get("subjectivity", 0)
                
                # Count urgency levels
                urgency = sentiment.get("urgency_level", "low")
                urgency_counts[urgency] += 1
            
            # Calculate averages
            count = len(sentiments)
            avg_emotions = {k: v/count for k, v in emotion_totals.items()}
            avg_polarity = total_polarity / count
            avg_subjectivity = total_subjectivity / count
            
            return {
                "average_emotions": avg_emotions,
                "average_polarity": avg_polarity,
                "average_subjectivity": avg_subjectivity,
                "urgency_distribution": urgency_counts,
                "total_messages": count,
                "dominant_emotion": max(avg_emotions.items(), key=lambda x: x[1])[0] if avg_emotions else None
            }
            
        except Exception as e:
            print(f"❌ Error generating emotional summary: {e}")
            return {"error": str(e)}
