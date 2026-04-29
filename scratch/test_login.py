import requests

url = "http://127.0.0.1:8000/auth/login"
data = {
    "username": "techie_rahul",
    "password": "test123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
