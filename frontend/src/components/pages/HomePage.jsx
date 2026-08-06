import { WorldHero } from '../sections/WorldHero';
import { FeaturedEventSection } from '../sections/FeaturedEventSection';
import { AgendaSection } from '../sections/AgendaSection';
import { ExperiencesRow } from '../sections/ExperiencesRow';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  // Spotlight the soonest upcoming flagship event; it rolls over on its own.
  const today = new Date().toISOString().slice(0, 10);
  const featured = events
    .filter((e) => e.featured && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <>
      <WorldHero />
      {featured && <FeaturedEventSection event={featured} />}
      <AgendaSection events={events} />
      <ExperiencesRow />
      <CommunitySection />
    </>
  );
};
