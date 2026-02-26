import pandas as pd
import json
import os
from datetime import datetime

os.chdir(r'c:\PROJECT SNA')

# Load all datasets
investments = pd.read_csv('A kaggle dataset/investments.csv')
people = pd.read_csv('A kaggle dataset/people.csv')
funding_rounds = pd.read_csv('A kaggle dataset/funding_rounds.csv')

# Sample 400 investments
sample_400 = investments.sample(n=400, random_state=42)

# Get unique IDs
company_ids = sample_400['funded_object_id'].unique()
investor_ids = sample_400['investor_object_id'].unique()
funding_round_ids = sample_400['funding_round_id'].unique()

# Filter data for our sample
fr_sample = funding_rounds[funding_rounds['funding_round_id'].isin(funding_round_ids)].copy()
people_sample = people.copy()

# Convert dates
fr_sample['funded_at'] = pd.to_datetime(fr_sample['funded_at'], errors='coerce')
sample_400['created_at'] = pd.to_datetime(sample_400['created_at'], errors='coerce')

# Extract funding round info
fr_info = {}
for _, row in fr_sample.iterrows():
    fr_id = row['funding_round_id']
    if pd.isna(fr_id):
        continue
    fr_id = str(int(fr_id))
    fr_info[fr_id] = {
        'type': row['funding_round_type'],
        'raised_amount': float(row['raised_amount_usd']) if pd.notna(row['raised_amount_usd']) else None,
        'date': row['funded_at'].strftime('%Y-%m-%d') if pd.notna(row['funded_at']) else None,
        'pre_money_valuation': float(row['pre_money_valuation_usd']) if pd.notna(row['pre_money_valuation_usd']) else None,
        'post_money_valuation': float(row['post_money_valuation_usd']) if pd.notna(row['post_money_valuation_usd']) else None,
    }

# Create nodes
nodes = []
node_map = {}

# Company nodes
for cid in company_ids:
    node_id = str(cid)
    node_map[node_id] = len(nodes)
    nodes.append({
        'id': node_id,
        'label': node_id,
        'type': 'company',
        'name': f'Company {node_id}'
    })

# Investor nodes
for inv_id in investor_ids:
    node_id = str(inv_id)
    node_map[node_id] = len(nodes)
    nodes.append({
        'id': node_id,
        'label': node_id,
        'type': 'investor',
        'name': f'Investor {node_id}'
    })

# Create edges with metadata
edges = []
edge_data = {}

for _, inv in sample_400.iterrows():
    src = str(inv['investor_object_id'])
    tgt = str(inv['funded_object_id'])
    fr_id = str(int(inv['funding_round_id'])) if pd.notna(inv['funding_round_id']) else None
    
    fr_details = fr_info.get(fr_id, {})
    
    edge_key = f"{src}-{tgt}"
    edge_data[edge_key] = {
        'funding_round_type': fr_details.get('type', 'unknown'),
        'raised_amount': fr_details.get('raised_amount'),
        'date': fr_details.get('date'),
        'post_money_valuation': fr_details.get('post_money_valuation')
    }
    
    edges.append({
        'source': src,
        'target': tgt,
        'id': edge_key
    })

# Calculate statistics
funding_types = {}
for edge_id, data in edge_data.items():
    ftype = data['funding_round_type']
    if ftype not in funding_types:
        funding_types[ftype] = 0
    funding_types[ftype] += 1

# Get date range
dates = [d for d in [e.get('date') for e in edge_data.values()] if d]
min_date = min(dates) if dates else None
max_date = max(dates) if dates else None

# Build complete network data
network_data = {
    'nodes': nodes,
    'edges': edges,
    'metadata': {
        'total_nodes': len(nodes),
        'total_edges': len(edges),
        'companies': len(company_ids),
        'investors': len(investor_ids),
        'funding_types': funding_types,
        'date_range': {
            'min': min_date,
            'max': max_date
        }
    },
    'edge_details': edge_data
}

# Save network data
with open('network_data.json', 'w') as f:
    json.dump(network_data, f, indent=2)

# Create API response data
api_data = {
    'nodes': nodes,
    'edges': edges,
    'stats': {
        'total_nodes': len(nodes),
        'total_edges': len(edges),
        'companies': len(company_ids),
        'investors': len(investor_ids),
        'funding_types': list(funding_types.keys()),
        'funding_distribution': funding_types
    },
    'filters': {
        'funding_types': sorted(list(set([e.get('funding_round_type', 'unknown') for e in edge_data.values()]))),
        'date_range': {
            'min': min_date,
            'max': max_date
        }
    }
}

with open('api_network_data.json', 'w') as f:
    json.dump(api_data, f, indent=2)

print("[OK] Backend data prepared successfully")
print(f"  - Nodes: {len(nodes)}")
print(f"  - Edges: {len(edges)}")
print(f"  - Companies: {len(company_ids)}")
print(f"  - Investors: {len(investor_ids)}")
print(f"  - Funding Types: {list(funding_types.keys())}")
print(f"  - Date Range: {min_date} to {max_date}")
