export default function PriceResults({ productName, prices, taskStatuses, isDark }) {
  const extractPrice = (priceStr) => {
    if (priceStr === 'N/A') return 'N/A'
    const cleaned = priceStr.toString().replace(/[^\d.,]/g, '').replace(/,/g, '')
    try {
      return parseFloat(cleaned)
    } catch {
      return 'N/A'
    }
  }

  const colors = {
    light: {
      card: '#ffffff',
      text: '#1f2937',
      accent: '#4f46e5',
      border: '#e5e7eb',
      shadow: 'rgba(0,0,0,0.1)'
    },
    dark: {
      card: '#1f2937',
      text: '#f3f4f6',
      accent: '#6366f1',
      border: '#374151',
      shadow: 'rgba(0,0,0,0.3)'
    }
  }

  const theme = isDark ? colors.dark : colors.light

  const platformInfo = {
    amazon: { name: 'Amazon', color: 'blue', icon: '🛒' },
    flipkart: { name: 'Flipkart', color: 'yellow', icon: '📦' },
    myntra: { name: 'Myntra', color: 'purple', icon: '👗' }
  }

  // Find lowest price
  const validPrices = {}
  Object.entries(prices).forEach(([platform, price]) => {
    const extracted = extractPrice(price)
    if (extracted !== 'N/A') {
      validPrices[platform] = extracted
    }
  })

  const lowestPlatform = Object.keys(validPrices).length > 0
    ? Object.entries(validPrices).reduce((a, b) => a[1] < b[1] ? a : b)[0]
    : null
  const lowestPrice = lowestPlatform ? validPrices[lowestPlatform] : null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Product Info */}
      <div style={{ background: theme.card, borderRadius: '0.5rem', boxShadow: `0 10px 25px ${theme.shadow}`, padding: '1.5rem', marginBottom: '2rem', border: `1px solid ${theme.border}` }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.text }}>
          Search Results for: <span style={{ color: theme.accent }}>"{productName}"</span>
        </h2>
      </div>

      {/* Price Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {Object.entries(platformInfo).map(([platform, info]) => (
          <PriceCard
            key={platform}
            platform={platform}
            info={info}
            price={prices[platform]}
            status={taskStatuses[platform]?.status}
            isLowest={lowestPlatform === platform}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Best Deal Summary */}
      {lowestPrice !== null && (
        <div style={{ background: isDark ? 'linear-gradient(to right, rgb(74, 222, 128), rgb(16, 185, 129))' : 'linear-gradient(to right, rgb(74, 222, 128), rgb(16, 185, 129))', borderRadius: '0.5rem', boxShadow: `0 10px 25px ${theme.shadow}`, padding: '2rem', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{lowestPrice.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Best Deal Found!</div>
          <div style={{ fontSize: '1.125rem', opacity: 0.9 }}>Available on {platformInfo[lowestPlatform]?.name}</div>
        </div>
      )}

      {lowestPrice === null && Object.values(prices).length > 0 && (
        <div style={{ background: isDark ? '#7c2d12' : '#fffbeb', border: `2px solid ${isDark ? '#ea580c' : '#fbbf24'}`, borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
          <p style={{ color: isDark ? '#fed7aa' : '#1f2937', fontWeight: '600', display: 'inline' }}>Could not determine prices for comparison</p>
        </div>
      )}
    </div>
  )
}

function PriceCard({ platform, info, price, status, isLowest, isDark }) {
  const getStatusIcon = () => {
    if (status === 'completed') return '✓'
    if (status === 'failed' || status === 'timeout') return '✗'
    return '⟳'
  }

  const getStatusColor = () => {
    if (status === 'completed') return '#22c55e'
    if (status === 'failed' || status === 'timeout') return '#ef4444'
    return '#eab308'
  }

  const colors = {
    light: {
      card: '#ffffff',
      text: '#1f2937',
      accent: '#4f46e5',
      shadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    dark: {
      card: '#1f2937',
      text: '#f3f4f6',
      accent: '#6366f1',
      shadow: '0 4px 6px rgba(0,0,0,0.3)'
    }
  }

  const theme = isDark ? colors.dark : colors.light

  const colorBorders = {
    blue: { border: isDark ? '2px solid #1e40af' : '2px solid #dbeafe', hover: isDark ? '2px solid #2563eb' : '2px solid #93c5fd' },
    yellow: { border: isDark ? '2px solid #b45309' : '2px solid #fef3c7', hover: isDark ? '2px solid #d97706' : '2px solid #fde68a' },
    purple: { border: isDark ? '2px solid #6b21a8' : '2px solid #e9d5ff', hover: isDark ? '2px solid #7c3aed' : '2px solid #d8b4fe' }
  }

  return (
    <div 
      style={{
        background: theme.card,
        borderRadius: '0.5rem',
        boxShadow: theme.shadow,
        padding: '1.5rem',
        border: colorBorders[info.color]?.border,
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
        ...(isLowest && { 
          boxShadow: '0 0 0 2px #22c55e, ' + theme.shadow 
        })
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2.5rem' }}>{info.icon}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getStatusColor() }}>{getStatusIcon()}</span>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.text, marginBottom: '1rem' }}>{info.name}</h3>

      <div style={{ marginBottom: '1rem' }}>
        {price && price !== 'N/A' ? (
          <>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: theme.accent, marginBottom: '0.5rem' }}>₹{price}</div>
            {isLowest && (
              <div style={{ display: 'inline-block', background: isDark ? '#064e3b' : '#dcfce7', color: isDark ? '#86efac' : '#166534', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>
                Best Price
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '1.25rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: '600' }}>N/A</div>
        )}
      </div>

      <div style={{ fontSize: '0.875rem', color: isDark ? '#d1d5db' : '#4b5563' }}>
        {status === 'completed' && <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Completed</span>}
        {status === 'running' && <span style={{ color: '#2563eb', fontWeight: '600' }}>⟳ Searching...</span>}
        {status === 'failed' && <span style={{ color: '#dc2626', fontWeight: '600' }}>✗ Failed</span>}
        {status === 'timeout' && <span style={{ color: '#dc2626', fontWeight: '600' }}>✗ Timeout</span>}
      </div>
    </div>
  )
}
