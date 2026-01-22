import { useState } from 'react'

export default function SearchBar({ onSearch, disabled, isDark }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(input)
  }

  const colors = {
    light: {
      border: '#d1d5db',
      input: '#ffffff',
      placeholder: '#9ca3af',
      button: '#4f46e5',
      buttonDisabled: '#9ca3af'
    },
    dark: {
      border: '#4b5563',
      input: '#1f2937',
      placeholder: '#6b7280',
      button: '#6366f1',
      buttonDisabled: '#4b5563'
    }
  }

  const theme = isDark ? colors.dark : colors.light

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          id="product-search"
          name="product-search"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Search for any product..."
          autoComplete="off"
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            border: `2px solid ${theme.border}`,
            borderRadius: '0.5rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            backgroundColor: theme.input,
            color: isDark ? '#f3f4f6' : '#1f2937',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: disabled ? theme.buttonDisabled : theme.button,
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
            fontSize: '1rem'
          }}
        >
          🔍 Search
        </button>
      </div>
    </form>
  )
}
