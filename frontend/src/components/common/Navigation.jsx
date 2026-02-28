import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MessageCircle, Ticket, Sparkles, Mail, Users } from 'lucide-react';
import { BUNNY_LOGO } from '../../utils/constants';

export const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-mobile-menu]')) {
          setMobileMenuOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const isHomePage = window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/';
    
    if (isHomePage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = `${window.location.origin}/#/?scrollTo=${id}`;
    }
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="nav-container"
      data-testid="main-navigation"
      data-mobile-menu
    >
      <div className={`flex items-center justify-between gap-4 px-4 py-2 rounded-full transition-all duration-300 ${scrolled ? 'bg-white shadow-lg border border-gray-200' : 'bg-white/10 backdrop-blur-sm'}`}>
        <img 
          src={BUNNY_LOGO} 
          alt="Baila Dembow" 
          className="h-10 w-10 cursor-pointer object-contain"
          onClick={() => window.location.href = window.location.origin}
        />
        
        {/* Desktop Navigation */}
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${scrolled ? 'text-black' : 'text-white'}`}>
          <a href="#events" className="hover:text-[#FF0080] transition-colors" data-testid="nav-events">Events</a>
          <a href="#about" className="hover:text-[#FF0080] transition-colors" data-testid="nav-about">About</a>
          <button onClick={() => scrollToSection('experience')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-gallery">Gallery</button>
          <button onClick={() => scrollToSection('community')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-community">Community</button>
          <a href="#press" className="hover:text-[#FF0080] transition-colors" data-testid="nav-press">Press</a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-black hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          data-testid="mobile-menu-button"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-4 right-4 z-[101]"
            data-mobile-menu
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-4 flex flex-col gap-2">
                <a 
                  href="#events" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-events"
                >
                  <Calendar className="w-5 h-5" />
                  Events
                </a>
                <a 
                  href="#about" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-about"
                >
                  <Users className="w-5 h-5" />
                  About
                </a>
                <button 
                  onClick={() => scrollToSection('experience')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium text-left"
                  data-testid="mobile-nav-gallery"
                >
                  <Sparkles className="w-5 h-5" />
                  Gallery
                </button>
                <button 
                  onClick={() => scrollToSection('community')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium text-left"
                  data-testid="mobile-nav-community"
                >
                  <MessageCircle className="w-5 h-5" />
                  Community
                </button>
                <a 
                  href="#press" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-press"
                >
                  <Mail className="w-5 h-5" />
                  Press
                </a>
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <a 
                    href="https://linktr.ee/bailadembow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold hover:opacity-90 transition-all"
                    data-testid="mobile-nav-tickets"
                  >
                    <Ticket className="w-5 h-5" />
                    Get Tickets
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
