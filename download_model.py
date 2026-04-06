import os
from sentence_transformers import SentenceTransformer

def download_and_save_model():
    try:
        print("Downloading model... (this may take 1-2 minutes)")

        # Create models directory if not exists
        os.makedirs("models", exist_ok=True)

        # Load model from Hugging Face
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

        # Save model locally
        save_path = "models/minilm"
        model.save(save_path)

        print(f"✅ Model successfully saved at: {save_path}")

    except Exception as e:
        print("❌ Error occurred while downloading model:")
        print(e)

if __name__ == "__main__":
    download_and_save_model()