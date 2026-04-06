import pickle
import json
import os
from collections import Counter
from sklearn.metrics.pairwise import cosine_similarity

# -------------------- PATHS --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -------------------- LOAD DATA --------------------
with open(os.path.join(BASE_DIR, '../models/embeddings.pkl'), 'rb') as f:
    df, embeddings = pickle.load(f)

# -------------------- LAZY MODEL LOADING (FOR SEARCH) --------------------
_search_model = None

def _get_search_model():
    global _search_model
    if _search_model is None:
        from sentence_transformers import SentenceTransformer
        model_path = os.path.join(BASE_DIR, '../models/minilm')
        _search_model = SentenceTransformer(model_path)
    return _search_model

# -------------------- RECOMMEND (COSINE SIMILARITY) --------------------
def recommend(product_id, top_k=5):
    try:
        idx = df[df['id'] == product_id].index[0]
        similarities = cosine_similarity([embeddings[idx]], embeddings)[0]
        similar_indices = similarities.argsort()[::-1][1:top_k+1]

        results = []
        for i in similar_indices:
            results.append({
                "id": int(df.iloc[i]['id']),
                "name": df.iloc[i]['name'],
                "category": df.iloc[i]['category'],
                "image": df.iloc[i]['image'],
                "price": int(df.iloc[i]['price']),
                "similarity_score": float(similarities[i])
            })

        return {
            "based_on": df.iloc[idx]['name'],
            "items": results
        }
    except Exception as e:
        return {"error": str(e)}

# -------------------- PERSONALIZED --------------------
def personalized_recommend(top_k=5):
    try:
        file_path = os.path.join(BASE_DIR, "user_data.json")
        with open(file_path, "r") as f:
            data = json.load(f)

        clicks = data.get("clicks", [])
        if not clicks:
            return {"message": "No user data available", "items": []}

        most_common = Counter(clicks).most_common(1)[0][0]
        return recommend(most_common, top_k)
    except Exception as e:
        return {"error": str(e)}

# -------------------- TRENDING --------------------
def get_trending_products(df_data, top_k=8):
    try:
        file_path = os.path.join(BASE_DIR, "trending.json")
        with open(file_path, "r") as f:
            trending = json.load(f)

        sorted_items = sorted(trending.items(), key=lambda x: x[1], reverse=True)

        results = []
        for product_id, score in sorted_items[:top_k]:
            product = df_data[df_data['id'] == int(product_id)]
            if len(product) == 0:
                continue
            product = product.iloc[0]
            results.append({
                "id": int(product['id']),
                "name": product['name'],
                "category": product['category'],
                "image": product['image'],
                "price": int(product['price']),
                "popularity_score": int(score)
            })

        return results
    except Exception as e:
        return {"error": str(e)}

# -------------------- CATEGORY --------------------
def category_recommend(product_id, top_k=5):
    try:
        product = df[df['id'] == product_id].iloc[0]
        category = product['category']
        same_category = df[df['category'] == category]
        same_category = same_category[same_category['id'] != product_id]

        results = []
        for _, row in same_category.head(top_k).iterrows():
            results.append({
                "id": int(row['id']),
                "name": row['name'],
                "category": row['category'],
                "image": row['image'],
                "price": int(row['price'])
            })

        return {
            "based_on_category": category,
            "items": results
        }
    except Exception as e:
        return {"error": str(e)}

# -------------------- HYBRID (EXPLAINABLE AI) --------------------
def hybrid_recommend(product_id, top_k=5):
    try:
        sim_data = recommend(product_id, top_k)
        cat_data = category_recommend(product_id, top_k)

        sim_results = sim_data.get("items", [])
        cat_results = cat_data.get("items", [])
        combined = {}

        for item in sim_results:
            pid = int(item["id"])
            combined[pid] = {
                "id": pid,
                "name": item["name"],
                "category": item["category"],
                "image": item["image"],
                "price": int(item["price"]),
                "score": float(item.get("similarity_score", 0)) * 0.7,
                "reason": "Similar to your interest"
            }

        for item in cat_results:
            pid = int(item["id"])
            if pid in combined:
                combined[pid]["score"] += 0.3
                combined[pid]["reason"] = "Similar + Same category"
            else:
                combined[pid] = {
                    "id": pid,
                    "name": item["name"],
                    "category": item["category"],
                    "image": item["image"],
                    "price": int(item["price"]),
                    "score": 0.3,
                    "reason": "Same category preference"
                }

        final = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
        return {
            "based_on": int(product_id),
            "items": final[:top_k]
        }
    except Exception as e:
        return {"error": str(e)}

# -------------------- SEARCH (SEMANTIC) --------------------
def search_products(query, top_k=10):
    try:
        model = _get_search_model()
        query_embedding = model.encode([query])
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        top_indices = similarities.argsort()[::-1][:top_k]

        results = []
        for i in top_indices:
            if similarities[i] > 0.1:
                results.append({
                    "id": int(df.iloc[i]['id']),
                    "name": df.iloc[i]['name'],
                    "category": df.iloc[i]['category'],
                    "image": df.iloc[i]['image'],
                    "price": int(df.iloc[i]['price']),
                    "relevance_score": float(similarities[i])
                })

        return results
    except Exception as e:
        return {"error": str(e)}

# -------------------- USER HISTORY --------------------
def get_user_history(top_k=10):
    try:
        file_path = os.path.join(BASE_DIR, "user_data.json")
        with open(file_path, "r") as f:
            data = json.load(f)

        clicks = data.get("clicks", [])
        if not clicks:
            return {"items": []}

        seen = set()
        unique_ids = []
        for pid in reversed(clicks):
            if pid not in seen:
                seen.add(pid)
                unique_ids.append(pid)
            if len(unique_ids) >= top_k:
                break

        results = []
        for pid in unique_ids:
            product = df[df['id'] == int(pid)]
            if len(product) == 0:
                continue
            product = product.iloc[0]
            results.append({
                "id": int(product['id']),
                "name": product['name'],
                "category": product['category'],
                "image": product['image'],
                "price": int(product['price'])
            })

        return {"items": results}
    except Exception as e:
        return {"error": str(e)}