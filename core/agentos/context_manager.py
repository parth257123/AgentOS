import litellm
import json

class ContextManager:
    """
    Intelligent context window manager.
    Tracks token usage, auto-compresses when approaching limits,
    and maintains a 'critical facts' buffer.
    """
    
    def __init__(self, model: str, safety_threshold: float = 0.7):
        self.model = model
        self.safety_threshold = safety_threshold  # Compress at 70% capacity
        self.model_limits = {
            "ollama/glm-5.2": 1_000_000,
            "gemini/gemini-2.5-flash": 1_048_576,
            "gemini/gemini-2.5-pro": 1_048_576,
            "gpt-4o": 128_000,
            "gpt-4o-mini": 128_000,
            "claude-3.5-sonnet": 200_000,
        }
        self.critical_facts = []  # Never compressed
        self.context_history = []  # Subject to compression
        self.current_tokens = 0
        
    def get_window_limit(self) -> int:
        return self.model_limits.get(self.model, 128_000)
    
    def get_usage_ratio(self, current_tokens: int) -> float:
        return current_tokens / self.get_window_limit()
    
    def get_health_status(self, current_tokens: int) -> str:
        ratio = self.get_usage_ratio(current_tokens)
        if ratio < 0.5: return "HEALTHY"
        if ratio < 0.7: return "MODERATE"
        if ratio < 0.9: return "WARNING"
        return "CRITICAL"
        
    def display_health_bar(self, current_tokens: int):
        """Prints a visual 10-block progress bar for context capacity."""
        ratio = self.get_usage_ratio(current_tokens)
        status = self.get_health_status(current_tokens)
        
        filled_blocks = int(ratio * 10)
        if filled_blocks > 10: filled_blocks = 10
        
        bar = ("█" * filled_blocks) + ("░" * (10 - filled_blocks))
        percent = int(ratio * 100)
        
        print(f"[Context Monitor] {bar} {percent}% | Status: {status}")
    
    def should_compress(self, current_tokens: int) -> bool:
        return self.get_usage_ratio(current_tokens) >= self.safety_threshold
    
    def compress(self, context_messages: list, keep_latest_n: int = 3) -> list:
        """
        Summarize older context, keep latest N messages verbatim.
        Returns a new list of compressed messages.
        """
        if len(context_messages) <= keep_latest_n:
            return context_messages
            
        recent = context_messages[-keep_latest_n:]
        older = context_messages[:-keep_latest_n]
        
        older_text = "\n".join([f"{msg.get('role', 'unknown')}: {msg.get('content', '')}" for msg in older])
        
        # Use a cheap/fast model to summarize older context
        summary_prompt = f"Summarize the following conversation context concisely, preserving all key facts, decisions, and data points:\n\n{older_text}"
        
        try:
            response = litellm.completion(
                model="ollama/glm-5.2",
                messages=[{"role": "user", "content": summary_prompt}]
            )
            summary = response.choices[0].message.content
        except Exception as e:
            # Fallback if summarization fails
            summary = "[Context compressed due to length constraints. Full history not available.]"
            
        compressed_msgs = [{"role": "system", "content": f"Previous context summary:\n{summary}"}]
        
        # Append critical facts if any
        if self.critical_facts:
            facts_str = "\n".join(f"- {f}" for f in self.critical_facts)
            compressed_msgs.append({"role": "system", "content": f"CRITICAL FACTS TO REMEMBER:\n{facts_str}"})
            
        compressed_msgs.extend(recent)
        
        return compressed_msgs
    
    def add_critical_fact(self, fact: str):
        """Facts that must never be compressed out."""
        self.critical_facts.append(fact)

    def compress_for_agent(self, vector_store, graph_store, working_memory, agent_role: str, agent_goal: str) -> str:
        """
        Retrieves State-of-the-Art Multi-Tiered Memory context.
        Combines Working Memory, Cross-Encoder Re-Ranked Archival Memory, and Knowledge Graph RAG.
        """
        query = f"Role: {agent_role} | Goal: {agent_goal}"
        
        # 1. Short Term Working Memory (Always injected)
        context_str = "=== SHORT TERM WORKING MEMORY ===\n"
        if not working_memory:
            context_str += "No recent tasks.\n\n"
        else:
            for wm in working_memory:
                context_str += f"- {wm}\n"
            context_str += "\n"
            
        # 2. Archival Vector Memory (Re-Ranked)
        context_str += "=== ARCHIVAL MEMORY (Re-Ranked) ===\n"
        archival_chunks = vector_store.search(query, top_k=3)
        if not archival_chunks:
            context_str += "No relevant past context found.\n\n"
        else:
            for chunk in archival_chunks:
                context_str += f"--- {chunk.get('task', 'Task')} (by {chunk.get('agent', 'Unknown')}) ---\n{chunk.get('result', '')}\n\n"
                
        # 3. Knowledge Graph RAG
        context_str += "=== KNOWLEDGE GRAPH INSIGHTS ===\n"
        graph_data = graph_store.search(query)
        if not graph_data:
            context_str += "No graph relationships found for this query.\n"
        else:
            context_str += graph_data
            
        return context_str
