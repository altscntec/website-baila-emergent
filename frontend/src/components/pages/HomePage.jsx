import { HeroSection, LatinEventSection } from '../sections/HeroSection';
import { ExperienceSection } from '../sections/ExperienceSection';
import { AgendaSection } from '../sections/AgendaSection';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  return (
    <>
      <HeroSection />
      <LatinEventSection />
      <ExperienceSection />
      <AgendaSection events={events} />
      <CommunitySection />
    </>
  );
};
