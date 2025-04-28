"""
Test script for SQLite Parser API
This script sends various test queries to our backend to test validation, analysis, and optimization.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_validation():
    print("\n=== Testing Validation ===")
    
    # Valid query
    valid_query = "SELECT id, name FROM users WHERE age > 18 ORDER BY name LIMIT 10"
    response = requests.post(f"{BASE_URL}/validate", json={"query": valid_query})
    result = response.json()
    print(f"Valid Query Test: {'✓' if result['is_valid'] else '✗'}")
    
    # Invalid query (syntax error)
    invalid_query = "SELECT FROM users WHERE"
    response = requests.post(f"{BASE_URL}/validate", json={"query": invalid_query})
    result = response.json()
    print(f"Invalid Query Test: {'✓' if not result['is_valid'] else '✗'}")
    if not result['is_valid']:
        print(f"  Error: {result['errors'][0]}")

def test_analysis():
    print("\n=== Testing Analysis ===")
    
    # Complex query for analysis
    complex_query = """
    SELECT u.id, u.name, COUNT(o.id) AS order_count 
    FROM users u 
    LEFT JOIN orders o ON u.id = o.user_id 
    WHERE u.active = 1 
    GROUP BY u.id, u.name 
    HAVING COUNT(o.id) > 0 
    ORDER BY order_count DESC 
    LIMIT 5
    """
    
    response = requests.post(f"{BASE_URL}/analyze", json={"query": complex_query})
    result = response.json()
    print(f"Query Type: {result['query_type']}")
    print(f"Tables: {', '.join(result['tables'])}")
    print(f"Columns: {len(result['columns'])}")
    if result['where_clauses']:
        print(f"WHERE Clauses: {', '.join(result['where_clauses'])}")
    if result['joins']:
        print(f"JOINs: {len(result['joins'])}")
    if result['order_by']:
        print(f"ORDER BY: {', '.join(result['order_by'])}")
    if result['group_by']:
        print(f"GROUP BY: {', '.join(result['group_by'])}")
    if result['limit']:
        print(f"LIMIT: {result['limit']}")

def test_optimization():
    print("\n=== Testing Optimization ===")
    
    # Query with optimization opportunities
    query = "SELECT * FROM large_table WHERE status = 'active'"
    
    response = requests.post(f"{BASE_URL}/optimize", json={"query": query})
    result = response.json()
    print(f"Original Query: {result['original_query']}")
    print(f"Optimized Query: {result['optimized_query']}")
    print("Optimization Notes:")
    for i, note in enumerate(result['optimization_notes'], 1):
        print(f"  {i}. {note}")

def test_process():
    print("\n=== Testing Full Processing ===")
    
    # Test the combined processing endpoint
    query = "SELECT id, name FROM users WHERE age > 18 ORDER BY name LIMIT 10"
    
    response = requests.post(f"{BASE_URL}/process", json={"query": query})
    result = response.json()
    
    print(f"Validation: {'✓' if result['validation']['is_valid'] else '✗'}")
    if result['analysis']:
        print(f"Analysis: ✓ (Query Type: {result['analysis']['query_type']})")
    if result['optimization']:
        print(f"Optimization: ✓ ({len(result['optimization']['optimization_notes'])} notes)")

if __name__ == "__main__":
    print("SQLite Parser API Test")
    print("======================")
    
    try:
        test_validation()
        test_analysis()
        test_optimization()
        test_process()
        
        print("\nAll tests completed successfully!")
    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to the backend server.")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"\nError during testing: {str(e)}") 