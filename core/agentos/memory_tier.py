import json
import os
from typing import List, Dict, Any

class MemoryTier:
    def __init__(self, agent_name: str, archive_path: str = "./memory_archive"):
        """
        Manages Working Memory (short-term) and Archival Memory (long-term).
        """
        self.agent_name = agent_name
        self.working_memory: List[Dict[str, str]] = []
        
        # Archival memory path
        self.archive_path = archive_path
        os.makedirs(self.archive_path, exist_ok=True)
        self.archive_file = os.path.join(self.archive_path, f"{self.agent_name}_archive.json")
        self._load_archive()

    def _load_archive(self):
        if os.path.exists(self.archive_file):
            try:
                with open(self.archive_file, "r") as f:
                    self.archival_memory = json.load(f)
            except Exception:
                self.archival_memory = []
        else:
            self.archival_memory = []

    def _save_archive(self):
        try:
            with open(self.archive_file, "w") as f:
                json.dump(self.archival_memory, f, indent=2)
        except Exception as e:
            print(f"[MemoryTier] Failed to save archival memory: {str(e)}")

    def add_working_memory(self, role: str, content: str):
        """Adds to working memory."""
        self.working_memory.append({"role": role, "content": content})

    def get_working_memory(self) -> List[Dict[str, str]]:
        """Retrieves working memory."""
        return self.working_memory
        
    def set_working_memory(self, memory: List[Dict[str, str]]):
        """Sets the working memory directly (used by ContextManager after compression)."""
        self.working_memory = memory

    def archive_memories(self, memories: List[Dict[str, str]]):
        """Moves important or summarized memories to long-term storage."""
        for mem in memories:
            self.archival_memory.append({
                "timestamp": __import__("datetime").datetime.now().isoformat(),
                "role": mem.get("role"),
                "content": mem.get("content")
            })
        self._save_archive()

    def retrieve_archival_context(self, query: str, top_k: int = 3) -> str:
        """
        Retrieves relevant archival memory. 
        In a production environment, this would use vector embeddings.
        For now, we do a simple keyword search.
        """
        if not self.archival_memory:
            return ""
            
        keywords = set(query.lower().split())
        scored_memories = []
        
        for mem in self.archival_memory:
            content = mem.get("content", "").lower()
            score = sum(1 for kw in keywords if kw in content)
            if score > 0:
                scored_memories.append((score, mem))
                
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        top_mems = [m[1] for m in scored_memories[:top_k]]
        
        if not top_mems:
            return ""
            
        context_str = "Archival Memory Retrieved:\n"
        for i, m in enumerate(top_mems):
            context_str += f"- [{m['timestamp']}] {m['role']}: {m['content'][:200]}...\n"
        return context_str
