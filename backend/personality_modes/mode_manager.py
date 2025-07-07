"""
🎭 Personality Mode Manager - AI Personality Modes for Mental Wellness

Manages different AI personality modes to provide varied interaction styles
based on user needs and preferences.
"""

from typing import Dict, List, Any


class PersonalityModeManager:
    """Manages AI personality modes and switching between them"""
    
    def __init__(self):
        """Initialize personality mode manager"""
        self.current_mode = "calm_coach"
        self.personality_modes = self._load_personality_modes()
        
        print("✅ Personality Mode Manager initialized successfully")
    
    def _load_personality_modes(self) -> Dict[str, Dict[str, Any]]:
        """Load all available personality modes"""
        return {
            "calm_coach": {
                "name": "Calm Coach",
                "description": "A gentle, patient, and nurturing guide who speaks softly and offers reassuring guidance",
                "emoji": "🧘‍♀️",
                "characteristics": [
                    "Patient and understanding",
                    "Speaks in a gentle, soothing tone",
                    "Focuses on mindfulness and gradual progress",
                    "Emphasizes self-compassion",
                    "Uses calming language and metaphors"
                ],
                "communication_style": {
                    "tone": "gentle, soothing, patient",
                    "pace": "slow and deliberate",
                    "language": "soft, reassuring, mindful",
                    "approach": "gradual, non-pressuring"
                },
                "specialties": [
                    "Anxiety management",
                    "Mindfulness practices",
                    "Stress reduction",
                    "Self-compassion building",
                    "Breathing exercises"
                ],
                "sample_responses": [
                    "Take a deep breath with me. You're safe here, and we can work through this together, one step at a time.",
                    "It's completely natural to feel this way. Let's gently explore what might help you feel more at peace.",
                    "Remember to be kind to yourself. You're doing the best you can with what you have right now."
                ]
            },
            
            "assertive_buddy": {
                "name": "Assertive Buddy",
                "description": "An encouraging and motivational friend who helps build confidence and take action",
                "emoji": "💪",
                "characteristics": [
                    "Direct but supportive",
                    "Motivational and energizing",
                    "Focuses on action and progress",
                    "Builds confidence and self-efficacy",
                    "Uses encouraging and empowering language"
                ],
                "communication_style": {
                    "tone": "confident, encouraging, direct",
                    "pace": "energetic but measured",
                    "language": "empowering, action-oriented",
                    "approach": "solution-focused, goal-oriented"
                },
                "specialties": [
                    "Confidence building",
                    "Goal setting and achievement",
                    "Overcoming procrastination",
                    "Social anxiety",
                    "Career and life transitions"
                ],
                "sample_responses": [
                    "You've got this! I believe in your strength. What's one small step you can take today toward feeling better?",
                    "I hear you're struggling, but I also see your resilience. Let's channel that energy into something positive.",
                    "You're stronger than you think. Let's make a plan to tackle this challenge head-on."
                ]
            },
            
            "playful_companion": {
                "name": "Playful Companion",
                "description": "A lighthearted and optimistic friend who uses appropriate humor and positivity",
                "emoji": "😊",
                "characteristics": [
                    "Lighthearted and optimistic",
                    "Uses appropriate humor",
                    "Keeps things positive",
                    "Finds silver linings",
                    "Playful but sensitive to serious moments"
                ],
                "communication_style": {
                    "tone": "cheerful, optimistic, warm",
                    "pace": "lively but adaptable",
                    "language": "positive, uplifting, occasionally humorous",
                    "approach": "hope-focused, strength-based"
                },
                "specialties": [
                    "Mood lifting",
                    "Reframing negative thoughts",
                    "Building resilience through positivity",
                    "Social connection",
                    "Creative problem solving"
                ],
                "sample_responses": [
                    "Hey there, sunshine! ☀️ Even on cloudy days, you still shine bright. What's one thing that made you smile recently?",
                    "Life's like a rollercoaster - scary sometimes, but the view from the top is always worth it! 🎢",
                    "You know what? You're pretty amazing for reaching out. That takes courage, and I'm here to cheer you on! 🎉"
                ]
            },
            
            "wise_mentor": {
                "name": "Wise Mentor",
                "description": "A thoughtful and experienced guide who provides deep insights and reflective questions",
                "emoji": "🦉",
                "characteristics": [
                    "Thoughtful and reflective",
                    "Asks deep, meaningful questions",
                    "Provides philosophical insights",
                    "Guides toward self-discovery",
                    "Patient with complex emotional processing"
                ],
                "communication_style": {
                    "tone": "thoughtful, wise, contemplative",
                    "pace": "measured, reflective",
                    "language": "insightful, philosophical, probing",
                    "approach": "introspective, growth-oriented"
                },
                "specialties": [
                    "Life purpose and meaning",
                    "Personal growth and development",
                    "Relationship insights",
                    "Existential concerns",
                    "Values clarification"
                ],
                "sample_responses": [
                    "This challenge you're facing... what might it be trying to teach you about yourself?",
                    "In the quiet moments between thoughts, what does your inner wisdom tell you about this situation?",
                    "Sometimes our greatest struggles become our greatest teachers. What lessons are emerging for you?"
                ]
            },
            
            "practical_helper": {
                "name": "Practical Helper",
                "description": "A solution-focused assistant who provides concrete advice and actionable strategies",
                "emoji": "🛠️",
                "characteristics": [
                    "Solution-focused and systematic",
                    "Provides concrete, actionable advice",
                    "Organized and structured approach",
                    "Evidence-based recommendations",
                    "Clear step-by-step guidance"
                ],
                "communication_style": {
                    "tone": "clear, organized, helpful",
                    "pace": "systematic, efficient",
                    "language": "practical, specific, actionable",
                    "approach": "problem-solving, strategic"
                },
                "specialties": [
                    "Stress management techniques",
                    "Time management and organization",
                    "Coping strategy implementation",
                    "Behavioral change",
                    "Resource identification"
                ],
                "sample_responses": [
                    "Let's break this down into manageable steps. Here are three specific things you can try today...",
                    "Based on what you've shared, I recommend this evidence-based approach: [specific strategy]",
                    "Here's a practical plan we can implement: Step 1... Step 2... Step 3..."
                ]
            }
        }
    
    def get_available_modes(self) -> Dict[str, Dict[str, Any]]:
        """Get all available personality modes"""
        return self.personality_modes
    
    def get_current_mode(self) -> str:
        """Get current personality mode"""
        return self.current_mode
    
    def set_mode(self, mode: str) -> bool:
        """
        Set the current personality mode
        
        Args:
            mode: Personality mode to set
            
        Returns:
            True if successful, False if mode doesn't exist
        """
        if mode in self.personality_modes:
            self.current_mode = mode
            print(f"✅ Personality mode set to: {mode}")
            return True
        else:
            print(f"❌ Unknown personality mode: {mode}")
            return False
    
    def get_mode_info(self, mode: str = None) -> Dict[str, Any]:
        """
        Get detailed information about a personality mode
        
        Args:
            mode: Mode to get info for (current mode if None)
            
        Returns:
            Mode information dictionary
        """
        target_mode = mode or self.current_mode
        
        if target_mode in self.personality_modes:
            return self.personality_modes[target_mode]
        else:
            return {"error": f"Mode '{target_mode}' not found"}
    
    def get_mode_prompt_context(self, mode: str = None) -> str:
        """
        Get prompt context for a personality mode
        
        Args:
            mode: Mode to get context for (current mode if None)
            
        Returns:
            Formatted prompt context string
        """
        target_mode = mode or self.current_mode
        mode_info = self.get_mode_info(target_mode)
        
        if "error" in mode_info:
            return "Use a balanced, supportive approach."
        
        context = f"""
PERSONALITY MODE: {mode_info['name']} {mode_info['emoji']}

DESCRIPTION: {mode_info['description']}

COMMUNICATION STYLE:
- Tone: {mode_info['communication_style']['tone']}
- Pace: {mode_info['communication_style']['pace']}
- Language: {mode_info['communication_style']['language']}
- Approach: {mode_info['communication_style']['approach']}

KEY CHARACTERISTICS:
{chr(10).join(f"- {char}" for char in mode_info['characteristics'])}

SPECIALTIES:
{chr(10).join(f"- {spec}" for spec in mode_info['specialties'])}

EXAMPLE RESPONSES:
{chr(10).join(f'"{resp}"' for resp in mode_info['sample_responses'])}

Embody this personality while maintaining professionalism and mental health best practices.
"""
        
        return context.strip()
    
    def recommend_mode(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend the best personality mode based on user context
        
        Args:
            user_context: Context including mood, concerns, preferences, etc.
            
        Returns:
            Recommendation with mode and reasoning
        """
        try:
            # Extract context information
            mood = user_context.get('mood', '')
            concerns = user_context.get('concerns', [])
            urgency = user_context.get('urgency', 'low')
            user_preference = user_context.get('preferred_style', '')
            sentiment = user_context.get('sentiment', 'neutral')
            
            # Scoring system for mode recommendation
            mode_scores = {}
            
            for mode_id, mode_info in self.personality_modes.items():
                score = 0
                
                # Base score
                score += 1
                
                # Mood-based scoring
                if sentiment == 'negative' or mood in ['sad', 'depressed', 'anxious']:
                    if mode_id == 'calm_coach':
                        score += 3
                    elif mode_id == 'wise_mentor':
                        score += 2
                elif sentiment == 'positive':
                    if mode_id == 'playful_companion':
                        score += 3
                    elif mode_id == 'assertive_buddy':
                        score += 2
                
                # Urgency-based scoring
                if urgency in ['high', 'crisis']:
                    if mode_id == 'calm_coach':
                        score += 3
                    elif mode_id == 'practical_helper':
                        score += 2
                
                # Concern-based scoring
                for concern in concerns:
                    specialties = mode_info.get('specialties', [])
                    for specialty in specialties:
                        if any(keyword in concern.lower() for keyword in specialty.lower().split()):
                            score += 1
                
                # User preference scoring
                if user_preference:
                    if user_preference.lower() in mode_info['name'].lower():
                        score += 3
                    elif user_preference.lower() in mode_info['description'].lower():
                        score += 2
                
                mode_scores[mode_id] = score
            
            # Get the highest scoring mode
            recommended_mode = max(mode_scores.items(), key=lambda x: x[1])[0]
            recommended_info = self.personality_modes[recommended_mode]
            
            return {
                "recommended_mode": recommended_mode,
                "mode_info": recommended_info,
                "confidence": mode_scores[recommended_mode] / max(mode_scores.values()) if mode_scores.values() else 0,
                "reasoning": self._generate_recommendation_reasoning(
                    recommended_mode, recommended_info, user_context
                ),
                "all_scores": mode_scores
            }
            
        except Exception as e:
            print(f"❌ Error recommending mode: {e}")
            return {
                "recommended_mode": "calm_coach",
                "mode_info": self.personality_modes["calm_coach"],
                "confidence": 0.5,
                "reasoning": "Default recommendation due to analysis error",
                "error": str(e)
            }
    
    def _generate_recommendation_reasoning(self, mode: str, mode_info: Dict[str, Any], 
                                         context: Dict[str, Any]) -> str:
        """Generate reasoning for mode recommendation"""
        reasoning_parts = [
            f"Recommended {mode_info['name']} because:"
        ]
        
        mood = context.get('mood', '')
        sentiment = context.get('sentiment', 'neutral')
        urgency = context.get('urgency', 'low')
        
        # Add specific reasoning based on context
        if sentiment == 'negative' and mode == 'calm_coach':
            reasoning_parts.append("- Your current emotional state would benefit from gentle, patient support")
        
        if urgency in ['high', 'crisis'] and mode in ['calm_coach', 'practical_helper']:
            reasoning_parts.append("- The urgency of your situation calls for immediate, focused support")
        
        if sentiment == 'positive' and mode == 'playful_companion':
            reasoning_parts.append("- Your positive mood aligns well with an uplifting, optimistic approach")
        
        # Add mode strengths
        reasoning_parts.append(f"- This mode specializes in: {', '.join(mode_info['specialties'][:3])}")
        
        return "\n".join(reasoning_parts)
    
    def get_mode_transition_message(self, from_mode: str, to_mode: str) -> str:
        """Get a friendly message for mode transitions"""
        from_info = self.personality_modes.get(from_mode, {})
        to_info = self.personality_modes.get(to_mode, {})
        
        if not from_info or not to_info:
            return f"Switching to {to_info.get('name', to_mode)} mode."
        
        return (f"Transitioning from {from_info['name']} {from_info.get('emoji', '')} "
                f"to {to_info['name']} {to_info.get('emoji', '')} mode. "
                f"{to_info['description']}")
    
    def get_personality_stats(self) -> Dict[str, Any]:
        """Get statistics about personality mode usage"""
        return {
            "total_modes": len(self.personality_modes),
            "current_mode": self.current_mode,
            "available_modes": list(self.personality_modes.keys()),
            "mode_categories": {
                "supportive": ["calm_coach", "wise_mentor"],
                "energetic": ["assertive_buddy", "playful_companion"],
                "practical": ["practical_helper"]
            }
        }
    
    def validate_mode_compatibility(self, mode: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate if a mode is appropriate for the user context"""
        try:
            if mode not in self.personality_modes:
                return {"compatible": False, "reason": "Mode does not exist"}
            
            urgency = user_context.get('urgency', 'low')
            sentiment = user_context.get('sentiment', 'neutral')
            
            # Check for incompatible combinations
            if urgency == 'crisis' and mode == 'playful_companion':
                return {
                    "compatible": False,
                    "reason": "Playful approach may not be appropriate for crisis situations",
                    "suggested_alternative": "calm_coach"
                }
            
            return {"compatible": True, "reason": "Mode is appropriate for current context"}
            
        except Exception as e:
            print(f"❌ Error validating mode compatibility: {e}")
            return {"compatible": True, "reason": "Default compatibility"}
