"""
🗣️ Conversation Chain - LangChain-powered conversation handling

This module manages the main conversation flow using LangChain,
integrating memory systems and personality modes.
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import re
import random

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema import BaseMessage


def generate_prompt(user_message, user_data):
    if not user_data:
        user_data = {}
    favorite_activity = user_data.get("favorite_calming_activity", "not specified yet")
    user_name = user_data.get("name", "Friend")
    pets = ", ".join(user_data.get("pets", [])) if user_data.get("pets") else "none mentioned"
    support_prefs = ", ".join(user_data.get("support_preferences", [])) if user_data.get("support_preferences") else "not specified"
    prompt = f"""
You are a compassionate mental wellness coach named Reflective. Speak in a warm and encouraging tone. Be empathetic and supportive.

User profile:
- Name: {user_name}
- Favorite calming activity: {favorite_activity}
- Pets: {pets}
- Support preferences: {support_prefs}

User said: \"{user_message}\"

Respond as Reflective. If the user shares something about their emotions, reflect back with empathy. If they mention calming activities, affirm them. If the user says \"Store this: ...\", extract and remember it but also confirm in your response.
""".strip()
    return prompt


class ConversationChain:
    """Handles AI conversations with memory and personality integration"""
    
    def __init__(self, memory_manager):
        """
        Initialize the conversation chain
        
        Args:
            memory_manager: MemoryManager instance for handling memory operations
        """
        self.memory_manager = memory_manager
        self.current_personality = "calm_coach"
        self.current_language = "english"
        
        # Initialize OpenAI LLM
        self._init_llm()
        
        # Initialize conversation chain
        self._init_conversation_chain()
        
        print("✅ Conversation Chain initialized successfully")
    
    def _init_llm(self):
        """Initialize the OpenAI language model"""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            self.llm = ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0.7,
                max_tokens=1000,
                openai_api_key=api_key
            )
            
            print("✅ OpenAI LLM initialized")
            
        except Exception as e:
            print(f"❌ Error initializing LLM: {e}")
            raise
    
    def _init_conversation_chain(self):
        """Initialize the LangChain conversation chain with custom prompt"""
        try:
            # Create custom prompt template
            self.prompt_template = PromptTemplate(
                input_variables=["history", "input", "personality_context", "memory_context", "language_context"],
                template=self._get_prompt_template()
            )
            
            # Create LLMChain instead of ConversationChain
            self.chain = LLMChain(
                llm=self.llm,
                prompt=self.prompt_template,
                verbose=False
            )
            
            print("✅ LangChain conversation chain initialized")
            
        except Exception as e:
            print(f"❌ Error initializing conversation chain: {e}")
            raise
    
    def _get_prompt_template(self) -> str:
        """Get the base prompt template for the AI assistant"""
        return """You are a compassionate mental wellness AI assistant. Your primary role is to provide emotional support, guidance, and encouragement to users who may be dealing with stress, anxiety, depression, or other mental health challenges.

CORE PRINCIPLES:
- Be empathetic, non-judgmental, and supportive
- Provide evidence-based mental health guidance when appropriate
- Encourage professional help for serious mental health concerns
- Respect user privacy and maintain confidentiality
- Use active listening techniques in your responses
- Offer practical coping strategies and self-care tips

PERSONALITY MODE: {personality_context}

LANGUAGE PREFERENCES: {language_context}

RELEVANT MEMORY CONTEXT: {memory_context}

SPECIAL COMMANDS YOU SUPPORT:
- #reflect: Help user process reflections (save to long-term memory)
- #mood: Mood logging and tracking
- #todo: Task management and goal setting
- #remember: Save important conversation points
- #sos: Emergency support and crisis resources

CONVERSATION HISTORY:
{history}

Current User Message: {input}

Instructions:
1. Respond according to your assigned personality mode
2. Use the specified language preference
3. Reference relevant memories when helpful
4. Provide mental health support appropriate to the user's needs
5. If the user seems in crisis, prioritize safety and professional resources
6. Encourage self-care and positive coping strategies
7. Be conversational but professional

Your Response:"""
    
    def process_message(self, user_message: str, personality_mode: str = "calm_coach", 
                       language: str = "english") -> str:
        """
        Process user message through the conversation chain
        
        Args:
            user_message: The user's input message
            personality_mode: Current AI personality mode
            language: Preferred language for responses
            
        Returns:
            AI response string
        """
        try:
            # Update current settings
            self.current_personality = personality_mode
            self.current_language = language

            # Get user profile data for prompt
            user_profile = self.memory_manager.get_user_profile().get("profile", {})
            # Compose personalized prompt
            personalized_prompt = generate_prompt(user_message, user_profile)
            
            # Get relevant context from memory
            memory_context = self._get_memory_context(user_message)
            # Get personality context
            personality_context = self._get_personality_context(personality_mode)
            # Get language context
            language_context = self._get_language_context(language)
            # Get history from memory
            memory_variables = self.memory_manager.short_term_memory.load_memory_variables({"input": user_message})
            history = memory_variables.get("history", "")
            
            # Check for new facts to store
            new_facts = self._extract_user_facts(user_message)
            memory_feedback = ""
            if new_facts:
                self._store_user_facts(new_facts)
                memory_feedback = self._generate_memory_feedback(new_facts, language)
            
            # Prepare input for chain
            chain_input = {
                "input": personalized_prompt,
                "personality_context": personality_context,
                "memory_context": memory_context,
                "language_context": language_context,
                "history": history
            }
            
            # Get response from chain
            response = self.chain.predict(**chain_input)
            
            # Add memory feedback if there are new facts
            if memory_feedback:
                response = response + "\n\n" + memory_feedback
            
            # Add to memory
            self.memory_manager.add_message_to_short_term(user_message, response)
            
            # Add memory feedback if there are new facts
            if memory_feedback:
                response += f"\n\n🧠 **Memory updated!** {memory_feedback}"
                
            # Format response
            response = self._format_friendly_response(response)
            return response.strip()
            
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            return self._get_error_response(language)

    def _format_friendly_response(self, text: str) -> str:
        """Format response to be short, emoji-rich, and split into sections for frontend bubbles."""
        # Split into sections if too long
        sections = []
        for part in text.split("\n\n"):
            part = part.strip()
            if not part:
                continue
            # Add emoji section breaks if not present
            if not part.startswith(("😊", "🧘", "🧠", "💡", "⭐")):
                part = "😊 " + part
            # Bold important phrases
            part = part.replace("important", "**important**")
            # Add Show More if too long
            if len(part) > 220:
                part = part[:200] + "... [Show More]"
            sections.append(part)
        return "\n\n".join(sections)
    
    def _get_memory_context(self, user_message: str) -> str:
        """Get relevant memory context for the current message"""
        try:
            # Get relevant memories based on the user message
            relevant_memories = self.memory_manager.get_relevant_memories(user_message, n_results=3)
            
            if not relevant_memories:
                return "No specific relevant memories found."
            
            context_parts = ["Relevant memories:"]
            for memory in relevant_memories:
                memory_type = memory.get('metadata', {}).get('type', 'unknown')
                content = memory.get('content', '')[:200] + "..." if len(memory.get('content', '')) > 200 else memory.get('content', '')
                timestamp = memory.get('metadata', {}).get('timestamp', 'Unknown time')
                
                context_parts.append(f"- {memory_type}: {content} (from {timestamp})")
            
            return "\n".join(context_parts)
            
        except Exception as e:
            print(f"❌ Error getting memory context: {e}")
            return "Unable to retrieve memory context."
    
    def _get_personality_context(self, personality_mode: str) -> str:
        """Get personality context based on the selected mode"""
        personality_modes = {
            "calm_coach": "You are a calm, patient, and nurturing coach. Speak gently and offer reassuring guidance. Focus on mindfulness and gradual progress.",
            
            "assertive_buddy": "You are an encouraging and motivational friend. Be direct but supportive, help users take action and build confidence. Use an energetic but caring tone.",
            
            "playful_companion": "You are a lighthearted and optimistic companion. Use humor appropriately, keep things positive, and help users see the bright side while still being supportive of their struggles.",
            
            "wise_mentor": "You are a thoughtful and experienced mentor. Provide deep insights, ask reflective questions, and guide users toward self-discovery and growth.",
            
            "practical_helper": "You are a solution-focused helper. Provide concrete advice, practical strategies, and actionable steps. Be organized and systematic in your approach."
        }
        
        return personality_modes.get(personality_mode, personality_modes["calm_coach"])
    
    def _get_language_context(self, language: str) -> str:
        """Get language-specific context and instructions"""
        language_instructions = {
            "english": "Respond in English. Use clear, accessible language appropriate for mental health support.",
            
            "sinhala": "Respond in Sinhala (සිංහල). Use culturally appropriate expressions and be mindful of local mental health perspectives. Use respectful and supportive language.",
            
            "tamil": "Respond in Tamil (தமிழ்). Use culturally appropriate expressions and be mindful of local mental health perspectives. Use respectful and supportive language."
        }
        
        return language_instructions.get(language, language_instructions["english"])
    
    def _get_error_response(self, language: str) -> str:
        """Get appropriate error response based on language"""
        error_responses = {
            "english": "I'm sorry, I'm having trouble processing your message right now. Please try again, and if the problem persists, consider reaching out to a mental health professional for immediate support.",
            
            "sinhala": "මට කණගාටුයි, මම දැන් ඔබේ පණිවිඩය සැකසීමේ දී අසුවියක් ඇත. කරුණාකර නැවත උත්සාහ කරන්න, ගැටලුව දිගටම පවතින්නේ නම්,즉시 සහාය සඳහා මානසික සෞඛ්‍ය වෘත්තිකයෙකු සම්බන්ධ කර ගැනීම සලකා බලන්න.",
            
            "tamil": "மன்னிக்கவும், உங்கள் செய்தியை இப்போது செயல்படுத்துவதில் எனக்கு சிரமம் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும், பிரச்சனை தொடர்ந்தால், உடனடி ஆதரவிற்காக மனநல நிபுணரை தொடர்பு கொள்ளவும்."
        }
        
        return error_responses.get(language, error_responses["english"])
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the current conversation"""
        try:
            recent_context = self.memory_manager.get_short_term_context()
            
            if not recent_context:
                return "No recent conversation to summarize."
            
            # Use LLM to generate summary
            summary_prompt = f"""Please provide a brief summary of this mental health conversation, focusing on:
1. Main concerns or topics discussed
2. User's emotional state
3. Key advice or strategies mentioned
4. Any important progress or insights

Conversation:
{recent_context}

Summary:"""
            
            summary = self.llm.predict(summary_prompt)
            return summary.strip()
            
        except Exception as e:
            print(f"❌ Error generating conversation summary: {e}")
            return "Unable to generate conversation summary."
    
    def suggest_next_steps(self, user_message: str) -> Dict[str, Any]:
        """Suggest helpful next steps based on conversation context"""
        try:
            # Get conversation context
            context = self.memory_manager.get_short_term_context()
            
            # Generate suggestions using LLM
            suggestion_prompt = f"""Based on this mental health conversation, suggest 3-5 helpful next steps or activities for the user. Consider their current state and needs.

Recent conversation:
{context}

Latest message: {user_message}

Provide suggestions in the following categories:
1. Immediate coping strategies
2. Self-care activities
3. Reflection or journaling prompts
4. Professional resources (if needed)
5. Long-term wellness goals

Format as a JSON object with categories and suggestions."""
            
            suggestions_text = self.llm.predict(suggestion_prompt)
            
            # Try to parse as JSON, fallback to text if needed
            try:
                import json
                suggestions = json.loads(suggestions_text)
            except:
                suggestions = {"general": [suggestions_text]}
            
            return suggestions
            
        except Exception as e:
            print(f"❌ Error generating suggestions: {e}")
            return {"error": "Unable to generate suggestions"}
    
    def update_conversation_settings(self, personality_mode: str, language: str):
        """Update conversation settings"""
        self.current_personality = personality_mode
        self.current_language = language
        print(f"✅ Updated settings: personality={personality_mode}, language={language}")

    def _extract_user_facts(self, message: str) -> Dict[str, str]:
        """Extract user facts from the message only if a clear pattern is matched."""
        facts = {}
        message_lower = message.lower().strip()
        
        # Handle 'store this:' pattern
        if message_lower.startswith('store this:') or message_lower.startswith('store this :'):
            fact_text = message_lower.split(':', 1)[1].strip()
            # Try to categorize the fact
            if "dog" in fact_text and "name is" in fact_text:
                # e.g., "my dog's name is bruno"
                pet_name = fact_text.split("name is", 1)[1].strip().title()
                facts['pets'] = [pet_name]
            elif "cat" in fact_text and "name is" in fact_text:
                cat_name = fact_text.split("name is", 1)[1].strip().title()
                facts['pets'] = [cat_name]
            elif "like" in fact_text or "enjoy" in fact_text:
                # e.g., "i like journaling"
                activity = fact_text.split("like", 1)[1].strip() if "like" in fact_text else fact_text.split("enjoy", 1)[1].strip()
                facts['support_preferences'] = [activity]
            else:
                # Store as a generic note
                facts['notes'] = [fact_text]
            return facts

        # Name extraction (only if clear pattern)
        name_patterns = [
            r"my name is ([a-zA-Z\s]+)",
            r"call me ([a-zA-Z\s]+)"
        ]
        for pattern in name_patterns:
            match = re.search(pattern, message_lower)
            if match:
                name = match.group(1).strip().title()
                if len(name) > 1:
                    facts['name'] = name
        return facts
    
    def _store_user_facts(self, facts: Dict[str, str]):
        """Store user facts in the memory manager, merging lists for categories like pets and support_preferences."""
        try:
            if facts:
                existing_profile = self.memory_manager.get_user_profile()
                profile_data = existing_profile.get("profile", {})
                for key, value in facts.items():
                    if isinstance(value, list):
                        # Merge lists for categories
                        existing = profile_data.get(key, [])
                        if not isinstance(existing, list):
                            existing = []
                        # Avoid duplicates
                        merged = list(set(existing + value))
                        profile_data[key] = merged
                    else:
                        profile_data[key] = value
                profile_data['last_updated'] = datetime.now(timezone.utc).isoformat()
                self.memory_manager.update_user_profile(profile_data)
        except Exception as e:
            print(f"❌ Error storing user facts: {e}")
    
    def _generate_memory_feedback(self, facts: Dict[str, str], language: str) -> str:
        """Generate specific feedback about stored memories."""
        if not facts:
            return ""
        feedback = []
        if 'name' in facts:
            feedback.append(f"I've stored that your name is {facts['name']}. This will help me personalize our conversations.")
        if 'pets' in facts:
            pet_names = ', '.join(facts['pets'])
            feedback.append(f"I've stored that your pet's name is {pet_names}.")
        if 'support_preferences' in facts:
            prefs = ', '.join(facts['support_preferences'])
            feedback.append(f"I've stored your support preference: {prefs}.")
        if 'notes' in facts:
            notes = ', '.join(facts['notes'])
            feedback.append(f"I've stored this note: {notes}.")
        if not feedback:
            return ""
        return ' '.join(feedback)