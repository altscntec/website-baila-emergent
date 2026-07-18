import { WorldHero } from '../sections/WorldHero';
import { AgendaSection } from '../sections/AgendaSection';
import { ExperiencesRow } from '../sections/ExperiencesRow';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  return (
    <>
      <WorldHero />
      <AgendaSection events={events} />
      <ExperiencesRow />
      <CommunitySection />
    </>
  );
};
