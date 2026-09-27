import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  phone?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  triggerClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.phone && o.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} ref={dropdownRef}>
      <div
        className={`w-full bg-slate-950 text-white flex items-center justify-between cursor-pointer border transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-600'
        } ${
          triggerClassName || 'text-xs px-3 py-2.5 rounded-xl'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="truncate flex-1 text-left">
          {isOpen ? (
            <input
              type="text"
              autoFocus
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setSearchTerm('');
                }
              }}
              className="bg-transparent w-full outline-none text-white placeholder:text-slate-500 font-medium"
            />
          ) : (
            selectedOption ? (
              <span className="text-white">
                {selectedOption.name} {selectedOption.phone && selectedOption.phone !== 'N/A' ? `(${selectedOption.phone})` : ''}
              </span>
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )
          )}
        </span>
        
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              className="p-0.5 text-slate-400 hover:text-rose-400 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(o => (
              <div
                key={o.id}
                className={`px-4 py-3 hover:bg-slate-800 cursor-pointer text-xs border-b border-slate-800/60 last:border-0 transition-colors ${
                  o.id === value ? 'bg-indigo-600/20 text-indigo-300 font-bold' : ''
                }`}
                onClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>{o.name}</span>
                  {o.id === value && <span className="text-[10px] text-indigo-400 font-bold">✓ Selected</span>}
                </div>
                {o.phone && o.phone !== 'N/A' && (
                  <div className="text-slate-400 text-[11px] mt-0.5">Mobile: {o.phone}</div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-slate-400 text-xs italic text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};
