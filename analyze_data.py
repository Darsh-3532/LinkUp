import pandas as pd
import json
import os

os.chdir(r'c:\PROJECT SNA')

# Load datasets
investments = pd.read_csv('A kaggle dataset/investments.csv')
people = pd.read_csv('A kaggle dataset/people.csv')
funding_rounds = pd.read_csv('A kaggle dataset/funding_rounds.csv')

print("Investments shape:", investments.shape)
print("Investments columns:", investments.columns.tolist())
print("\nPeople shape:", people.shape)
print("People columns:", people.columns.tolist())
print("\nFunding Rounds columns:", funding_rounds.columns.tolist())
print("\nFunding Rounds sample:")
print(funding_rounds.head(3))

# Sample 400 investments
sample_400 = investments.sample(n=400, random_state=42)
print("\n400 Sample investments:")
print(sample_400.head())

# Get unique company and investor IDs
companies = sample_400['funded_object_id'].unique()
investors = sample_400['investor_object_id'].unique()

print(f"\nTotal companies: {len(companies)}")
print(f"Total investors: {len(investors)}")

# Get funding round details
fr_merged = funding_rounds[funding_rounds['id'].isin(sample_400['funding_round_id'].unique())]
print(f"\nFunding rounds in sample: {len(fr_merged)}")
print("\nFunding round types:")
print(fr_merged['funding_round_type'].value_counts())
