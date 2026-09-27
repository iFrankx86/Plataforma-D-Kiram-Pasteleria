import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Store, UserCircle2, Clock, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { DKiramLogo } from './common/DKiramLogo';

export const Header: React.FC = () => {
  const { currentUser, setCurrentUser, users, currentCashRegister } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Official Brand Logo (Un solo logo, nítido, sin duplicados ni recuadros) */}
        <div className="flex items-center shrink-0">
          <DKiramLogo className="h-9 sm:h-11 w-auto" withContour={true} />
        </div>

        {/* Status Pills & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Cash Status Pill */}
          <div className="flex items-center">
            {currentCashRegister ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-medium hidden md:inline">Caja Abierta:</span>
                <span className="font-semibold text-emerald-200">
                  S/ {currentCashRegister.expectedCash.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">Caja Cerrada</span>
              </div>
            )}
          </div>

          {/* User / Seller Switcher (Zaori Sanchez, Frank Lope, etc.) */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-700/80" ref={menuRef}>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-stone-200">{currentUser.name}</div>
              <div className="text-[10px] text-amber-400 font-mono tracking-wider">
                [{currentUser.role}] • {currentUser.position}
              </div>
            </div>
            
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 p-1.5 sm:px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs transition active:scale-95"
                title="Cambiar responsable / vendedor activo"
              >
                <UserCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium sm:hidden max-w-[80px] truncate text-stone-200">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>
              
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-stone-800 rounded-2xl shadow-2xl border border-stone-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider border-b border-stone-700 pb-1.5 mb-1">
                    Cambiar Vendedor / Responsable
                  </div>
                  {users.map(u => {
                    const isSelected = currentUser.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-stone-700/80 transition ${
                          isSelected ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-stone-100">{u.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                          </div>
                          <div className="text-[10px] text-stone-400">{u.position}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-600 font-mono text-amber-400">
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
