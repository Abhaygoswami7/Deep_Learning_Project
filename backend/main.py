from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import torch
import json
import os

app = FastAPI(title="Product Recommendation System API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model locally
MODEL_PATH = os.path.join("..", "models", "all-MiniLM-L6-v2")
if not os.path.exists(MODEL_PATH):
    # Fallback to online if local not found, though we just downloaded it
    MODEL_PATH = 'sentence-transformers/all-MiniLM-L6-v2'

print(f"Loading model from {MODEL_PATH}...")
model = SentenceTransformer(MODEL_PATH)

# Load products
DATA_PATH = os.path.join("..", "data", "products.json")
with open(DATA_PATH, 'r') as f:
    products = json.load(f)

# Pre-compute product embeddings
print("Pre-computing product embeddings...")
product_texts = [f"{p['name']} {p['description']} {p['category']}" for p in products]
product_embeddings = model.encode(product_texts, convert_to_tensor=True)

@app.get("/products")
async def get_products():
    return products

@app.get("/recommend")
async def recommend(query: str = Query(..., description="The product name or interest")):
    # Encode query
    query_embedding = model.encode(query, convert_to_tensor=True)
    
    # Compute cosine similarities
    cos_scores = util.cos_sim(query_embedding, product_embeddings)[0]
    
    # Get top 4 results
    top_results = torch.topk(cos_scores, k=min(4, len(products)))
    
    recommended_products = []
    for score, idx in zip(top_results[0], top_results[1]):
        product = products[idx.item()].copy()
        product['similarity_score'] = float(score)
        recommended_products.append(product)
        
    return recommended_products

@app.get("/related/{product_id}")
async def get_related(product_id: int):
    # Find the target product
    target_product = next((p for p in products if p['id'] == product_id), None)
    if not target_product:
        return {"error": "Product not found"}
    
    target_text = f"{target_product['name']} {target_product['description']} {target_product['category']}"
    target_embedding = model.encode(target_text, convert_to_tensor=True)
    
    cos_scores = util.cos_sim(target_embedding, product_embeddings)[0]
    
    # Get top 5, skip the first one (itself)
    top_results = torch.topk(cos_scores, k=min(5, len(products)))
    
    recommended_products = []
    for score, idx in zip(top_results[0], top_results[1]):
        if products[idx.item()]['id'] == product_id:
            continue
        product = products[idx.item()].copy()
        product['similarity_score'] = float(score)
        recommended_products.append(product)
        
    return recommended_products[:4]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
