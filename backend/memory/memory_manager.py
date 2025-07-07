"""
🧠 Memory Manager - Handles Short-term and Long-term Memory Systems

Short-term Memory: ConversationBufferMemory (recent chat context)
Long-term Memory: ChromaDB (persistent user data, reflections, important info)
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

import chromadb
from chromadb.config import Settings
from langchain.memory import ConversationBufferMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage


class MemoryManager:
    """Manages both short-term and long-term memory for the AI assistant"""
    
    def __init__(self, max_token_limit: int = 2000):
        """
        Initialize memory systems
        
        Args:
            max_token_limit: Token limit for short-term memory buffer
        """
        self.max_token_limit = max_token_limit
        
        # Initialize short-term memory (conversation buffer)
        self.short_term_memory = ConversationBufferMemory(
            max_token_limit=max_token_limit,
            return_messages=True,
            memory_key="history"
        )
        
        # Initialize ChromaDB for long-term memory
        self._init_chromadb()
        
        print("✅ Memory Manager initialized successfully")
    
    def _init_chromadb(self):
        """Initialize ChromaDB client and collections"""
        try:
            # Create ChromaDB data directory
            chroma_db_path = os.path.join(os.getcwd(), "chroma_db")
            os.makedirs(chroma_db_path, exist_ok=True)
            
            # Initialize ChromaDB client
            self.chroma_client = chromadb.PersistentClient(
                path=chroma_db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Create collections for different types of long-term memory
            self.reflections_collection = self._get_or_create_collection("user_reflections")
            self.important_memories_collection = self._get_or_create_collection("important_memories")
            self.mood_data_collection = self._get_or_create_collection("mood_data")
            self.sos_requests_collection = self._get_or_create_collection("sos_requests")
            self.user_profile_collection = self._get_or_create_collection("user_profile")
            self.journals_collection = self._get_or_create_collection("journals")
            
            print("✅ ChromaDB collections initialized")
            
        except Exception as e:
            print(f"❌ ChromaDB initialization error: {e}")
            raise
    
    def _get_or_create_collection(self, name: str):
        """Get existing collection or create new one"""
        try:
            return self.chroma_client.get_collection(name)
        except Exception:
            return self.chroma_client.create_collection(
                name=name,
                metadata={"description": f"Collection for {name}"}
            )
    
    def add_message_to_short_term(self, human_message: str, ai_response: str):
        """Add conversation exchange to short-term memory"""
        try:
            self.short_term_memory.chat_memory.add_user_message(human_message)
            self.short_term_memory.chat_memory.add_ai_message(ai_response)
            
        except Exception as e:
            print(f"❌ Error adding to short-term memory: {e}")
    
    def get_short_term_context(self) -> str:
        """Get recent conversation context from short-term memory"""
        try:
            messages = self.short_term_memory.chat_memory.messages
            
            context_parts = []
            for message in messages[-10:]:  # Last 10 messages
                if isinstance(message, HumanMessage):
                    context_parts.append(f"Human: {message.content}")
                elif isinstance(message, AIMessage):
                    context_parts.append(f"AI: {message.content}")
            
            return "\n".join(context_parts)
            
        except Exception as e:
            print(f"❌ Error getting short-term context: {e}")
            return ""
    
    def save_reflection(self, reflection_content: str, category: str = "general") -> Dict[str, Any]:
        """Save user reflection to long-term memory"""
        try:
            reflection_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()
            
            metadata = {
                "id": reflection_id,
                "category": category,
                "timestamp": timestamp,
                "type": "reflection"
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            self.reflections_collection.add(
                ids=[reflection_id],
                documents=[reflection_content],
                metadatas=[metadata]
            )
            
            return {
                "id": reflection_id,
                "saved": True,
                "category": category,
                "timestamp": timestamp
            }
            
        except Exception as e:
            print(f"❌ Error saving reflection: {e}")
            return {"saved": False, "error": str(e)}
    
    def remember_important(self, content: str, importance: str = "medium") -> Dict[str, Any]:
        """Save important conversation data to long-term memory"""
        try:
            memory_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()
            
            metadata = {
                "id": memory_id,
                "importance": importance,
                "timestamp": timestamp,
                "type": "important_memory"
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            self.important_memories_collection.add(
                ids=[memory_id],
                documents=[content],
                metadatas=[metadata]
            )
            
            return {
                "id": memory_id,
                "saved": True,
                "importance": importance,
                "timestamp": timestamp
            }
            
        except Exception as e:
            print(f"❌ Error saving important memory: {e}")
            return {"saved": False, "error": str(e)}
    
    def save_sos_request(self, sos_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save SOS request to long-term memory for tracking"""
        try:
            sos_id = str(uuid.uuid4())
            
            metadata = {
                "id": sos_id,
                "urgency": sos_data.get("urgency", "medium"),
                "timestamp": sos_data["timestamp"],
                "type": "sos_request",
                "location": sos_data.get("location", "unknown")
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            self.sos_requests_collection.add(
                ids=[sos_id],
                documents=[sos_data["content"]],
                metadatas=[metadata]
            )
            
            return {
                "id": sos_id,
                "saved": True,
                "timestamp": sos_data["timestamp"]
            }
            
        except Exception as e:
            print(f"❌ Error saving SOS request: {e}")
            return {"saved": False, "error": str(e)}
    
    def get_relevant_memories(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant memories based on similarity search"""
        try:
            # Search across different collections
            relevant_memories = []
            
            collections = [
                ("reflections", self.reflections_collection),
                ("important_memories", self.important_memories_collection),
                ("user_profile", self.user_profile_collection)
            ]
            
            for collection_name, collection in collections:
                try:
                    results = collection.query(
                        query_texts=[query],
                        n_results=min(n_results, 3)  # Get up to 3 from each collection
                    )
                    
                    if results['documents'] and results['documents'][0]:
                        for i, doc in enumerate(results['documents'][0]):
                            metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                            relevant_memories.append({
                                "content": doc,
                                "metadata": metadata,
                                "collection": collection_name,
                                "distance": results['distances'][0][i] if results['distances'] else 0
                            })
                            
                except Exception as e:
                    print(f"❌ Error querying {collection_name}: {e}")
                    continue
            
            # Sort by relevance (lower distance = more relevant)
            relevant_memories.sort(key=lambda x: x.get('distance', 0))
            
            return relevant_memories[:n_results]
            
        except Exception as e:
            print(f"❌ Error retrieving relevant memories: {e}")
            return []
    
    def get_user_reflections(self, category: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user reflections, optionally filtered by category"""
        try:
            where_filter = {}
            if category:
                where_filter = {"category": category}
            
            results = self.reflections_collection.get(
                where=where_filter if where_filter else None,
                limit=limit,
                include=["documents", "metadatas"]
            )
            
            reflections = []
            if results['documents']:
                for i, doc in enumerate(results['documents']):
                    metadata = results['metadatas'][i] if results['metadatas'] else {}
                    reflections.append({
                        "id": metadata.get('id'),
                        "content": doc,
                        "category": metadata.get('category'),
                        "timestamp": metadata.get('timestamp'),
                        "type": metadata.get('type')
                    })
            
            # Sort by timestamp (newest first)
            reflections.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return reflections
            
        except Exception as e:
            print(f"❌ Error getting reflections: {e}")
            return []
    
    def update_user_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update or create user profile data"""
        try:
            profile_id = "user_profile_main"
            timestamp = datetime.now(timezone.utc).isoformat()
            
            # Prepare profile content
            profile_content = json.dumps(profile_data, indent=2)
            
            metadata = {
                "id": profile_id,
                "timestamp": timestamp,
                "type": "user_profile",
                "last_updated": timestamp
            }
            
            # Clean metadata to remove None values
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            # Check if profile exists
            try:
                existing = self.user_profile_collection.get(ids=[profile_id])
                if existing['ids']:
                    # Update existing profile
                    self.user_profile_collection.update(
                        ids=[profile_id],
                        documents=[profile_content],
                        metadatas=[metadata]
                    )
                else:
                    # Create new profile
                    self.user_profile_collection.add(
                        ids=[profile_id],
                        documents=[profile_content],
                        metadatas=[metadata]
                    )
            except Exception:
                # Create new profile if collection is empty
                self.user_profile_collection.add(
                    ids=[profile_id],
                    documents=[profile_content],
                    metadatas=[metadata]
                )
            
            return {
                "updated": True,
                "timestamp": timestamp,
                "profile_id": profile_id
            }
            
        except Exception as e:
            print(f"❌ Error updating user profile: {e}")
            return {"updated": False, "error": str(e)}
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get current user profile"""
        try:
            profile_id = "user_profile_main"
            results = self.user_profile_collection.get(
                ids=[profile_id],
                include=["documents", "metadatas"]
            )
            
            if results['documents'] and results['documents'][0]:
                profile_data = json.loads(results['documents'][0])
                metadata = results['metadatas'][0] if results['metadatas'] else {}
                
                return {
                    "profile": profile_data,
                    "metadata": metadata,
                    "exists": True
                }
            else:
                return {"exists": False, "profile": {}}
                
        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return {"exists": False, "error": str(e)}
    
    def get_user_memory_category(self, category: str) -> list:
        """Get a list of facts for a given category from the user's profile memories."""
        try:
            profile = self.get_user_profile()
            memories = profile.get('profile', {}).get('memories', {})
            return memories.get(category, [])
        except Exception as e:
            print(f"❌ Error getting user memory category '{category}': {e}")
            return []
    
    def clear_short_term_memory(self):
        """Clear the short-term conversation buffer"""
        try:
            self.short_term_memory.clear()
            print("✅ Short-term memory cleared")
            
        except Exception as e:
            print(f"❌ Error clearing short-term memory: {e}")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about memory usage"""
        try:
            stats = {
                "short_term": {
                    "message_count": len(self.short_term_memory.chat_memory.messages),
                    "max_token_limit": self.max_token_limit
                },
                "long_term": {}
            }
            
            # Get counts from each collection
            collections = [
                ("reflections", self.reflections_collection),
                ("important_memories", self.important_memories_collection),
                ("mood_data", self.mood_data_collection),
                ("sos_requests", self.sos_requests_collection),
                ("user_profile", self.user_profile_collection)
            ]
            
            for name, collection in collections:
                try:
                    count = collection.count()
                    stats["long_term"][name] = count
                except Exception as e:
                    print(f"❌ Error getting count for {name}: {e}")
                    stats["long_term"][name] = 0
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting memory stats: {e}")
            return {"error": str(e)}

    def save_journal_entry(self, user_id: str, text: str) -> dict:
        """Save a journal entry for a user."""
        try:
            entry_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc).isoformat()
            entry = {
                "userId": user_id,
                "date": timestamp,
                "text": text
            }
            metadata = {
                "id": entry_id,
                "userId": user_id,
                "date": timestamp,
                "type": "journal_entry"
            }
            self.journals_collection.add(
                ids=[entry_id],
                documents=[json.dumps(entry)],
                metadatas=[metadata]
            )
            return {"success": True, "id": entry_id, "timestamp": timestamp}
        except Exception as e:
            print(f"❌ Error saving journal entry: {e}")
            return {"success": False, "error": str(e)}

    def get_latest_journal_entry(self, user_id: str) -> dict:
        """Retrieve the latest journal entry for a user."""
        try:
            results = self.journals_collection.get(
                where={"userId": user_id, "type": "journal_entry"},
                include=["documents", "metadatas"]
            )
            entries = []
            if results['documents']:
                for i, doc in enumerate(results['documents']):
                    try:
                        entry = json.loads(doc)
                        entry['metadata'] = results['metadatas'][i] if results['metadatas'] else {}
                        entries.append(entry)
                    except Exception as e:
                        print(f"❌ Error parsing journal entry: {e}")
                        continue
            if not entries:
                return {"success": False, "error": "No journal entries found."}
            # Sort by date descending
            entries.sort(key=lambda x: x['date'], reverse=True)
            latest = entries[0]
            return {"success": True, "entry": latest}
        except Exception as e:
            print(f"❌ Error retrieving latest journal entry: {e}")
            return {"success": False, "error": str(e)}
