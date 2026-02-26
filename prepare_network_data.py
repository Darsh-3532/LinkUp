import pandas as pd
import json
import random
import os

base_path = r'c:\PROJECT SNA'

# Load datasets
print("Loading Kaggle datasets...")
investments = pd.read_csv(os.path.join(base_path, 'A kaggle dataset', 'investments.csv'))
objects = pd.read_csv(os.path.join(base_path, 'A kaggle dataset', 'objects.csv'))
funding_rounds = pd.read_csv(os.path.join(base_path, 'A kaggle dataset', 'funding_rounds.csv'))

print(f'Total investments: {len(investments)}')

# Sample enough investments to get approximately 500 nodes
# Since each investment involves 2 nodes (investor + company), we need ~250 investments for ~500 nodes
target_sample_size = min(800, len(investments))  # Sample more to account for duplicates
sample = investments.sample(n=target_sample_size, random_state=42)
print(f'Sampled: {len(sample)} investments')

# Get unique companies and investors
companies = sample['funded_object_id'].unique()
investors = sample['investor_object_id'].unique()

print(f'Unique companies: {len(companies)}')
print(f'Unique investors: {len(investors)}')
print(f'Total unique nodes: {len(companies) + len(investors)}')

# Create company name mapping from objects.csv
company_names = {}
for _, obj in objects.iterrows():
    if pd.notna(obj.get('name')) and pd.notna(obj.get('id')):
        company_names[str(obj['id'])] = str(obj['name'])

# Create nodes with enhanced metadata
nodes = []
edges = []

print("\nCreating nodes and edges...")

for _, row in sample.iterrows():
    company_id = str(row['funded_object_id'])
    investor_id = str(row['investor_object_id'])

    # Add company node if not exists
    if not any(n['id'] == company_id for n in nodes):
        company_name = company_names.get(company_id, f"Company {company_id}")
        nodes.append({
            'id': company_id,
            'label': company_name,
            'name': company_name,
            'type': 'company',
            'category': 'startup'
        })

    # Add investor node if not exists
    if not any(n['id'] == investor_id for n in nodes):
        investor_name = company_names.get(investor_id, f"Investor {investor_id}")
        investor_type = 'vc' if 'fund' in investor_name.lower() or 'capital' in investor_name.lower() else 'investor'
        nodes.append({
            'id': investor_id,
            'label': investor_name,
            'name': investor_name,
            'type': 'investor',
            'investor_type': investor_type
        })

    # Add edge with investment details
    edges.append({
        'source': investor_id,
        'target': company_id,
        'funding_round_type': str(row.get('funding_round_type', 'unknown')),
        'raised_amount': float(row.get('raised_amount', 0)),
        'funded_at': str(row.get('funded_at', 'unknown'))
    })

# Limit to exactly 500 nodes if we have more
if len(nodes) > 500:
    # Keep the most connected nodes
    node_degrees = {}
    for edge in edges:
        node_degrees[edge['source']] = node_degrees.get(edge['source'], 0) + 1
        node_degrees[edge['target']] = node_degrees.get(edge['target'], 0) + 1

    # Sort nodes by degree (connections) and keep top 500
    sorted_nodes = sorted(nodes, key=lambda n: node_degrees.get(n['id'], 0), reverse=True)
    top_500_nodes = sorted_nodes[:500]
    top_500_node_ids = set(n['id'] for n in top_500_nodes)

    # Filter edges to only include connections between top 500 nodes
    filtered_edges = [e for e in edges if e['source'] in top_500_node_ids and e['target'] in top_500_node_ids]

    nodes = top_500_nodes
    edges = filtered_edges

print(f'\nFinal network: {len(nodes)} nodes, {len(edges)} edges')

# Create network data structure
network_data = {
    'nodes': nodes,
    'edges': edges,
    'metadata': {
        'total_sampled_investments': len(sample),
        'unique_companies': len([n for n in nodes if n['type'] == 'company']),
        'unique_investors': len([n for n in nodes if n['type'] == 'investor']),
        'dataset_source': 'kaggle_crunchbase'
    }
}

# Save files
with open(os.path.join(base_path, 'network_data.json'), 'w') as f:
    json.dump(network_data, f, indent=2)

sample.to_csv(os.path.join(base_path, 'network_data_sample.csv'), index=False)

print(f'\nCreated network with {len(nodes)} nodes and {len(edges)} edges')
print('Files saved: network_data.json, network_data_sample.csv')
print('Network ready for visualization with filtering capabilities!')
