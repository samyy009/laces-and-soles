import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  showInput = false,
  placeholder = "Enter details...",
  defaultValue = ""
}) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="size-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
          <Icons.HelpCircle size={32} />
        </div>
        
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 font-medium mb-4 leading-relaxed">
          {message}
        </p>

        {showInput && (
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all mb-6"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}
        
        <div className="flex gap-4 w-full">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-150 text-gray-700 font-black uppercase text-xs tracking-widest py-4 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              if (showInput) {
                onConfirm(inputValue);
              } else {
                onConfirm();
              }
              onClose();
            }}
            className="flex-1 bg-blue-600 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
