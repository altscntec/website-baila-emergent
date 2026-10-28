import { WorldHero } from '../sections/WorldHero';
import { FeaturedEventSection } from '../sections/FeaturedEventSection';
import { SecondaryEventSection } from '../sections/SecondaryEventSection';
import { AgendaSection } from '../sections/AgendaSection';
import { ExperiencesRow } from '../sections/ExperiencesRow';
import { FAQSection } from '../sections/FAQSection';
import { CommunitySection } from '../sections/CommunitySection';

export const HomePage = ({ events }) => {
  // Spotlights: flagship events (featured) ordered by featured_priority, then date. The first is the XL
  // spotlight with the countdown; the next one gets the compact secondary band. Past events drop out on their own.
  const today = new Date().toISOString().slice(0, 10);
  const flagships = events
    .filter((e) => e.featured && e.date >= today)
    .sort((a, b) => (a.featured_priority || 99) - (b.featured_priority || 99) || a.date.localeCompare(b.date));
  const [featured, secondary] = flagships;
  return (
    <>
      <WorldHero />
      {featured && <FeaturedEventSection event={featured} />}
      {secondary && <SecondaryEventSection event={secondary} />}
      <AgendaSection events={events} />
      <ExperiencesRow />
      <FAQSection />
      <CommunitySection />
    </>
  );
};
