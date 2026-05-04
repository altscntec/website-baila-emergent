import { HeroSection, LatinEventSection } from '../sections/HeroSection';
import { ExperienceSection } from '../sections/ExperienceSection';
import { CasitaSection } from '../sections/CasitaSection';
import { HalloweenSection } from '../sections/HalloweenSection';
import { LiveShowSection } from '../sections/LiveShowSection';
import { AgendaSection } from '../sections/AgendaSection';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  return (
    <>
      <HeroSection />
      <LatinEventSection />
      <ExperienceSection />
      <AgendaSection events={events} />
      <HalloweenSection />
      <LiveShowSection />
      <CasitaSection />
      <CommunitySection />
    </>
  );
};
