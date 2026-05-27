import weaviate
import weaviate.classes as wvc
from weaviate.classes.config import Configure, Property, DataType, VectorDistances
from dotenv import load_dotenv
import os

load_dotenv()

def setup_weaviate():
    client = weaviate.connect_to_local(
        host="localhost",
        port=8080,
    )
    try:
        print("Connected to Weaviate:", client.is_ready())
        collection_name = "LawyerDocumentChunk"
        
        if client.collections.exists(collection_name):
            print(f"Collection '{collection_name}' already exists.")
            return

        client.collections.create(
            name=collection_name,
            vectorizer_config=Configure.Vectorizer.none(),
            vector_index_config=Configure.VectorIndex.hnsw(
                distance_metric=VectorDistances.COSINE
            ),
            properties=[
                Property(name="text", data_type=DataType.TEXT),
                Property(name="lawyer_id", data_type=DataType.TEXT, description="ID of the lawyer who owns this document"),
                Property(name="document_type", data_type=DataType.TEXT),
                Property(name="source", data_type=DataType.TEXT),
            ]
        )
        print(f"\nCollection '{collection_name}' created successfully.")
    finally:
        client.close()

if __name__ == "__main__":
    setup_weaviate()
