"""
Seed script — Populate database with sample data for both platforms.
Creates sample users, posts, ads, and initial behavior events.
Run once: python seed_data.py
"""
import os
import sys
import random

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db
from auth import hash_password

# Sample social media posts content
SAMPLE_POSTS = [
    "Just got my new iPhone 15! The camera quality is absolutely insane 📸 #Apple #Tech",
    "Anyone tried the new Samsung Galaxy S23? Thinking of switching from Apple... 🤔",
    "Best productivity hack: Deep Work by Cal Newport. Changed my entire routine! 📚 #BookRecommendation",
    "Morning run completed 🏃‍♂️ 5km in 25 minutes. These new running shoes are game changers!",
    "My home office setup is finally complete. The MacBook Air M1 is the heart of it all 💻",
    "Online shopping addiction is real 😅 Just bought 3 new books from BuyHatke",
    "The Sony WH-1000XM4 headphones are worth every penny. Best noise cancellation ever! 🎧",
    "Meal prep Sunday! Using my new Prestige pressure cooker. Saves so much time ⏰",
    "Just finished reading Atomic Habits. Life-changing book! Who else has read it? 📖",
    "Fashion tip: A good pair of jeans can make any outfit look amazing 👖 #OOTD",
    "Gym day! Resistance bands workout at home. No excuses! 💪 #FitnessGoals",
    "Can't decide between foam roller and yoga mat for recovery. What do you recommend? 🧘",
    "My skincare routine: Minimalist Niacinamide serum + Neutrogena Sunscreen = ✨ perfection",
    "Kids absolutely love the LEGO set I got them! Best investment ever 🧱",
    "Anyone else obsessed with The Alchemist? Reading it for the third time! ✨",
    "Just set up the Mi Smart TV 43 inch. Picture quality is amazing for the price! 📺",
    "Weekend cooking experiment: Made pasta from scratch! Electric kettle helped so much 🍝",
    "My Wildcraft backpack has survived 3 years of daily use. Quality matters! 🎒",
    "Started journaling after reading Think and Grow Rich. Highly recommend for anyone in business 📝",
    "Is it just me or are boAt earbuds THE best budget audio option? 🎵",
    "Finally organized my kitchen with those airtight containers. So satisfying! ✨",
    "Morning skin care with Lakme moisturizer + Himalaya face pack = glow up 🌟",
    "These Men's Running Shoes are incredibly lightweight. Perfect for morning jogs! 👟",
    "Hot take: Ikigai is better than Atomic Habits. Fight me 😤📚",
    "Dalgona coffee with Bru Instant Coffee ☕ Weekend vibes!",
    "Remote work essentials: Good laptop stand + Amazon Basics sleeve = productivity 💼",
    "Power bank saved my life during a 12-hour travel day. 20000mAh is the sweet spot! 🔋",
    "Date night outfit sorted: New formal shirt + leather shoes = 🔥",
    "Teaching my kid math with jigsaw puzzles. Learning through play is the best! 🧩",
    "Protein shake after workout hits different 💪 Whey protein + banana = perfect combo",
]

# Sample users
SAMPLE_USERS = [
    {"username": "techie_rahul", "email": "rahul@test.com", "password": "test123", "display_name": "Rahul Sharma"},
    {"username": "priya_reads", "email": "priya@test.com", "password": "test123", "display_name": "Priya Patel"},
    {"username": "fitness_arjun", "email": "arjun@test.com", "password": "test123", "display_name": "Arjun Singh"},
    {"username": "foodie_ananya", "email": "ananya@test.com", "password": "test123", "display_name": "Ananya Gupta"},
    {"username": "dev_vikram", "email": "vikram@test.com", "password": "test123", "display_name": "Vikram Kumar"},
    {"username": "style_neha", "email": "neha@test.com", "password": "test123", "display_name": "Neha Verma"},
    {"username": "bookworm_aditya", "email": "aditya@test.com", "password": "test123", "display_name": "Aditya Joshi"},
    {"username": "gadget_guru", "email": "guru@test.com", "password": "test123", "display_name": "Gaurav Tech"},
]


def seed_database():
    """Seed the database with sample data."""
    init_db()
    db = get_db()

    # Check if already seeded
    existing_users = db.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
    if existing_users > 0:
        print("[WARN] Database already seeded. Skipping...")
        return

    print("[SEED] Seeding database...")

    # 1. Create users
    user_ids = []
    for user in SAMPLE_USERS:
        cursor = db.execute(
            "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
            (user["username"], user["email"], hash_password(user["password"]), user["display_name"])
        )
        user_ids.append(cursor.lastrowid)
    print(f"  [OK] Created {len(user_ids)} users")

    # 2. Create posts
    post_ids = []
    for i, content in enumerate(SAMPLE_POSTS):
        user_id = user_ids[i % len(user_ids)]
        likes = random.randint(0, 50)
        comments = random.randint(0, 15)
        shares = random.randint(0, 10)

        cursor = db.execute(
            "INSERT INTO posts (user_id, content, likes_count, comments_count, shares_count) VALUES (?, ?, ?, ?, ?)",
            (user_id, content, likes, comments, shares)
        )
        post_ids.append(cursor.lastrowid)
    print(f"  [OK] Created {len(post_ids)} posts")

    # 3. Create ads (one for each product category + some specific products)
    import pandas as pd
    products_df = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/products.csv"))

    ad_products = [1, 4, 6, 11, 15, 21, 31, 41, 51, 61, 71, 81, 91,
                   2, 7, 23, 36, 47, 56, 63, 73, 82, 95]

    ad_count = 0
    for pid in ad_products:
        product = products_df[products_df['id'] == pid]
        if len(product) == 0:
            continue
        p = product.iloc[0]
        db.execute("""
            INSERT INTO ads (product_id, title, description, image_url, target_url, impressions, clicks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            int(p['id']),
            f"🔥 {p['name']} — Special Deal!",
            p['description'],
            p['image'],
            f"/buyhatke/product/{int(p['id'])}",
            random.randint(100, 1000),
            random.randint(5, 100),
        ))
        ad_count += 1

    # Update CTR for all ads
    db.execute("UPDATE ads SET ctr = CAST(clicks AS REAL) / MAX(impressions, 1)")
    print(f"  [OK] Created {ad_count} ads")

    # 4. Create sample behavior events
    event_types = ["click", "view", "hover", "scroll", "pause", "like"]
    target_types = ["product", "post", "ad"]
    platforms = ["padhatke", "buyhatke"]

    event_count = 0
    for _ in range(200):
        user_id = random.choice(user_ids)
        event_type = random.choice(event_types)
        target_type = random.choice(target_types)

        if target_type == "product":
            target_id = random.randint(1, 100)
        elif target_type == "post":
            target_id = random.choice(post_ids) if post_ids else 1
        else:
            target_id = random.randint(1, ad_count)

        duration = random.randint(500, 15000) if event_type in ("view", "hover") else 0
        scroll_depth = round(random.random(), 2) if event_type == "scroll" else 0

        db.execute("""
            INSERT INTO events (user_id, event_type, target_type, target_id,
                               duration_ms, scroll_depth, platform)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, event_type, target_type, target_id, duration, scroll_depth,
              random.choice(platforms)))
        event_count += 1

    print(f"  [OK] Created {event_count} behavior events")

    # 5. Create user preferences from events
    categories = ["electronics", "clothing", "home_kitchen", "beauty", "footwear",
                   "accessories", "fitness", "books", "toys", "groceries"]

    for user_id in user_ids:
        # Give each user 3-5 preferred categories
        num_prefs = random.randint(3, 5)
        preferred = random.sample(categories, num_prefs)
        for i, cat in enumerate(preferred):
            score = round(random.uniform(2.0, 15.0) * (1 - i * 0.15), 2)
            db.execute(
                "INSERT OR REPLACE INTO user_preferences (user_id, category, score) VALUES (?, ?, ?)",
                (user_id, cat, score)
            )

    print(f"  [OK] Created user preferences")

    db.commit()
    print("\n[DONE] Database seeded successfully!")
    print(f"[DB] Database location: {os.path.join(os.path.dirname(os.path.abspath(__file__)), 'platform.db')}")
    print(f"\n[INFO] Test credentials:")
    for user in SAMPLE_USERS[:3]:
        print(f"   Username: {user['username']} | Password: {user['password']}")


if __name__ == "__main__":
    seed_database()
