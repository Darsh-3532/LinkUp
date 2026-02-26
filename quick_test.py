import requests
import json

try:
    response = requests.get('http://localhost:5000/api/network', timeout=5)
    print("Status:", response.status_code)
    data = response.json()
    print("Success:", data.get('success'))
    print("Nodes:", len(data['data']['nodes']))
    print("Edges:", len(data['data']['edges']))
    print("Network data is working!")
except Exception as e:
    print("Error:", str(e))
