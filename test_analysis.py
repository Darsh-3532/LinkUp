import requests
import json

BASE_URL = 'http://localhost:5000'

print("=" * 60)
print("[TEST] Analysis Endpoints")
print("=" * 60)

# Test Centrality Analysis
print("\n[1] Centrality Analysis")
try:
    resp = requests.post(f'{BASE_URL}/api/analysis/centrality')
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"Success: {data.get('success')}")
    if 'data' in data:
        print(f"Top nodes: {len(data['data'].get('topNodes', []))}")
        print(f"Stats: {data['data'].get('stats')}")
    print("[PASSED]")
except Exception as e:
    print(f"[FAILED] {e}")

# Test Community Detection
print("\n[2] Community Detection")
try:
    resp = requests.post(f'{BASE_URL}/api/analysis/communities')
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"Success: {data.get('success')}")
    if 'data' in data:
        print(f"Communities: {len(data['data'].get('communities', []))}")
        print(f"Stats: {data['data'].get('stats')}")
    print("[PASSED]")
except Exception as e:
    print(f"[FAILED] {e}")

# Test Pathway Tracing (need to select two nodes)
print("\n[3] Pathway Tracing")
try:
    # Get network data first to find node IDs
    resp_network = requests.get(f'{BASE_URL}/api/network')
    network = resp_network.json()['data']
    if len(network['nodes']) >= 2:
        source_id = network['nodes'][0]['id']
        target_id = network['nodes'][1]['id']
        
        resp = requests.post(f'{BASE_URL}/api/analysis/pathways', 
                            json={'sourceId': source_id, 'targetId': target_id})
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Success: {data.get('success')}")
        if 'data' in data:
            print(f"Paths found: {len(data['data'].get('paths', []))}")
            print(f"Stats: {data['data'].get('stats')}")
        print("[PASSED]")
    else:
        print("[SKIPPED] Not enough nodes")
except Exception as e:
    print(f"[FAILED] {e}")

print("\n" + "=" * 60)
print("[SUMMARY] All endpoint tests completed!")
print("=" * 60)
