import { WorldHero } from '../sections/WorldHero';
import { FeaturedEventSection } from '../sections/FeaturedEventSection';
import { AgendaSection } from '../sections/AgendaSection';
import { ExperiencesRow } from '../sections/ExperiencesRow';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  const featured = events.find((e) => e.featured);
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
