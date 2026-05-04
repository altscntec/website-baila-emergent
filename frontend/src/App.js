import { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";

// Context
import { CookieConsentProvider } from "./context/CookieConsentContext";

// Utils & Constants
import { EVENTS } from "./utils/constants";

// Common Components
import { Navigation } from "./components/common/Navigation";
import { FloatingCTA } from "./components/common/FloatingCTA";

// Pages
import { HomePage } from "./components/pages/HomePage";
import { PressPage } from "./components/pages/PressPage";
import { AboutUsPage } from "./components/pages/AboutUsPage";
import { EventsPage } from "./components/pages/EventsPage";
import { SingleEventPage } from "./components/pages/SingleEventPage";
import { LatinEventAmsterdamPage, LatinEventRotterdamPage } from "./components/pages/SEOPages";
import { KingsdayWeekenderPage } from "./components/pages/KingsdayWeekenderPage";

// Main App Component
function App() {
  const events = EVENTS;

  // Use hash-based routing for better compatibility with deployed sites
  const getHashPath = () => {
    const hash = window.location.hash;
    const pathPart = hash.replace('#', '').split('?')[0];
    return pathPart || '/';
  };

  const [currentPath, setCurrentPath] = useState(getHashPath());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getHashPath());
      
      const hash = window.location.hash;
      if (hash.includes('scrollTo=')) {
        const scrollToId = hash.split('scrollTo=')[1];
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
          window.history.replaceState(null, '', window.location.origin + '/#/');
        }, 100);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    const hash = window.location.hash;
    if (hash.includes('scrollTo=')) {
      const scrollToId = hash.split('scrollTo=')[1];
      setTimeout(() => {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
        window.history.replaceState(null, '', window.location.origin + '/#/');
      }, 500);
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const pathname = window.location.pathname;
  const effectivePath = currentPath !== '/' ? currentPath : pathname;

  const isEventPage = effectivePath.startsWith('/events/') || effectivePath.startsWith('events/');
  const eventSlug = isEventPage ? effectivePath.replace(/^\/?events\//, '') : null;
  const isKingsdayPage = eventSlug === 'kingsday-weekender-2026';

  return (
    <CookieConsentProvider>
      <div className="grain-overlay" />
      {!isKingsdayPage && <Navigation />}
      <main>
        {effectivePath === '/press' || effectivePath === 'press' ? (
          <PressPage />
        ) : effectivePath === '/latin-event-amsterdam' || effectivePath === 'latin-event-amsterdam' ? (
          <LatinEventAmsterdamPage events={events} />
        ) : effectivePath === '/latin-event-rotterdam' || effectivePath === 'latin-event-rotterdam' ? (
          <LatinEventRotterdamPage events={events} />
        ) : isKingsdayPage ? (
          <KingsdayWeekenderPage />
        ) : isEventPage && eventSlug ? (
          <SingleEventPage eventSlug={eventSlug} events={events} />
        ) : effectivePath === '/events' || effectivePath === 'events' ? (
          <EventsPage events={events} />
        ) : effectivePath === '/about' || effectivePath === 'about' ? (
          <AboutUsPage />
        ) : (
          <HomePage events={events} />
        )}
      </main>
      {!isKingsdayPage && <FloatingCTA />}
      <Toaster position="top-center" richColors />
    </CookieConsentProvider>
  );
}

export default App;
