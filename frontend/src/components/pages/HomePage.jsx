import { HeroSection, LatinEventSection } from '../sections/HeroSection';
import { NextEventSection } from '../sections/NextEventSection';
import { ExperienceSection } from '../sections/ExperienceSection';
import { AgendaSection } from '../sections/AgendaSection';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  return (
    <>
      <HeroSection />
      <LatinEventSection />
      <NextEventSection events={events} />
      <ExperienceSection />
      <AgendaSection events={events} />
      <CommunitySection />
    </>
  );
};
