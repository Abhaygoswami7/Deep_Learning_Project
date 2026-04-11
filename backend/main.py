"""
Main FastAPI application.
Mounts all routers for the PadHatke + BuyHatke dual-platform ecosystem.
"""
from fastapi import FastAPI, Query, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import numpy as np
from typing import Optional

from database import init_db, get_db
from auth import router as auth_router, get_current_user
from feed import router as feed_router
from ads import router as ads_router
from tracking import router as tracking_router
from recommend import (
    recommend, personalized_recommend, category_recommend,
    get_trending_products, hybrid_recommend, search_products,
    get_user_history, smart_recommend, for_you_recommend
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
app = FastAPI(
    title="PadHatke + BuyHatke API",
    description="Dual-platform ecosystem: Social content + Product recommendations",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- MOUNT ROUTERS --------------------
app.include_router(auth_router)
app.include_router(feed_router)
app.include_router(ads_router)
app.include_router(tracking_router)

# -------------------- STARTUP --------------------
@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()
    # Seed if empty
    db = get_db()
    user_count = db.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
    if user_count == 0:
        print("[SEED] No data found. Running seed...")
        from seed_data import seed_database
        seed_database()


# -------------------- ROOT --------------------
@app.get("/")
def home():
    return {
        "status": "success",
        "message": "[>>] PadHatke + BuyHatke API is running",
        "platforms": {
            "padhatke": "Social content platform (Twitter-style)",
            "buyhatke": "Product recommendation platform (E-commerce)",
        },
        "docs": "/docs",
    }


# -------------------- PRODUCTS --------------------
@app.get("/products")
def get_products():
    try:
        df = pd.read_csv("../data/products.csv")
        data = df.to_dict(orient="records")
        return convert_types(data)
    except Exception as e:
        return {"error": str(e)}


@app.get("/products/{product_id}")
def get_product(product_id: int):
    """Get a single product by ID."""
    try:
        df = pd.read_csv("../data/products.csv")
        product = df[df['id'] == product_id]
        if len(product) == 0:
            return {"error": "Product not found"}
        p = product.iloc[0]
        return convert_types({
            "id": int(p['id']),
            "name": p['name'],
            "description": p['description'],
            "category": p['category'],
            "image": p['image'],
            "price": int(p['price']),
        })
    except Exception as e:
        return {"error": str(e)}


# -------------------- FOR YOU --------------------
@app.get("/recommend/for-you")
def get_for_you(authorization: Optional[str] = Header(None)):
    """Fully personalized 'For You' recommendations."""
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0
    results = for_you_recommend(user_id)
    return convert_types({"status": "success", "recommendations": results})


# -------------------- SMART RECOMMEND (FULL HYBRID) --------------------
@app.get("/recommend/smart/{product_id}")
def get_smart_recommendations(
    product_id: int,
    authorization: Optional[str] = Header(None),
):
    """Full hybrid recommendation: content + collaborative + behavior + popularity."""
    user_data = get_current_user(authorization)
    user_id = user_data["user_id"] if user_data else 0
    results = smart_recommend(product_id, user_id)
    return convert_types({"status": "success", "recommendations": results})


# -------------------- RECOMMEND --------------------
@app.get("/recommend/{product_id}")
def get_recommendations(product_id: int):
    try:
        results = recommend(product_id)
        return convert_types({"status": "success", "product_id": int(product_id), "recommendations": results})
    except Exception as e:
        return {"status": "error", "message": str(e)}


# -------------------- TRACK CLICK (legacy) --------------------
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