import { useEffect } from 'react';
import { HalloweenSection } from '../sections/HalloweenSection';
import { LiveShowSection } from '../sections/LiveShowSection';
import { CasitaSection } from '../sections/CasitaSection';
import { CommunitySection } from '../sections/CommunitySection';

// Shared wrapper: scrolls to top on mount, dark bg behind fixed nav
const ExperiencePage = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <div style={{ background: '#0A0A0A' }}>{children}<CommunitySection /></div>;
};

export const HalloweenExperiencePage = () => (
  <ExperiencePage><HalloweenSection /></ExperiencePage>
);

export const LiveShowExperiencePage = () => (
  <ExperiencePage><LiveShowSection /></ExperiencePage>
);

export const CasitaExperiencePage = () => (
  <ExperiencePage><CasitaSection /></ExperiencePage>
);
