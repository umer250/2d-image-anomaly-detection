import requests

def test_api():
    base_url = "http://localhost:8000/api/v1"
    
    # login
    login_data = {
        "username": "admin@example.com",
        "password": "Admin@123"
    }
    print(f"Attempting login for {login_data['username']}...")
    try:
        response = requests.post(f"{base_url}/auth/login", data=login_data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("Login successful.")
            
            # test history
            headers = {"Authorization": f"Bearer {token}"}
            print("Testing /history endpoint...")
            # Note: Trying with and without trailing slash
            hist_response = requests.get(f"{base_url}/history", headers=headers)
            print(f"/history (no slash) status: {hist_response.status_code}")
            if hist_response.status_code != 200:
                print(f"Response: {hist_response.text}")
                
            hist_response_slash = requests.get(f"{base_url}/history/", headers=headers)
            print(f"/history/ (with slash) status: {hist_response_slash.status_code}")
            if hist_response_slash.status_code != 200:
                print(f"Response: {hist_response_slash.text}")
        else:
            print(f"Login failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
