import networkx as nx
import litellm
import json

class GraphStore:
    def __init__(self, model_name: str = "ollama/glm-5.2"):
        """
        Knowledge Graph for GraphRAG context retrieval.
        Extracts entities and relationships using a local LLM.
        """
        self.model_name = model_name
        self.graph = nx.DiGraph()

    def extract_and_insert(self, text: str):
        """Uses the LLM to extract entities and insert them into the graph."""
        prompt = f"""
        Extract key entities and relationships from the following text.
        Return ONLY valid JSON in this exact format:
        [
            {{"source": "Entity1", "relationship": "action or connection", "target": "Entity2"}}
        ]
        
        Text:
        {text}
        """
        try:
            response = litellm.completion(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content
            
            # Clean up potential markdown formatting
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            relationships = json.loads(content)
            
            for rel in relationships:
                source = rel.get("source", "").strip().lower()
                target = rel.get("target", "").strip().lower()
                relation = rel.get("relationship", "").strip()
                
                if source and target and relation:
                    self.graph.add_edge(source, target, relation=relation)
                    
        except Exception as e:
            print(f"Graph extraction failed: {e}")

    def search(self, query: str) -> str:
        """Finds related entities in the graph based on exact or partial matches to the query."""
        if self.graph.number_of_nodes() == 0:
            return ""
            
        query_words = set(query.lower().split())
        matched_nodes = []
        
        # Naive keyword match for nodes
        for node in self.graph.nodes():
            for word in query_words:
                if len(word) > 3 and word in node:
                    matched_nodes.append(node)
                    break
                    
        if not matched_nodes:
            return ""
            
        graph_context = "Knowledge Graph Insights:\n"
        for node in matched_nodes[:3]: # Limit to top 3 matched nodes to avoid bloat
            neighbors = list(self.graph.successors(node))
            for target in neighbors:
                relation = self.graph.edges[node, target]['relation']
                graph_context += f"- [{node.title()}] {relation} [{target.title()}]\n"
                
        return graph_context
