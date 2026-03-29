import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-extrabold bg-gradient-to-br from-primary-600 to-primary-900 bg-clip-text text-transparent">
                IT School CRM
              </h1>
              <p className="text-slate-500 font-medium italic">Premium Educational LMS v2.0</p>
            </div>
            
            <form className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="admin@itschool.uz" 
                    className="input-field mt-1" 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 ml-1">Parol</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-field mt-1" 
                  />
                </div>
              </div>
              
              <button className="btn-primary w-full py-4 text-lg">
                Kirish
              </button>
            </form>
            
            <div className="pt-4 text-center border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Barcha narxlar otomatik ravishda <strong>SO'M</strong>da hisoblanadi.
              </p>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
