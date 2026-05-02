import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import hubliLocations from '../hubli_locations.json';

export default function ZoneSelector({ currentZones, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const selectedZones = currentZones ? currentZones.split(',').map(z => z.trim()).filter(Boolean) : [];

  const toggleZone = (pincode) => {
    let newZones;
    if (selectedZones.includes(pincode)) {
      newZones = selectedZones.filter(z => z !== pincode);
    } else {
      newZones = [...selectedZones, pincode];
    }
    onUpdate(newZones.join(', '));
  };

  const filteredLocations = hubliLocations.filter(loc => 
    loc.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loc.pincode.includes(searchTerm)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-[300px]" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white transition-all min-h-[40px]"
      >
        <div className="flex flex-wrap gap-1">
          {selectedZones.length > 0 ? (
            selectedZones.slice(0, 2).map(z => (
              <span key={z} className="bg-rose-50 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-rose-100">
                {z}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 font-bold italic">Select Hubli Zones...</span>
          )}
          {selectedZones.length > 2 && (
            <span className="text-[8px] font-black text-gray-400">+{selectedZones.length - 2} more</span>
          )}
        </div>
        <Icons.ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 rounded-[24px] mt-2 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="relative mb-4">
            <Icons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Area or Pin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar-light space-y-1">
            {filteredLocations.map(loc => {
              const isSelected = selectedZones.includes(loc.location);
              return (
                <div 
                  key={`${loc.pincode}-${loc.location}`}
                  onClick={() => toggleZone(loc.location)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-rose-50 border-rose-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-1 mr-4 overflow-hidden">
                    <p className="text-[10px] font-black text-gray-900 truncate" title={loc.location}>{loc.location}</p>
                    <p className="text-[8px] font-bold text-gray-400">{loc.pincode}</p>
                  </div>
                  {isSelected && <Icons.Check size={14} className="text-rose-500 flex-shrink-0" />}
                </div>
              );
            })}
            {filteredLocations.length === 0 && (
              <p className="text-center py-4 text-[10px] text-gray-400 italic">No locations found</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{selectedZones.length} Selected</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
