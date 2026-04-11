import pandas as pd
import pickle
from sentence_transformers import SentenceTransformer

# Load model (local path)
model = SentenceTransformer('../models/minilm')

# Load product data
df = pd.read_csv('../data/products.csv')

# Combine text fields into one
df['text'] = df['name'] + " " + df['description'] + " " + df['category']

# Generate embeddings
print("Generating embeddings...")
embeddings = model.encode(df['text'].tolist())

# Save embeddings + dataframe
with open('../models/embeddings.pkl', 'wb') as f:
    pickle.dump((df, embeddings), f)

print("[OK] Embeddings created and saved!")