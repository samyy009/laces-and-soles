import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', parts: ['Hello! I am your Laces & Soles Assistant. I can help you with orders, collections, or even answer general questions like Alexa or Google Assistant. How can I help you today?'] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  const scrollRef = useRef(null);
  
  // Speech Recognition Setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speak = (text) => {
    if (!isSpeakingEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    const updatedHistory = [...chatHistory, { role: 'user', parts: [userMessage] }];
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: userMessage,
        history: chatHistory
      });

      const botResponse = response.data.response;
      setChatHistory(response.data.history);
      speak(botResponse);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMsg = 'I am sorry, I am having trouble connecting right now. Please try again later.';
      setChatHistory([
        ...updatedHistory,
        { role: 'model', parts: [errorMsg] }
      ]);
      speak(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Track Order', path: '/track' },
    { label: 'Latest Collections', path: '/collections' },
    { label: 'Contact Us', path: '/contact' }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[calc(100vh-120px)] h-[500px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0a192f] p-6 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <Sparkles className="absolute top-2 left-4 scale-150" />
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">L&S Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium opacity-80 uppercase tracking-wider text-green-100">Smart Voice Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
                  className={`p-2 rounded-xl transition-colors ${isSpeakingEnabled ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'}`}
                  title={isSpeakingEnabled ? "Mute Voice" : "Enable Voice"}
                >
                  {isSpeakingEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-grow p-6 overflow-y-auto space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-blue-100"
            >
              {chatHistory.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#0a192f] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.parts[0]}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-center gap-2 text-gray-400"
                >
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = action.path;
                    }}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask or speak to me..."
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0a192f] transition-all"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="bg-[#0a192f] text-white p-3 rounded-xl hover:bg-[#112240] disabled:opacity-50 disabled:hover:bg-[#0a192f] transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-medium uppercase tracking-widest">
                Gemini Intelligence • Smart Assistant Mode
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-[#0a192f] rotate-90' : 'bg-[#0a192f] text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-[#0a192f] border-2 border-white"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBot;
