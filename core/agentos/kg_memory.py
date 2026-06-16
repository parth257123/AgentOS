import json
import os
from typing import List, Dict, Any

class KGMemory:
    def __init__(self, agent_name: str, kg_path: str = "./memory_archive"):
        """
        Knowledge Graph Memory.
        Stores entities and relationships for deep contextual RAG.
        """
        self.agent_name = agent_name
        self.kg_path = kg_path
        os.makedirs(self.kg_path, exist_ok=True)
        self.kg_file = os.path.join(self.kg_path, f"{self.agent_name}_kg.json")
        
        # Graph structure: {"EntityA": {"EntityB": "relationship_type"}}
        self.graph: Dict[str, Dict[str, str]] = {}
        self._load_kg()

    def _load_kg(self):
        if os.path.exists(self.kg_file):
            try:
                with open(self.kg_file, "r") as f:
                    self.graph = json.load(f)
            except Exception:
                self.graph = {}
        else:
            self.graph = {}

    def _save_kg(self):
        try:
            with open(self.kg_file, "w") as f:
                json.dump(self.graph, f, indent=2)
        except Exception as e:
            print(f"[KGMemory] Failed to save KG: {str(e)}")

    def add_relation(self, source: str, target: str, relation: str):
        """Adds a directional relationship to the knowledge graph."""
        src = source.lower().strip()
        tgt = target.lower().strip()
        rel = relation.lower().strip()
        
        if src not in self.graph:
            self.graph[src] = {}
        self.graph[src][tgt] = rel
        self._save_kg()

    def retrieve_kg_context(self, query: str) -> str:
        """
        Extracts subgraphs based on keywords in the query.
        """
        if not self.graph:
            return ""
            
        keywords = set(query.lower().split())
        relevant_relations = []
        
        # Simple extraction: if an entity matches a keyword, include its relations
        for src, targets in self.graph.items():
            for kw in keywords:
                if kw in src:
                    for tgt, rel in targets.items():
                        relevant_relations.append(f"{src} --[{rel}]--> {tgt}")
                else:
                    # check targets
                    for tgt, rel in targets.items():
                        if kw in tgt:
                            relevant_relations.append(f"{src} --[{rel}]--> {tgt}")

        # Deduplicate
        relevant_relations = list(set(relevant_relations))
        
        if not relevant_relations:
            return ""
            
        context_str = "Knowledge Graph Context:\n"
        for rel in relevant_relations[:10]: # Limit to top 10 relations
            context_str += f"- {rel}\n"
        return context_str
