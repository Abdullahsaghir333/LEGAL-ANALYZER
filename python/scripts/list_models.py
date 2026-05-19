import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path
import os

# Explicitly load .env and OVERRIDE global/system env vars
env_path = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(dotenv_path=env_path, override=True)

# Verify which key is being loaded
print("Loaded Key:", os.getenv("GEMINI_API_KEY"))

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# List available models
for model in genai.list_models():
    if "generateContent" in model.supported_generation_methods:
        print(f"Name:        {model.name}")
        print(f"Display:     {model.display_name}")
        print(f"Methods:     {model.supported_generation_methods}")
        print("-" * 50)