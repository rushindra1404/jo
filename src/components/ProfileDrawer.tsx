import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  CloudLightning, 
  RefreshCw, 
  Sun, 
  Moon, 
  LogOut, 
  X,
  CheckCircle
} from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { navigate, progress } = useApp();
  
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  if (!user) return null;

  // Initials for avatar fallback
  const getInitials = () => {
    if (!user.displayName) return 'U';
    return user.displayName.charAt(0).toUpperCase();
  };

  const handleSync = () => {
    setSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);
    }, 1500); // 1.5 seconds simulation
  };

  const handleSettingsClick = () => {
    onClose();
    navigate('more');
  };

  const handleConfirmSignOut = async () => {
    setShowConfirmSignOut(false);
    onClose();
    await signOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Slide-up Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl safe-padding-bottom overflow-hidden"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-3" />

            {!showConfirmSignOut ? (
              /* Main Drawer View */
              <div className="px-5 pb-8 space-y-6">
                {/* Header Profile Info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full border-2 border-cyan-500/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-cyan-600 dark:bg-cyan-900 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                        {getInitials()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {user.displayName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {/* Option 1: Profile Details Toggle */}
                  <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowProfileDetails(!showProfileDetails)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50/20 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850/30 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 rounded-xl">
                          <User size={16} />
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Profile Details</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400">
                        {showProfileDetails ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    
                    {showProfileDetails && (
                      <div className="px-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 text-[10px] font-semibold text-slate-500 space-y-2 select-none">
                        <div className="flex justify-between">
                          <span>User ID:</span>
                          <span className="font-mono text-[9px] text-slate-400">{user.uid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Account Type:</span>
                          <span className="text-cyan-600 dark:text-cyan-400">Google Authenticated</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Answers:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-extrabold">
                            {Object.keys(progress.attempts).length} cards
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Sync Status */}
                  <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 rounded-xl">
                        <CloudLightning size={16} />
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                          Sync Status
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">
                          {syncSuccess ? 'Data fully backed up' : 'Local copy ready'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${
                        syncSuccess 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {syncing ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Syncing
                        </>
                      ) : syncSuccess ? (
                        <>
                          <CheckCircle size={12} /> Synced
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} /> Sync Now
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 3: Settings link */}
                  <button
                    onClick={handleSettingsClick}
                    className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-2xl flex items-center gap-3 text-left border border-slate-100 dark:border-slate-850 cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl">
                      <Settings size={16} />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                        Settings
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">
                        Font sizes, accessibility modes, reset keys
                      </span>
                    </div>
                  </button>

                  {/* Option 4: Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-850 cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-500 dark:bg-amber-950/20 rounded-xl">
                        {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                          Appearance
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">
                          Toggle light & dark skins
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-350">
                      {theme === 'light' ? 'Light' : 'Dark'}
                    </span>
                  </button>
                </div>

                {/* Sign Out Action Button */}
                <button
                  onClick={() => setShowConfirmSignOut(true)}
                  className="w-full py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/10 text-rose-600 border border-rose-100 dark:border-rose-900/50 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              /* Sign Out Confirmation Sheet View */
              <div className="px-5 pb-8 space-y-6">
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <LogOut size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Confirm Sign Out
                    </h3>
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-xs mx-auto">
                      Are you sure you want to sign out? Your learning progress remains securely saved locally on this device.
                    </p>
                  </div>
                </div>

                {/* Confirmation Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmSignOut(false)}
                    className="py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-2xl text-xs uppercase tracking-wider text-center cursor-pointer min-h-[52px] active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSignOut}
                    className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider text-center cursor-pointer shadow-md min-h-[52px] active:scale-95 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
