import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, HelpCircle } from 'lucide-react';
import { MOCK_ACCOUNTS, mockAuthService } from '../utils/firebase';
import logo from '../assets/jo logo.png';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [showMockChooser, setShowMockChooser] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhoto, setCustomPhoto] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginClick = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.message === 'MOCK_LOGIN_TRIGGER') {
        // Fall back to showing the interactive mock chooser popup
        setShowMockChooser(true);
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMock = (account: typeof MOCK_ACCOUNTS[0]) => {
    mockAuthService.signInMock({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      photoURL: account.photoURL,
    });
    setShowMockChooser(false);
  };

  const handleCustomMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      setErrorMsg('Name and email are required for custom profiles.');
      return;
    }
    mockAuthService.signInMock({
      uid: `mock-user-${Date.now()}`,
      email: customEmail,
      displayName: customName,
      photoURL: customPhoto.trim() || '',
    });
    setShowMockChooser(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-200">
      
      {/* Brand & Introduction */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 my-auto">
        {/* Animated Custom Logo container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-28 h-28 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-lg p-4">
            <img
              src={logo}
              alt="JO Sphere Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Text Headers */}
        <div className="text-center space-y-2 max-w-xs">
          <h2 className="text-3xl font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight leading-tight">
            JO Sphere
          </h2>
          <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest leading-none">
            Learn • Revise • Succeed
          </p>
          <p className="text-[11px] font-semibold text-slate-400 leading-normal pt-1.5">
            Your Complete Learning and Revision Companion
          </p>
        </div>
      </div>

      {/* Auth Actions Area */}
      <div className="w-full space-y-4 max-w-sm mx-auto">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-2xl text-[11px] font-bold text-rose-600 dark:text-rose-400 text-center">
            {errorMsg}
          </div>
        )}

        {/* Google Sign-in Button with official branding rules */}
        <button
          onClick={handleLoginClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3.5 px-4 py-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer min-h-[56px] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-cyan-600 rounded-full animate-spin" />
          ) : (
            <>
              {/* Official Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.34 14.99 0 12 0 7.35 0 3.39 2.67 1.48 6.56l3.87 3C6.27 6.84 8.91 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.35 14.56c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38L1.48 6.8c-.8 1.6-1.25 3.39-1.25 5.2 0 1.81.45 3.6 1.25 5.2l3.87-3.24z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.73-2.89c-1.03.69-2.35 1.11-3.93 1.11-3.09 0-5.73-1.8-6.65-4.52l-3.87 3C3.39 21.33 7.35 24 12 24z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="text-[9px] text-slate-400 text-center font-medium px-4">
          By signing in, you access secure cloud backups and sync learning milestones on multiple devices.
        </p>
      </div>

      {/* Interactive Mock Google Account Chooser Modal (Overlay Sheet) */}
      {showMockChooser && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300">
            
            {/* Modal Header */}
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.64z"
                    />
                  </svg>
                  Choose an account
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  to continue to JO Sphere
                </p>
              </div>
              <button
                onClick={() => setShowMockChooser(false)}
                className="text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 text-xs font-black p-1 uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* List of Simulated Accounts */}
            <div className="space-y-2">
              {MOCK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectMock(acc)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 hover:border-cyan-200 dark:hover:border-cyan-900/50 cursor-pointer text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {acc.photoURL ? (
                      <img
                        src={acc.photoURL}
                        alt={acc.displayName}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {acc.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {acc.displayName}
                      </p>
                      <p className="text-[9px] text-slate-450 truncate max-w-[170px]">
                        {acc.email}
                      </p>
                    </div>
                  </div>
                  <Check size={14} className="text-cyan-500 opacity-60" />
                </button>
              ))}
            </div>

            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-400 uppercase font-black">Or custom test profile</span>
              <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
            </div>

            {/* Custom Mock Account Form */}
            <form onSubmit={handleCustomMockSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rushindra Ram"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-12 px-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-cyan-500 dark:focus:border-cyan-500 text-slate-800 dark:text-slate-150 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rushindra@sail.co.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full h-12 px-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-cyan-500 dark:focus:border-cyan-500 text-slate-800 dark:text-slate-150 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">
                  Avatar Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Leave empty for initials fallback"
                  value={customPhoto}
                  onChange={(e) => setCustomPhoto(e.target.value)}
                  className="w-full h-12 px-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-cyan-500 dark:focus:border-cyan-500 text-slate-800 dark:text-slate-150 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-13 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-xs uppercase tracking-widest text-center cursor-pointer shadow-sm mt-3 active:scale-95 transition-all flex items-center justify-center"
              >
                Sign In with Custom Profile
              </button>
            </form>

            <div className="bg-slate-55 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-2.5">
              <HelpCircle className="text-cyan-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[9px] text-slate-450 leading-relaxed">
                Google Identity client is active in offline mockup mode because Firebase keys are absent. You can login using any simulated user profile.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
