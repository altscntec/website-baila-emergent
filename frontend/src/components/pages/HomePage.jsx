import { HeroSection, LatinEventSection } from '../sections/HeroSection';
import { ExperienceSection } from '../sections/ExperienceSection';
import { CasitaSection } from '../sections/CasitaSection';
import { AgendaSection } from '../sections/AgendaSection';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  return (
    <>
      <HeroSection />
      <LatinEventSection />
      <ExperienceSection />
      <CasitaSection />
      <AgendaSection events={events} />
      <CommunitySection />
    </>
  );
};
