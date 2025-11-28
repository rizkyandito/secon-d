import { useState, useCallback } from 'react'
import { debounce } from '../../utils/debounce'

export default function SearchBar({ placeholder, onSearch }) {
  const [query, setQuery] = useState('')

  const debouncedSearch = useCallback(
    debounce((value) => onSearch(value), 300),
    [onSearch]
  )

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-5 py-3 pl-12 pr-12 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900/50 backdrop-blur-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-300"
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
        🔍
      </span>
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
      )}
    </div>
  )
}
