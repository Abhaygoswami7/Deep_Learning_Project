"""
Enhanced Recommendation Engine.
Combines:
  1. Content-based filtering (MiniLM cosine similarity) — 40%
  2. Collaborative filtering (co-interaction patterns) — 30%
  3. Behavior-weighted scoring (tracking signals) — 20%
  4. Popularity/trending — 10%

Also provides: category recommendations, semantic search, hybrid recommendations,
personalized "For You" feed, and explainability reasons.
"""
import pickle
import json
import os
import math
import time
from collections import Counter, defaultdict
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


# -------------------- IN-MEMORY CACHE --------------------
_cache = {}
_cache_ttl = 300  # 5 minute cache


def _cache_get(key):
    if key in _cache:
        val, ts = _cache[key]
        if time.time() - ts < _cache_ttl:
            return val
        del _cache[key]
    return None


def _cache_set(key, val):
    _cache[key] = (val, time.time())
    # Evict old entries if cache is too large
    if len(_cache) > 500:
        oldest_key = min(_cache, key=lambda k: _cache[k][1])
        del _cache[oldest_key]


# ==================== CONTENT-BASED (COSINE SIMILARITY) ====================
def recommend(product_id, top_k=5):
    """Content-based recommendations using MiniLM embeddings."""
    cache_key = f"rec_{product_id}_{top_k}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

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

        result = {
            "based_on": df.iloc[idx]['name'],
            "items": results
        }
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        return {"error": str(e)}


# ==================== PERSONALIZED (USER HISTORY) ====================
def personalized_recommend(top_k=5):
    """Personalized recommendations based on click history."""
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


# ==================== TRENDING ====================
def get_trending_products(df_data, top_k=8):
    """Get trending products based on interaction scores."""
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


# ==================== CATEGORY ====================
def category_recommend(product_id, top_k=5):
    """Recommend products in the same category."""
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


# ==================== COLLABORATIVE FILTERING ====================
def _get_collaborative_scores(user_id, product_id, top_k=10):
    """
    Collaborative filtering: find users with similar interaction patterns
    and recommend products they interacted with.
    """
    try:
        from database import get_db
        db = get_db()

        # Get all users who interacted with the same product
        similar_users = db.execute("""
            SELECT DISTINCT user_id FROM events
            WHERE target_type = 'product' AND target_id = ?
            AND user_id != ? AND user_id > 0
        """, (product_id, user_id)).fetchall()

        if not similar_users:
            return {}

        similar_user_ids = [u["user_id"] for u in similar_users]

        # Get products these similar users interacted with
        placeholders = ",".join("?" * len(similar_user_ids))
        interactions = db.execute(f"""
            SELECT target_id as product_id, COUNT(*) as interaction_count,
                   SUM(CASE WHEN event_type = 'click' THEN 3
                           WHEN event_type = 'like' THEN 5
                           WHEN event_type = 'view' THEN 2
                           WHEN event_type = 'hover' THEN 1
                           ELSE 1 END) as weighted_score
            FROM events
            WHERE user_id IN ({placeholders})
            AND target_type = 'product'
            AND target_id != ?
            GROUP BY target_id
            ORDER BY weighted_score DESC
            LIMIT ?
        """, (*similar_user_ids, product_id, top_k)).fetchall()

        scores = {}
        max_score = max((i["weighted_score"] for i in interactions), default=1)
        for i in interactions:
            scores[i["product_id"]] = i["weighted_score"] / max_score

        return scores
    except Exception:
        return {}


# ==================== BEHAVIOR-WEIGHTED SCORING ====================
def _get_behavior_scores(user_id):
    """
    Compute behavior-weighted scores per category for a user.
    Uses event data with signal-specific weights and time decay.
    """
    try:
        from database import get_db
        db = get_db()

        prefs = db.execute("""
            SELECT category, score FROM user_preferences
            WHERE user_id = ?
        """, (user_id,)).fetchall()

        if not prefs:
            return {}

        scores = {}
        max_score = max((p["score"] for p in prefs), default=1)
        for p in prefs:
            scores[p["category"]] = p["score"] / max(max_score, 1)

        return scores
    except Exception:
        return {}


# ==================== POPULARITY SCORING ====================
def _get_popularity_scores():
    """Get popularity scores based on total interactions per product."""
    try:
        from database import get_db
        db = get_db()

        popular = db.execute("""
            SELECT target_id as product_id, COUNT(*) as count
            FROM events
            WHERE target_type = 'product'
            GROUP BY target_id
            ORDER BY count DESC
            LIMIT 50
        """).fetchall()

        if not popular:
            return {}

        max_count = max((p["count"] for p in popular), default=1)
        return {p["product_id"]: p["count"] / max_count for p in popular}
    except Exception:
        return {}


# ==================== HYBRID RECOMMENDATION ====================
def hybrid_recommend(product_id, top_k=5):
    """
    Hybrid recommendation combining content + category similarity.
    (Original hybrid — preserved for backward compatibility)
    """
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


# ==================== SMART RECOMMENDATION (FULL HYBRID) ====================
def smart_recommend(product_id, user_id=0, top_k=10):
    """
    FULL hybrid recommendation engine.
    Combines 4 signals:
      40% content similarity (MiniLM cosine)
      30% collaborative filtering (co-interaction patterns)
      20% behavior-weighted boost (user preference scores)
      10% popularity/trending

    Also applies diversity penalty to avoid homogeneous results.
    """
    cache_key = f"smart_{product_id}_{user_id}_{top_k}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    try:
        # 1. Get content-based candidates (larger pool for re-ranking)
        idx = df[df['id'] == product_id].index[0]
        similarities = cosine_similarity([embeddings[idx]], embeddings)[0]
        candidate_indices = similarities.argsort()[::-1][1:51]  # top 50 candidates

        # 2. Get collaborative scores
        collab_scores = _get_collaborative_scores(user_id, product_id) if user_id > 0 else {}

        # 3. Get behavior scores (category preferences)
        behavior_scores = _get_behavior_scores(user_id) if user_id > 0 else {}

        # 4. Get popularity scores
        popularity_scores = _get_popularity_scores()

        # 5. Score each candidate
        scored_candidates = []
        for i in candidate_indices:
            pid = int(df.iloc[i]['id'])
            category = df.iloc[i]['category']

            # Content similarity (40%)
            content_score = float(similarities[i]) * 0.4

            # Collaborative filtering (30%)
            collab_score = collab_scores.get(pid, 0) * 0.3

            # Behavior-weighted boost (20%)
            behavior_score = behavior_scores.get(category, 0) * 0.2

            # Popularity (10%)
            pop_score = popularity_scores.get(pid, 0) * 0.1

            final_score = content_score + collab_score + behavior_score + pop_score

            # Generate explainability reason
            reasons = []
            if content_score > 0.15:
                reasons.append("Similar content")
            if collab_score > 0.1:
                reasons.append("Users also liked")
            if behavior_score > 0.05:
                reasons.append("Matches your interests")
            if pop_score > 0.05:
                reasons.append("Trending now")

            reason = " • ".join(reasons) if reasons else "Recommended for you"

            scored_candidates.append({
                "id": pid,
                "name": df.iloc[i]['name'],
                "category": category,
                "image": df.iloc[i]['image'],
                "price": int(df.iloc[i]['price']),
                "score": round(final_score, 4),
                "content_score": round(content_score, 4),
                "collab_score": round(collab_score, 4),
                "behavior_score": round(behavior_score, 4),
                "popularity_score": round(pop_score, 4),
                "reason": reason,
            })

        # 6. Sort by final score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # 7. Apply diversity penalty (max 3 from same category in top results)
        diversified = []
        category_counts = defaultdict(int)

        for item in scored_candidates:
            if category_counts[item["category"]] < 3:
                diversified.append(item)
                category_counts[item["category"]] += 1
                if len(diversified) >= top_k:
                    break

        source_product = df.iloc[idx]
        result = {
            "based_on": {
                "id": int(source_product['id']),
                "name": source_product['name'],
                "category": source_product['category'],
            },
            "algorithm": "hybrid_v2",
            "weights": {
                "content": 0.4,
                "collaborative": 0.3,
                "behavior": 0.2,
                "popularity": 0.1,
            },
            "items": diversified,
        }

        _cache_set(cache_key, result)
        return result

    except Exception as e:
        return {"error": str(e)}


# ==================== FOR YOU (PERSONALIZED FEED) ====================
def for_you_recommend(user_id, top_k=12):
    """
    Fully personalized "For You" recommendations.
    Uses user's complete behavior profile to rank ALL products.
    """
    if user_id <= 0:
        # Fallback: return popular/trending
        return {"items": [], "message": "Login to get personalized recommendations"}

    try:
        from database import get_db
        db = get_db()

        # Get user's most interacted products
        user_products = db.execute("""
            SELECT target_id, COUNT(*) as count
            FROM events
            WHERE user_id = ? AND target_type = 'product'
            GROUP BY target_id
            ORDER BY count DESC
            LIMIT 5
        """, (user_id,)).fetchall()

        if not user_products:
            # Fallback: return popular products
            popular = _get_popularity_scores()
            if popular:
                sorted_popular = sorted(popular.items(), key=lambda x: x[1], reverse=True)[:top_k]
                items = []
                for pid, score in sorted_popular:
                    product = df[df['id'] == pid]
                    if len(product) > 0:
                        p = product.iloc[0]
                        items.append({
                            "id": int(p['id']),
                            "name": p['name'],
                            "category": p['category'],
                            "image": p['image'],
                            "price": int(p['price']),
                            "score": round(score, 4),
                            "reason": "Popular right now",
                        })
                return {"items": items}

            # Ultimate fallback
            items = []
            for _, p in df.sample(min(top_k, len(df))).iterrows():
                items.append({
                    "id": int(p['id']),
                    "name": p['name'],
                    "category": p['category'],
                    "image": p['image'],
                    "price": int(p['price']),
                    "score": 0,
                    "reason": "Discover something new",
                })
            return {"items": items}

        # Aggregate embeddings from user's interacted products
        import numpy as np
        user_product_ids = [u["target_id"] for u in user_products]
        user_embedding_indices = []
        for pid in user_product_ids:
            indices = df[df['id'] == pid].index
            if len(indices) > 0:
                user_embedding_indices.append(indices[0])

        if not user_embedding_indices:
            return {"items": [], "message": "No matching products found"}

        # Create user profile embedding (mean of interacted product embeddings)
        user_embedding = np.mean(embeddings[user_embedding_indices], axis=0)

        # Compute similarity to all products
        similarities = cosine_similarity([user_embedding], embeddings)[0]

        # Get behavior scores for category weighting
        behavior_scores = _get_behavior_scores(user_id)

        # Score all products
        scored = []
        for i in range(len(df)):
            pid = int(df.iloc[i]['id'])
            if pid in user_product_ids:
                continue  # Skip already seen

            category = df.iloc[i]['category']
            content_score = float(similarities[i]) * 0.5
            behavior_score = behavior_scores.get(category, 0) * 0.3
            diversity_bonus = 0.2 if category not in [df.iloc[j]['category'] for j in user_embedding_indices[:2]] else 0

            final_score = content_score + behavior_score + diversity_bonus

            reason_parts = []
            if content_score > 0.2:
                reason_parts.append("Matches your taste")
            if behavior_score > 0.1:
                reason_parts.append(f"You like {category}")
            reason = " • ".join(reason_parts) if reason_parts else "Picked for you"

            scored.append({
                "id": pid,
                "name": df.iloc[i]['name'],
                "category": category,
                "image": df.iloc[i]['image'],
                "price": int(df.iloc[i]['price']),
                "score": round(final_score, 4),
                "reason": reason,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)

        # Diversify
        diversified = []
        cat_counts = defaultdict(int)
        for item in scored:
            if cat_counts[item["category"]] < 3:
                diversified.append(item)
                cat_counts[item["category"]] += 1
                if len(diversified) >= top_k:
                    break

        return {"items": diversified}

    except Exception as e:
        return {"error": str(e)}


# ==================== SEARCH (SEMANTIC) ====================
def search_products(query, top_k=10):
    """Semantic search using MiniLM embeddings."""
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


# ==================== USER HISTORY ====================
def get_user_history(top_k=10):
    """Get user's recently viewed products (from JSON file)."""
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