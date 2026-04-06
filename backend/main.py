from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import numpy as np

from recommend import (
    recommend, personalized_recommend, category_recommend,
    get_trending_products, hybrid_recommend, search_products,
    get_user_history
)

# -------------------- HELPER --------------------
def convert_types(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, list):
        return [convert_types(i) for i in obj]
    if isinstance(obj, dict):
        return {k: convert_types(v) for k, v in obj.items()}
    return obj

# -------------------- APP --------------------
app = FastAPI(title="Product Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- ROOT --------------------
@app.get("/")
def home():
    return {"status": "success", "message": "🚀 Recommendation API is running"}

# -------------------- PRODUCTS --------------------
@app.get("/products")
def get_products():
    try:
        df = pd.read_csv("../data/products.csv")
        data = df.to_dict(orient="records")
        return convert_types(data)
    except Exception as e:
        return {"error": str(e)}

# -------------------- RECOMMEND --------------------
@app.get("/recommend/{product_id}")
def get_recommendations(product_id: int):
    try:
        results = recommend(product_id)
        return convert_types({"status": "success", "product_id": int(product_id), "recommendations": results})
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------- TRACK CLICK --------------------
@app.post("/track_click/{product_id}")
def track_click(product_id: int):
    try:
        file_path = "user_data.json"
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
        except Exception:
            data = {"clicks": []}

        data["clicks"].append(int(product_id))

        with open(file_path, "w") as f:
            json.dump(data, f)

        return {"status": "success", "product_id": int(product_id)}
    except Exception as e:
        return {"error": str(e)}

# -------------------- PERSONALIZED --------------------
@app.get("/personalized")
def get_personalized():
    try:
        results = personalized_recommend()
        return convert_types({"status": "success", "recommendations": results})
    except Exception as e:
        return {"error": str(e)}

# -------------------- CATEGORY --------------------
@app.get("/category/{product_id}")
def category_based(product_id: int):
    results = category_recommend(product_id)
    return convert_types({"category_recommendations": results})

# -------------------- TRENDING --------------------
@app.get("/trending")
def trending():
    df = pd.read_csv("../data/products.csv")
    results = get_trending_products(df)
    return convert_types({"trending": results})

# -------------------- HYBRID --------------------
@app.get("/hybrid/{product_id}")
def hybrid(product_id: int):
    results = hybrid_recommend(product_id)
    return convert_types({"hybrid_recommendations": results})

# -------------------- SEARCH --------------------
@app.get("/search")
def search(q: str = Query(..., min_length=1)):
    try:
        results = search_products(q)
        return convert_types({"status": "success", "query": q, "results": results})
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------- USER HISTORY --------------------
@app.get("/user_history")
def user_history():
    try:
        results = get_user_history()
        return convert_types({"status": "success", "history": results})
    except Exception as e:
        return {"error": str(e)}