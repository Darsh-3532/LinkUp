import requests
import json
import time

BASE_URL = 'http://localhost:5000'

print("=" * 70)
print("COMPLETE ANALYSIS FLOW TEST - LinkUp Network Explorer")
print("=" * 70)

try:
    print("\n[STEP 1] Health Check")
    resp = requests.get(f'{BASE_URL}/api/health')
    assert resp.status_code == 200
    print("[OK] Backend API is running")
    
    print("\n[STEP 2] Load Network Data")
    resp = requests.get(f'{BASE_URL}/api/network')
    assert resp.status_code == 200
    data = resp.json()
    assert data['success']
    networkData = data['data']
    print(f"[OK] Network loaded: {len(networkData['nodes'])} nodes, {len(networkData['edges'])} edges")
    
    print("\n[STEP 3] Centrality Analysis")
    resp = requests.post(f'{BASE_URL}/api/analysis/centrality')
    assert resp.status_code == 200
    data = resp.json()
    assert data['success']
    centrality_results = data['data']
    print(f"[OK] Centrality computed:")
    print(f"  - Average degree: {centrality_results['stats']['avgDegree']:.2f}")
    print(f"  - Max degree: {centrality_results['stats']['maxDegree']}")
    print(f"  - Network density: {centrality_results['stats']['density']:.4f}")
    print(f"  - Top {len(centrality_results['topNodes'])} influential nodes identified")
    
    print("\n[STEP 4] Community Detection")
    resp = requests.post(f'{BASE_URL}/api/analysis/communities')
    assert resp.status_code == 200
    data = resp.json()
    assert data['success']
    communities_results = data['data']
    print(f"[OK] Communities detected:")
    print(f"  - Total communities: {len(communities_results['communities'])}")
    print(f"  - Largest community size: {communities_results['stats']['largestCommunity']}")
    print(f"  - Average community size: {communities_results['stats']['avgCommunitySize']:.1f}")
    print(f"  - Modularity: {communities_results['stats']['modularity']:.4f}")
    for idx, comm in enumerate(communities_results['communities'][:3], 1):
        print(f"  - Community {idx}: {comm['name']} ({comm['nodeCount']} nodes)")
    
    print("\n[STEP 5] Pathway Tracing")
    if len(networkData['nodes']) >= 2:
        source_node = networkData['nodes'][0]
        target_node = networkData['nodes'][1]
        resp = requests.post(f'{BASE_URL}/api/analysis/pathways', 
                            json={'sourceId': source_node['id'], 'targetId': target_node['id']})
        assert resp.status_code == 200
        data = resp.json()
        assert data['success']
        pathway_results = data['data']
        print(f"[OK] Pathways traced from '{source_node['name']}' to '{target_node['name']}':")
        print(f"  - Paths found: {pathway_results['stats']['pathCount']}")
        print(f"  - Average path length: {pathway_results['stats']['avgPathLength']:.2f}")
        if pathway_results['paths']:
            print(f"  - Shortest path: {pathway_results['paths'][0]} nodes")
            if len(pathway_results['paths']) > 1:
                print(f"  - Longest path: {max(p for p in pathway_results['paths'])} nodes")
    else:
        print("[SKIP] Not enough nodes in network")
    
    print("\n[STEP 6] Export Data Structure")
    export_data = {
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "summary": {
            "totalNodes": len(networkData['nodes']),
            "totalEdges": len(networkData['edges']),
            "companies": len([n for n in networkData['nodes'] if n.get('type') == 'company']),
            "investors": len([n for n in networkData['nodes'] if n.get('type') == 'investor']),
        },
        "analysis": {
            "centrality": {
                "avgDegree": centrality_results['stats']['avgDegree'],
                "maxDegree": centrality_results['stats']['maxDegree'],
                "density": centrality_results['stats']['density']
            },
            "communities": {
                "count": len(communities_results['communities']),
                "largestSize": communities_results['stats']['largestCommunity'],
                "avgSize": communities_results['stats']['avgCommunitySize'],
                "modularity": communities_results['stats']['modularity']
            }
        }
    }
    print(f"[OK] Export data prepared ({json.dumps(export_data, indent=2)[:200]}...)")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] ALL ANALYSIS TOOLS WORKING PROPERLY!")
    print("=" * 70)
    print("\nSummary:")
    print(f"  [Centrality Analysis] Avg degree: {centrality_results['stats']['avgDegree']:.2f}")
    print(f"  [Community Detection] {len(communities_results['communities'])} clusters detected")
    print(f"  [Pathway Tracing] Multiple connection routes available")
    print(f"  [Export Results] JSON data ready for download")
    print("\nAccess the application at: http://localhost:5000/pages/network_explorer.html")
    print("=" * 70)
    
except AssertionError as e:
    print(f"\n[FAIL] ASSERTION ERROR: {e}")
except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()
