import weaviate
import logging

logger = logging.getLogger(__name__)

_client = None

def get_weaviate_client():
    """Return a singleton Weaviate client."""
    global _client
    if _client is None:
        logger.info("Initializing Weaviate client...")
        try:
            _client = weaviate.connect_to_local(
                host="localhost",
                port=8080,
            )
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {e}")
            raise
    return _client

def close_weaviate_client():
    """Close the Weaviate client connection."""
    global _client
    if _client is not None:
        logger.info("Closing Weaviate client...")
        _client.close()
        _client = None
