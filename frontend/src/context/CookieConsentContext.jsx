import { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, BarChart3, Target, X } from 'lucide-react';
import { CONSENT_KEY } from '../utils/constants';
import { loadMetaPixel, loadTikTokPixel } from '../utils/tracking';

// Create context
const CookieConsentContext = createContext(null);

// Hook to use the context
export const useCookieConsent = () => useContext(CookieConsentContext);

// Get stored consent
const getStoredConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading consent:', e);
  }
  return null;
};

// Save consent
const saveConsent = (consent) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Error saving consent:', e);
  }
};

// Cookie Consent Banner Component
const CookieConsentBanner = ({ onConsent, showPreferences, setShowPreferences }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  const handleAcceptAll = () => {
    const consent = { necessary: true, analytics: true, marketing: true };
    onConsent(consent);
  };

  const handleRejectAll = () => {
    const consent = { necessary: true, analytics: false, marketing: false };
    onConsent(consent);
  };

  const handleSavePreferences = () => {
    onConsent(preferences);
    setShowPreferences(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none"
        data-testid="cookie-banner"
      >
        <div className="pointer-events-auto w-full max-w-2xl">
          {!showPreferences ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-2 bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl">
                    <Shield className="w-6 h-6 text-[#FF0080]" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-gray-900 mb-1">We value your privacy</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                      You can choose which cookies to accept.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    data-testid="cookie-reject-all"
                  >
                    Reject all
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-[#FF0080]/20"
                    data-testid="cookie-accept-all"
                  >
                    Accept all
                  </button>
                </div>
                
                <button
                  onClick={() => setShowPreferences(true)}
                  className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-[#FF0080] transition-colors flex items-center justify-center gap-2"
                  data-testid="cookie-manage-preferences"
                >
                  <Settings className="w-4 h-4" />
                  Manage preferences
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl text-gray-900">Cookie Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {/* Necessary Cookies */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Necessary</span>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Always active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Essential for the website to function properly. Cannot be disabled.
                  </p>
                </div>
                
                {/* Analytics Cookies */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Analytics</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="sr-only peer"
                        data-testid="cookie-analytics-toggle"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#FF0080] peer-checked:to-[#8B5CF6]"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                
                {/* Marketing Cookies */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Marketing</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="sr-only peer"
                        data-testid="cookie-marketing-toggle"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#FF0080] peer-checked:to-[#8B5CF6]"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Used to show you relevant ads on other platforms (Meta, TikTok).
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-[#FF0080]/20"
                    data-testid="cookie-save-preferences"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Cookie Consent Provider Component
export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      if (stored.marketing) {
        loadMetaPixel();
        loadTikTokPixel();
      }
    } else {
      setShowBanner(true);
    }
    setInitialized(true);
  }, []);

  const handleConsent = (newConsent) => {
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowBanner(false);
    
    if (newConsent.marketing) {
      loadMetaPixel();
      loadTikTokPixel();
    }
  };

  const openPreferences = () => {
    setShowPreferences(true);
    setShowBanner(true);
  };

  if (!initialized) return null;

  return (
    <CookieConsentContext.Provider value={{ consent, openPreferences }}>
      {children}
      {showBanner && (
        <CookieConsentBanner 
          onConsent={handleConsent}
          showPreferences={showPreferences}
          setShowPreferences={setShowPreferences}
        />
      )}
    </CookieConsentContext.Provider>
  );
};

// Cookie Settings Footer Link Component
export const CookieSettingsLink = () => {
  const cookieContext = useCookieConsent();
  
  if (!cookieContext) return null;
  
  return (
    <button
      onClick={cookieContext.openPreferences}
      className="text-gray-400 hover:text-[#FF0080] transition-colors flex items-center gap-1 text-xs"
      data-testid="cookie-settings-link"
    >
      <Settings className="w-3 h-3" />
      Cookie Settings
    </button>
  );
};
