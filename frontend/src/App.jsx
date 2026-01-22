import { useState } from 'react'
import SearchBar from './components/SearchBar'
import PriceResults from './components/PriceResults'
import LoadingSpinner from './components/LoadingSpinner'
import axios from 'axios'

function App() {
  const [productName, setProductName] = useState('')
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [taskStatuses, setTaskStatuses] = useState({})
  const [isDark, setIsDark] = useState(false)

  const platforms = ['amazon', 'flipkart', 'myntra']
  const API_BASE_URL = 'http://localhost:5000'

  const theme = {
    light: {
      bg: 'linear-gradient(135deg, rgb(240, 249, 255) 0%, rgb(224, 231, 255) 100%)',
      text: '#1f2937',
      subtext: '#4b5563',
      card: '#ffffff',
      border: '#e5e7eb',
      headerBg: 'rgba(255, 255, 255, 0.8)'
    },
    dark: {
      bg: 'linear-gradient(135deg, rgb(17, 24, 39) 0%, rgb(31, 41, 55) 100%)',
      text: '#f3f4f6',
      subtext: '#d1d5db',
      card: '#1f2937',
      border: '#374151',
      headerBg: 'rgba(31, 41, 55, 0.8)'
    }
  }

  const currentTheme = isDark ? theme.dark : theme.light

  const handleSearch = async (product) => {
    if (!product.trim()) {
      setError('Please enter a product name')
      return
    }

    setProductName(product)
    setLoading(true)
    setError(null)
    setPrices({})
    setTaskStatuses({})

    try {
      console.log('Searching for:', product)
      console.log('Calling API:', `${API_BASE_URL}/api/search`)
      
      // Call the API
      const response = await axios.post(`${API_BASE_URL}/api/search`, {
        product_name: product
      }, {
        timeout: 350000 // 5 minute 50 second timeout (backend needs up to 5 minutes)
      })

      console.log('Full API Response:', response.data)
      
      const result = response.data
      
      // Handle both 'prices' and 'tasks' response structures
      let priceData = result.prices || result.tasks || {}
      
      // If tasks is an object of task objects, extract prices from them
      if (result.tasks && typeof result.tasks === 'object') {
        priceData = {}
        Object.keys(result.tasks).forEach(platform => {
          const task = result.tasks[platform]
          if (typeof task === 'object' && task.price) {
            priceData[platform] = task.price
          } else if (typeof task === 'string') {
            priceData[platform] = task
          }
        })
      }
      
      console.log('Extracted prices:', priceData)
      setPrices(priceData)
      
      // Set task statuses to completed
      platforms.forEach(p => {
        setTaskStatuses(prev => ({
          ...prev,
          [p]: { status: 'completed' }
        }))
      })
      
      setLoading(false)
      console.log('Search completed successfully')
    } catch (err) {
      console.error('Search error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to search'
      setError(`Error: ${errorMsg} - Backend at ${API_BASE_URL} may not be running`)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: currentTheme.bg, transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header with Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: currentTheme.text, marginBottom: '0.5rem' }}>Price Compare</h1>
            <p style={{ fontSize: '1.125rem', color: currentTheme.subtext }}>Find the best deals across Amazon, Flipkart & Myntra</p>
          </div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              border: `2px solid ${currentTheme.border}`,
              background: currentTheme.card,
              color: currentTheme.text,
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} disabled={loading} isDark={isDark} />

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: isDark ? '#7f1d1d' : '#fee2e2', 
            border: `2px solid ${isDark ? '#dc2626' : '#fca5a5'}`, 
            color: isDark ? '#fca5a5' : '#991b1b', 
            borderRadius: '0.5rem' 
          }}>
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && <LoadingSpinner isDark={isDark} />}

        {/* Results */}
        {!loading && Object.keys(prices).length > 0 && (
          <PriceResults productName={productName} prices={prices} taskStatuses={taskStatuses} isDark={isDark} />
        )}
      </div>
    </div>
  )
}

export default App
