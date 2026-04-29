import requests

url = "http://127.0.0.1:8000/auth/login"
data = {
    "username": "123",
    "password": "123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login Success!")
        print(f"Token: {response.json().get('access_token')[:20]}...")
    else:
        print(f"Login Failed: {response.json()}")
except Exception as e:
    print(f"Error (Make sure backend is running): {e}")
