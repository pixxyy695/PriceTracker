from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import re
import threading

app = Flask(__name__)
CORS(app)

# API Configuration
API_KEY = 'YOUR_MOBILERUN_API_KEY_HERE'
MOBILE_RUN_API = 'https://api.mobilerun.ai/v1/tasks'

PLATFORM_APPS = {
    'amazon': 'com.amazon.mShop.android.shopping',
    'flipkart': 'com.flipkart.android',
    'myntra': 'com.myntra.android',
}

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}

def extract_price(price_str):
    """Extract numeric price from string with currency symbols"""
    if price_str == 'N/A' or not price_str:
        return 'N/A'
    
    cleaned = re.sub(r'[^\d.,]', '', str(price_str))
    cleaned = cleaned.replace(',', '')
    
    try:
        return float(cleaned)
    except ValueError:
        return 'N/A'

@app.before_request
def log_request():
    """Log all incoming requests"""
    print(f"\n{'='*60}")
    print(f"REQUEST: {request.method} {request.path}")
    print(f"Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"Body: {request.get_json()}")
    print(f"{'='*60}\n")

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    print("ROOT endpoint called")
    return jsonify({'message': 'Price Comparison API Backend', 'status': 'running'})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/test', methods=['POST'])
def test():
    """Test endpoint - doesn't depend on MobileRun"""
    data = request.json
    product = data.get('product_name', 'Unknown')
    print(f"TEST endpoint received: {product}")
    return jsonify({
        'product_name': product,
        'message': 'Test successful - backend is working!',
        'tasks': {
            'amazon': {'task_id': 'test_123', 'status': 'test'},
            'flipkart': {'task_id': 'test_456', 'status': 'test'},
            'myntra': {'task_id': 'test_789', 'status': 'test'}
        }
    })

@app.route('/api/search', methods=['POST'])
def search():
    """Start price search for a product"""
    try:
        data = request.json
        product_name = data.get('product_name')
        
        if not product_name:
            return jsonify({'error': 'Product name required'}), 400
        
        print(f"\n========== SEARCH REQUEST ==========")
        print(f"Product: {product_name}")
        print(f"API Key: {API_KEY[:20]}...")
        
        tasks = {}
        
        for platform in PLATFORM_APPS.keys():
            try:
                print(f"\n[{platform.upper()}] Starting task...")
                task_data = {
                    'llmModel': 'google/gemini-2.5-flash',
                    'task': f'Open the {platform} app, search for {product_name}, and extract the price of the first product',
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
                
                response = requests.post(MOBILE_RUN_API, json=task_data, headers=headers, timeout=10)
                
                print(f"[{platform.upper()}] Response Status: {response.status_code}")
                print(f"[{platform.upper()}] Response: {response.text[:500]}")
                
                if response.status_code == 200:
                    task_id = response.json().get('id')
                    tasks[platform] = {
                        'task_id': task_id,
                        'status': 'queued'
                    }
                    print(f"[{platform.upper()}] ✓ Task started: {task_id}")
                else:
                    error_msg = response.text if response.text else f'HTTP {response.status_code}'
                    tasks[platform] = {
                        'error': f'Failed to start task: {error_msg[:100]}'
                    }
                    print(f"[{platform.upper()}] ✗ Failed: {error_msg[:100]}")
            except Exception as e:
                tasks[platform] = {'error': str(e)}
                print(f"[{platform.upper()}] ✗ Exception: {str(e)}")
        
        print(f"========== RESPONSE SENT ==========\n")
        return jsonify({
            'product_name': product_name,
            'tasks': tasks
        })
    
    except Exception as e:
        print(f"ERROR in search endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/task/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of a specific task"""
    try:
        response = requests.get(
            f'{MOBILE_RUN_API}/{task_id}',
            headers={'Authorization': f'Bearer {API_KEY}'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            task = data.get('task', {})
            
            result = {
                'status': task.get('status'),
                'task_id': task_id
            }
            
            if task.get('status') == 'completed':
                output = task.get('output', {})
                price = output.get('price', 'N/A') if isinstance(output, dict) else 'N/A'
                result['price'] = price
            
            elif task.get('status') == 'failed':
                trajectory = task.get('trajectory', [])
                error_msg = 'Task failed'
                for event in trajectory:
                    if event.get('event') == 'ExceptionEvent':
                        error_msg = event.get('data', {}).get('exception', 'Unknown error')
                        break
                result['error'] = error_msg
            
            return jsonify(result)
        else:
            return jsonify({'error': f'Failed to get task status (status {response.status_code})'}), response.status_code
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare', methods=['POST'])
def compare_prices():
    """Compare prices across platforms"""
    try:
        data = request.json
        prices = data.get('prices', {})
        
        valid_prices = {}
        for platform, price in prices.items():
            extracted = extract_price(price)
            if extracted != 'N/A':
                valid_prices[platform] = extracted
        
        result = {
            'all_prices': prices,
            'valid_prices': valid_prices,
            'lowest': None
        }
        
        if valid_prices:
            lowest_platform = min(valid_prices, key=valid_prices.get)
            result['lowest'] = {
                'platform': lowest_platform,
                'price': valid_prices[lowest_platform]
            }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
