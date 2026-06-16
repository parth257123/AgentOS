import uuid
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
import litellm
from flashrank import Ranker, RerankRequest

class LiteLLMEmbeddingFunction(EmbeddingFunction):
    def __init__(self, model_name: str = "ollama/nomic-embed-text"):
        self.model_name = model_name

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for doc in input:
            try:
                response = litellm.embedding(model=self.model_name, input=doc)
                embeddings.append(response.data[0]['embedding'])
            except Exception as e:
                print(f"Embedding error: {e}")
                # Fallback zero-vector if the embedding fails
                embeddings.append([0.0] * 768)
        return embeddings

class VectorStore:
    def __init__(self, path: str = "./.agent_memory", collection_name: str = "agent_history", embedding_model="ollama/nomic-embed-text"):
        """
        Persistent Vector Store for semantic RAG routing using ChromaDB.
        Now upgraded with FlashRank Cross-Encoder Re-Ranking.
        """
        self.client = chromadb.PersistentClient(path=path)
        self.embedding_fn = LiteLLMEmbeddingFunction(model_name=embedding_model)
        
        # Initialize ultra-lightweight Cross-Encoder for re-ranking
        self.ranker = Ranker(cache_dir="/tmp/flashrank")
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )

    def insert(self, text_to_embed: str, metadata: dict):
        """Embeds text and stores it in ChromaDB."""
        safe_metadata = {}
        for k, v in metadata.items():
            if isinstance(v, (str, int, float, bool)):
                safe_metadata[k] = v
            else:
                safe_metadata[k] = str(v)
                
        doc_id = str(uuid.uuid4())
        self.collection.add(
            documents=[text_to_embed],
            metadatas=[safe_metadata],
            ids=[doc_id]
        )

    def search(self, query: str, top_k: int = 3) -> list:
        """
        Queries ChromaDB for candidate chunks, then Re-Ranks them
        using a Cross-Encoder neural network to ensure pure logical relevance.
        """
        if self.collection.count() == 0:
            return []
            
        # 1. Broad Semantic Search (Retrieve more candidates than we need)
        fetch_k = min(top_k * 4, self.collection.count())
        results = self.collection.query(
            query_texts=[query],
            n_results=fetch_k
        )
        
        if not results or not results.get("metadatas") or len(results["metadatas"]) == 0:
            return []
            
        candidates = results["metadatas"][0]
        if len(candidates) <= 1:
            return candidates
            
        # 2. Cross-Encoder Re-Ranking
        passages = []
        for idx, meta in enumerate(candidates):
            passages.append({
                "id": idx,
                "text": meta.get("result", ""),
                "meta": meta
            })
            
        rerank_request = RerankRequest(query=query, passages=passages)
        reranked_passages = self.ranker.rerank(rerank_request)
        
        # FlashRank returns a list sorted by true relevance score
        final_metas = [p["meta"] for p in reranked_passages[:top_k]]
        return final_metas
