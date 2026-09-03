// Single-page Terms & Conditions — door policy, tickets, house rules and
// photo/video consent, in one canonical place. Linked from the footer next
// to Cookie Settings, and from the cookie consent banner.
export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="terms-page">
      <div className="container-custom py-16">
        <h1 className="font-display text-4xl md:text-6xl mb-4 text-center text-white">
          TERMS &amp; <span className="gradient-text">CONDITIONS</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-16">Last updated 1 September 2026</p>

        <div className="max-w-3xl mx-auto space-y-12">
          <section>
            <h2 className="font-display text-2xl text-white mb-4">Door Policy</h2>
            <ul className="space-y-2 text-gray-400 leading-relaxed">
              <li>• No hats — unless the venue says otherwise, so check with them directly.</li>
              <li>• No tracksuits or trainers.</li>
              <li>• No bags for men on the dancefloor.</li>
              <li>• Minimum age 18, unless stated otherwise for a specific event — ID is mandatory. No ID, no entry.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-4">Tickets</h2>
            <p className="text-gray-400 leading-relaxed">
              Tickets are non-refundable, except if an event is cancelled or postponed for any reason.
              You're welcome to resell your ticket on TicketSwap or exchange it privately with someone else.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-4">House Rules</h2>
            <ul className="space-y-2 text-gray-400 leading-relaxed">
              <li>• Treat everyone with respect, whatever their sexual preference, ethnicity or gender.</li>
              <li>• Be quiet and respect our neighbours when you leave, and keep the surrounding area clean.</li>
              <li>• Take care of your personal belongings, especially in case of an emergency, and follow staff instructions at all times.</li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4 font-semibold">Not allowed:</p>
            <ul className="space-y-2 text-gray-400 leading-relaxed mt-2">
              <li>• Intolerance, sexism, violence or racism.</li>
              <li>• Bringing your own food or drinks in or out of the venue.</li>
              <li>• Weapons or hard drugs.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-4">Photos &amp; Video</h2>
            <p className="text-gray-400 leading-relaxed">
              Taking pictures and videos at our events is allowed. By entering a Baila Dembow event, you agree
              that the organiser of that event can use footage recorded there for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-4">Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              We use cookies to run this site, understand how it's used, and — where you've given marketing
              consent — for advertising. You can review or change your choice any time via Cookie Settings in
              the footer. See our House Rules and Door Policy above for the terms that apply at our events.
            </p>
          </section>
        </div>

        <div className="text-center mt-16">
          <a href="/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};
