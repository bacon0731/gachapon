'use client'

import { useState, useRef, useEffect } from 'react'

interface TagSelectorProps {
  options: { id: string; name: string }[]
  value: string[]
  onChange: (newIds: string[]) => void
  label?: string
}

export default function TagSelector({ options, value, onChange, label = '顯示菜單' }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  // Get selected names for display
  const selectedNames = options
    .filter(opt => value.includes(opt.id))
    .map(opt => opt.name)
    .join(', ')

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[44px] px-3 bg-white border-2 border-neutral-200 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-neutral-300 ${isOpen ? 'ring-2 ring-primary border-primary' : ''}`}
      >
        <div className="truncate text-neutral-700 pr-2 select-none">
          {selectedNames || <span className="text-neutral-400">請選擇...</span>}
        </div>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            <div className="p-1 space-y-0.5">
              {options.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => handleToggle(opt.id)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-neutral-50 rounded select-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.includes(opt.id) ? 'bg-primary border-primary' : 'border-neutral-300 bg-white'}`}>
                    {value.includes(opt.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-neutral-700">{opt.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-neutral-500">
              無可用選項
            </div>
          )}
        </div>
      )}
    </div>
  )
}
