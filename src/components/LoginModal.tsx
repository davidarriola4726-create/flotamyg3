import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Truck, KeyRound, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  onLoginSuccess: (rememberMe: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      if (password.trim() === 'MIG2026') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        onLoginSuccess(rememberMe);
      } else {
        setError('Contraseña incorrecta. Ingrese la clave asignada por administración (MIG2026).');
        setIsSubmitting(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner mb-4">
            <Truck className="w-8 h-8 text-amber-300" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Control de Vehículos MIG
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Sistema Oficial de Gestión y Mantenimiento de Flota
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] text-blue-100 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso Seguro Restringido</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingrese contraseña..."
                autoFocus
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              Clave general establecida: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">MIG2026</span>
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Recordar sesión en este equipo</span>
            </label>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Ingresar al Sistema MIG</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-400">
              Operaciones y Mantenimiento • Guatemala 2026
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
