import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false); // New state for confirmation flow

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
        return;
      }
      const res = await loginWithEmail(email, password);
      // Login returns { success, error }
      if (res.success) navigate('/');
      else setError(res.error || 'Invalid credentials.');
    } else {
      // Signup Validation
      if (!email || !password || !firstName || !lastName || !confirmPassword) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      const res = await signupWithEmail(email, password, firstName, lastName);

      if (res.success) {
        if (res.requiresConfirmation) {
          setEmailSent(true);
        } else {
          navigate('/');
        }
      } else {
        setError(res.error || 'Failed to create account.');
      }
    }
    setLoading(false);
  };

  // SUCCESS STATE (Verify Email)
  if (!isLogin && emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white w-full max-w-[420px] p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Conta Criada!</h2>
          <p className="text-slate-500 mb-6">
            Enviámos um email de confirmação para <strong>{email}</strong>.
            Por favor verifica a tua caixa de correio para ativar a conta.
          </p>
          <button
            onClick={() => { setEmailSent(false); setIsLogin(true); }}
            className="text-primary font-bold hover:underline"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-[420px] p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">

        {/* Branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-slate-900/20">
            K
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h1>
          <p className="text-slate-500 text-sm mt-2">{isLogin ? 'Insere os teus dados para entrar.' : 'Junta-te à equipa Kozegho.'}</p>
        </div>

        {/* Form */}
        <div className="w-full space-y-6">
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nome</label>
                  <input
                    className="input-field"
                    placeholder="João"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Apelido</label>
                  <input
                    className="input-field"
                    placeholder="Silva"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nome@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Palavra-passe</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Confirmar Palavra-passe</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 bg-slate-50 focus:bg-white ${confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-slate-900 focus:border-transparent'
                      }`}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'A processar...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              {!loading && <ArrowRight size={16} className="opacity-60" />}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-slate-600 font-medium hover:text-slate-900"
            >
              {isLogin ? "Não tens conta? Regista-te" : "Já tens conta? Faz login"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}