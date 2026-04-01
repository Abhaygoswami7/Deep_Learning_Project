from sentence_transformers import SentenceTransformer
import os

model_name = 'sentence-transformers/all-MiniLM-L6-v2'
save_path = os.path.join('models', 'all-MiniLM-L6-v2')

print(f"Downloading model: {model_name}...")
model = SentenceTransformer(model_name)

print(f"Saving model to: {save_path}...")
model.save(save_path)

print("Model download and save complete.")
