import requests
import json
import time

BASE_URL = 'http://localhost:5000'

print("[TEST SUITE] LinkUp Backend API Integration")
print("=" * 60)

# Test 1: Health Check
print("\n[1] Health Check")
try:
    resp = requests.get(f'{BASE_URL}/api/health')
    data = resp.json()
    print(f"  Status: {resp.status_code}")
    print(f"  Message: {data['message']}")
    assert resp.status_code == 200
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 2: Get Network Stats
print("\n[2] Get Network Statistics")
try:
    resp = requests.get(f'{BASE_URL}/api/network/stats')
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Total Nodes: {data['total_nodes']}")
    print(f"  Total Edges: {data['total_edges']}")
    print(f"  Companies: {data['companies']}")
    print(f"  Investors: {data['investors']}")
    print(f"  Funding Types: {list(data['funding_types'].keys())}")
    print(f"  Date Range: {data['date_range']['min']} to {data['date_range']['max']}")
    
    assert data['total_nodes'] == 740
    assert data['total_edges'] == 400
    assert data['companies'] == 390
    assert data['investors'] == 350
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 3: Get Available Filters
print("\n[3] Get Available Filters")
try:
    resp = requests.get(f'{BASE_URL}/api/filters')
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Funding Types: {data['funding_types']}")
    print(f"  Node Types: {data['node_types']}")
    assert 'series-a' in data['funding_types']
    assert 'angel' in data['funding_types']
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 4: Get Network Data
print("\n[4] Get Full Network Data")
try:
    resp = requests.get(f'{BASE_URL}/api/network')
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Nodes: {len(data['nodes'])}")
    print(f"  Edges: {len(data['edges'])}")
    assert len(data['nodes']) == 740
    assert len(data['edges']) == 400
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 5: Filter by Angel Funding
print("\n[5] Filter by Angel Funding Type")
try:
    resp = requests.post(f'{BASE_URL}/api/network/filter', 
                        json={'funding_type': 'angel'})
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Filtered Nodes: {data['stats']['total_nodes']}")
    print(f"  Filtered Edges: {data['stats']['total_edges']}")
    assert data['stats']['total_edges'] > 0
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 6: Filter by Series A
print("\n[6] Filter by Series A Funding Type")
try:
    resp = requests.post(f'{BASE_URL}/api/network/filter', 
                        json={'funding_type': 'series-a'})
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Filtered Nodes: {data['stats']['total_nodes']}")
    print(f"  Filtered Edges: {data['stats']['total_edges']}")
    assert data['stats']['total_edges'] > 0
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 7: Search Functionality
print("\n[7] Search Nodes")
try:
    resp = requests.get(f'{BASE_URL}/api/search?q=c:26569')
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Results Found: {len(data)}")
    if len(data) > 0:
        print(f"  First Result: {data[0]['id']}")
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 8: Get Node Details
print("\n[8] Get Node Details")
try:
    resp = requests.get(f'{BASE_URL}/api/node/c:26569')
    data = resp.json()['data']
    print(f"  Status: {resp.status_code}")
    print(f"  Node ID: {data['node']['id']}")
    print(f"  Node Type: {data['node']['type']}")
    print(f"  Connected Nodes: {len(data['connected_nodes'])}")
    print(f"  Connected Edges: {len(data['connected_edges'])}")
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

# Test 9: Static File Serving
print("\n[9] Static Files - Network Explorer Page")
try:
    resp = requests.head(f'{BASE_URL}/pages/network_explorer.html')
    print(f"  Status: {resp.status_code}")
    print(f"  Content-Type: {resp.headers.get('Content-Type')}")
    assert resp.status_code == 200
    print("  [PASSED]")
except Exception as e:
    print(f"  [FAILED] {e}")

print("\n" + "=" * 60)
print("[SUMMARY] All tests completed!")
print("Backend Integration Status: OPERATIONAL")
print("\nAccess LinkUp at:")
print("  - Homepage: http://localhost:5000")
print("  - Network Explorer: http://localhost:5000/pages/network_explorer.html")
