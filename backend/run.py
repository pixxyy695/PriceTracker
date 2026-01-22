from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import re
import threading

app = Flask(__name__)
CORS(app)

headers = {
    'Authorization': 'YOUR_MOBILRUN_API_KEY_HERE',
    'Content-Type': 'application/json',
}

PLATFORM_APPS = {
    'amazon': 'com.amazon.mShop.android.shopping',
    'flipkart': 'com.flipkart.android',
    'myntra': 'com.myntra.android',
}

platforms = ['amazon', 'flipkart', 'myntra']

def extract_price(price_str):
    """Extract numeric price from string with currency symbols"""
    if price_str == 'N/A':
        return 'N/A'
    
    # Remove all non-numeric characters except decimal point and comma
    cleaned = re.sub(r'[^\d.,]', '', str(price_str))
    # Remove commas
    cleaned = cleaned.replace(',', '')
    
    try:
        return float(cleaned)
    except ValueError:
        return 'N/A'

def run_and_poll_task(product, platform, max_attempts=60):
    """Run a task and poll until completion, then return the price"""
    
    json_data = {
        'llmModel': 'google/gemini-2.5-flash',
        'task': f'Open the {platform} app, search for {product}, and extract the price of the first product',
        'apps': [PLATFORM_APPS[platform]],
        'deviceId': 'YOUR_DEVICE_ID_HERE',
        'executionTimeout': 1800,
        'maxSteps': 150,
        'outputSchema': {
            'type': 'object',
            'properties': {
                'price': {'type': 'string'}
            }
        },
        'reasoning': True,
        'temperature': 0.5,
        'vision': True,
    }

    try:
        print(f"[{platform.upper()}] Posting task to MobileRun API...")
        response = requests.post('https://api.mobilerun.ai/v1/tasks/', headers=headers, json=json_data, timeout=30)
        
        print(f"[{platform.upper()}] POST Response Status: {response.status_code}")
        
        if response.status_code == 412:
            print(f"[{platform.upper()}] ✗ Device unavailable (412) - device may be busy")
            print(f"[{platform.upper()}] Response: {response.text[:300]}")
            time.sleep(10)  # Wait before retrying
            return 'N/A'
        
        if response.status_code != 200:
            print(f"[{platform.upper()}] ✗ POST failed with status {response.status_code}")
            print(f"[{platform.upper()}] Response: {response.text[:500]}")
            return 'N/A'
        
        data = response.json()
        task_id = data.get('id')
        
        if not task_id:
            print(f"[{platform.upper()}] ✗ Failed to get task ID from response: {data}")
            return 'N/A'
        
        print(f"[{platform.upper()}] ✓ Task ID: {task_id}")

        # Poll for task completion
        for attempt in range(max_attempts):
            time.sleep(5)
            
            try:
                print(f"[{platform.upper()}] Polling attempt {attempt+1}/{max_attempts}...")
                poll_response = requests.get(
                    f'https://api.mobilerun.ai/v1/tasks/{task_id}',
                    headers={'Authorization': headers['Authorization']},
                    timeout=30
                )

                poll_data = poll_response.json()
                print(f"[{platform.upper()}] Poll response: {str(poll_data)[:200]}")
                
                # Check for task status
                if 'task' in poll_data:
                    status = poll_data['task'].get('status', 'unknown')
                    print(f"[{platform.upper()}] Status: {status}")
                    
                    if status == "completed":
                        output = poll_data['task'].get('output', {})
                        price = output.get('price', 'N/A') if isinstance(output, dict) else 'N/A'
                        print(f"[{platform.upper()}] ✓ COMPLETED - Price: {price}")
                        return price
                    
                    elif status == "failed":
                        print(f"[{platform.upper()}] ✗ Task failed")
                        return 'N/A'
                
                # Check for items in response (alternate structure)
                if 'items' in poll_data and len(poll_data['items']) > 0:
                    item = poll_data['items'][0]
                    if item.get('status') == 'completed':
                        output = item.get('output', {})
                        price = output.get('price', 'N/A') if isinstance(output, dict) else 'N/A'
                        print(f"[{platform.upper()}] ✓ COMPLETED - Price: {price}")
                        return price
                        
            except Exception as poll_err:
                print(f"[{platform.upper()}] Poll error: {str(poll_err)}")
                continue

        print(f"[{platform.upper()}] ✗ Task timeout after {max_attempts * 5} seconds ({max_attempts} attempts)")
        return 'N/A'
    
    except Exception as e:
        print(f"[{platform.upper()}] ✗ Error: {str(e)}")
        return 'N/A'

# REST API Endpoints

@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'Price Comparison API', 'status': 'running'})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/test-mobilerun', methods=['GET'])
def test_mobilerun():
    """Test MobileRun API connectivity"""
    print("\n" + "="*60)
    print("[TEST] Testing MobileRun API Connectivity")
    print("="*60)
    
    print(f"[TEST] API Key (first 30 chars): {headers['Authorization'][:30]}...")
    print(f"[TEST] API Endpoint: https://api.mobilerun.ai/v1/tasks/")
    
    # Try a simple GET request to check if API is reachable
    try:
        print("[TEST] Attempting simple GET request...")
        test_response = requests.get('https://api.mobilerun.ai/v1/tasks/', headers=headers, timeout=10)
        print(f"[TEST] GET Response Status: {test_response.status_code}")
        print(f"[TEST] GET Response: {test_response.text[:500]}")
        
        return jsonify({
            'status': 'api_reachable',
            'status_code': test_response.status_code,
            'response_preview': test_response.text[:200]
        })
    except Exception as e:
        print(f"[TEST] ✗ Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/test-post-task', methods=['GET', 'POST'])
def test_post_task():
    """Test posting a task to MobileRun API"""
    print("\n" + "="*60)
    print("[TEST] Testing POST Task to MobileRun API")
    print("="*60)
    
    json_data = {
        'llmModel': 'google/gemini-2.5-flash',
        'task': 'Open the amazon app and search for "boat headphones"',
        'apps': ['com.amazon.mShop.android.shopping'],
        'deviceId': 'e02f83f1-9923-43ae-b428-ce35704fed4b',
        'executionTimeout': 1800,
        'maxSteps': 150,
        'outputSchema': {
            'type': 'object',
            'properties': {
                'price': {'type': 'string'}
            }
        },
        'reasoning': True,
        'temperature': 0.5,
        'vision': True,
    }
    
    try:
        print("[TEST] Posting task with payload:")
        print(json_data)
        response = requests.post('https://api.mobilerun.ai/v1/tasks/', headers=headers, json=json_data, timeout=30)
        print(f"[TEST] POST Response Status: {response.status_code}")
        print(f"[TEST] POST Response: {response.text[:500]}")
        
        return jsonify({
            'status': 'task_posted',
            'status_code': response.status_code,
            'full_response': response.json() if response.status_code == 200 else response.text[:500]
        })
    except Exception as e:
        print(f"[TEST] ✗ Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/test', methods=['POST'])
def test():
    """Test endpoint - returns mock data for testing"""
    try:
        data = request.json
        product_name = data.get('product_name', 'test product')
        
        return jsonify({
            'product_name': product_name,
            'prices': {
                'amazon': '₹15,999',
                'flipkart': '₹16,499',
                'myntra': '₹17,999'
            },
            'valid_prices': {
                'amazon': 15999,
                'flipkart': 16499,
                'myntra': 17999
            },
            'lowest': {
                'platform': 'amazon',
                'price': 15999
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    """Search for product prices across all platforms using MobileRun"""
    try:
        data = request.json
        product_name = data.get('product_name')
        
        if not product_name:
            return jsonify({'error': 'Product name required'}), 400
        
        print(f"\n{'='*60}")
        print(f"[API] NEW SEARCH REQUEST")
        print(f"[API] Product: {product_name}")
        print(f"{'='*60}\n")
        
        prices = {}
        
        # Run tasks sequentially for each platform
        for platform in platforms:
            print(f"[{platform.upper()}] ====== STARTING ======")
            try:
                price = run_and_poll_task(product_name, platform)
                prices[platform] = price
                print(f"[{platform.upper()}] RESULT: {price}\n")
            except Exception as e:
                print(f"[{platform.upper()}] EXCEPTION: {str(e)}\n")
                prices[platform] = 'N/A'
        
        # Find lowest price
        valid_prices = {}
        for platform, price in prices.items():
            extracted = extract_price(price)
            if extracted != 'N/A':
                valid_prices[platform] = extracted
        
        lowest_platform = None
        lowest_price = None
        if valid_prices:
            lowest_platform = min(valid_prices, key=valid_prices.get)
            lowest_price = valid_prices[lowest_platform]
        
        print(f"{'='*60}")
        print(f"[API] SEARCH COMPLETE")
        print(f"[API] All Prices: {prices}")
        print(f"[API] Lowest: {lowest_platform} - {lowest_price}")
        print(f"{'='*60}\n")
        
        return jsonify({
            'product_name': product_name,
            'prices': prices,
            'valid_prices': valid_prices,
            'lowest': {
                'platform': lowest_platform,
                'price': lowest_price
            } if lowest_platform else None
        })
    
    except Exception as e:
        print(f"[ERROR] SEARCH ENDPOINT FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Price Comparison API Server...")
    app.run(debug=True, port=5000)