export default function LoadingSpinner({ isDark }) {
  const colors = {
    light: {
      spinnerBg: '#e5e7eb',
      spinnerFg: '#4f46e5',
      card: '#ffffff',
      skeleton: '#e5e7eb',
      text: '#4b5563',
      subtext: '#9ca3af'
    },
    dark: {
      spinnerBg: '#374151',
      spinnerFg: '#6366f1',
      card: '#1f2937',
      skeleton: '#374151',
      text: '#d1d5db',
      subtext: '#6b7280'
    }
  }

  const theme = isDark ? colors.dark : colors.light

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '1.5rem' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '9999px', border: `4px solid ${theme.spinnerBg}` }}></div>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          borderRadius: '9999px', 
          border: `4px solid ${theme.spinnerFg}`, 
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: '500px' }}>
        <div style={{ background: theme.card, borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            <div style={{ height: '1rem', background: theme.skeleton, borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
            <div style={{ height: '2rem', background: theme.skeleton, borderRadius: '0.25rem' }}></div>
          </div>
          <p style={{ color: theme.text, marginTop: '0.5rem', fontSize: '0.875rem' }}>Amazon</p>
        </div>
        
        <div style={{ background: theme.card, borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            <div style={{ height: '1rem', background: theme.skeleton, borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
            <div style={{ height: '2rem', background: theme.skeleton, borderRadius: '0.25rem' }}></div>
          </div>
          <p style={{ color: theme.text, marginTop: '0.5rem', fontSize: '0.875rem' }}>Flipkart</p>
        </div>
        
        <div style={{ background: theme.card, borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            <div style={{ height: '1rem', background: theme.skeleton, borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
            <div style={{ height: '2rem', background: theme.skeleton, borderRadius: '0.25rem' }}></div>
          </div>
          <p style={{ color: theme.text, marginTop: '0.5rem', fontSize: '0.875rem' }}>Myntra</p>
        </div>
      </div>

      <p style={{ color: theme.text, marginTop: '2rem', fontSize: '1.125rem', fontWeight: '500' }}>Searching across platforms...</p>
      <p style={{ color: theme.subtext, fontSize: '0.875rem' }}>This may take a few moments</p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
