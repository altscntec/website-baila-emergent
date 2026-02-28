import { useState } from 'react';
import { Instagram, Mail, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export const AboutUsPage = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "Booking",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ name: "", email: "", subject: "Booking", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-6xl mb-6">
            BAILA DEMBOW<br /><span className="gradient-text">ABOUT US</span>
          </h1>
          <span className="sr-only" aria-hidden="true">The #1 Latin Event in Amsterdam and the Netherlands</span>
        </div>

        {/* Main Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="font-display text-3xl md:text-4xl mb-8 text-center">
            WHERE LATIN CULTURE <span className="gradient-text">COMES ALIVE</span>
          </h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              There's a moment — right when the bass drops, the CO2 cannon fires, and confetti rains down on a 
              600-person dance floor — when you realize this isn't just a party. <strong>This is a movement.</strong>
            </p>
            <p>
              Baila Dembow is the #1 Latin event in Amsterdam and the Netherlands, delivering sold-out nights of 
              Reggaeton, Dembow, Latin urban hits, Salsa, Bachata, and Merengue that have turned first-timers into 
              loyal regulars and transformed ordinary venues into pulsating Latin spaces.
            </p>
            <p>
              Born from a deep love of Latin-Caribbean culture and built by <strong>House Decoded Events</strong>, 
              Baila Dembow has grown from a local Amsterdam staple into a multi-city circuit spanning Rotterdam, 
              Utrecht, Tilburg, and London.
            </p>
            <p className="text-center font-semibold text-xl text-[#FF0080]">
              If you've been searching for a Latin party in the Netherlands that actually delivers on its promise, you've found it.
            </p>
          </div>
        </div>

        {/* City Sections */}
        {[
          { emoji: "🇳🇱", city: "AMSTERDAM", subtitle: "HOME OF THE MOVEMENT", photos: ["amsterdam1", "amsterdam2", "amsterdam3"] },
          { emoji: "🔴", city: "ROTTERDAM", subtitle: "RAW ENERGY, LATIN STYLE", photos: ["rotterdam1", "rotterdam2", "rotterdam3"] },
          { emoji: "🟡", city: "UTRECHT", subtitle: "THE CITY THAT KEEPS ASKING FOR MORE", photos: ["utrecht1", "utrecht2", "utrecht3"] },
          { emoji: "🔵", city: "TILBURG", subtitle: "THE SOUTH'S LATIN HEARTBEAT", photos: ["tilburg1", "tilburg2", "tilburg3"] },
          { emoji: "🇬🇧", city: "LONDON", subtitle: "BAILA DEMBOW GOES INTERNATIONAL", photos: ["london1", "london2", "london3"] }
        ].map((section) => (
          <div key={section.city} className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{section.emoji}</span>
              <h3 className="font-display text-3xl md:text-4xl">{section.city} — <span className="gradient-text">{section.subtitle}</span></h3>
            </div>
            <div className="mt-8">
              <h4 className="font-display text-lg mb-4">📸 {section.city.charAt(0) + section.city.slice(1).toLowerCase()} Photo Gallery</h4>
              <div className="grid grid-cols-3 gap-4">
                {section.photos.map((photo, i) => (
                  <img key={i} src={`/city-photos/${photo}.jpg`} alt={`Baila Dembow ${section.city} event ${i + 1}`} className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* FAQ Section */}
        <div className="mb-20 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl mb-8 text-center">
            FREQUENTLY ASKED <span className="gradient-text">QUESTIONS</span>
          </h2>
          <div className="space-y-6">
            {[
              { q: "What kind of music plays at Baila Dembow events?", a: "Every night features a curated mix of Reggaeton, Dembow, Latin urban hits, Bachata, Salsa, and Merengue." },
              { q: "Where does Baila Dembow host events?", a: "Baila Dembow runs a multi-city circuit across Amsterdam, Rotterdam, Utrecht, Tilburg, and London." },
              { q: "Do Baila Dembow events sell out?", a: "Yes — consistently. Venue capacities run between 450 and 700 people, and demand regularly exceeds availability." },
              { q: "What makes Baila Dembow different from other Latin nights?", a: "Production quality and cultural authenticity. CO2 cannons, confetti, immersive lighting, and headline DJ lineups." },
              { q: "How do I buy tickets for the next Baila Dembow event?", a: "Tickets are available through bailadembow.com/agenda, as well as on Fatsoma, Skiddle, Eventbrite, and TicketSwap." }
            ].map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-2">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-20 bg-gradient-to-br from-[#FF0080] to-[#7F00FF] rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl mb-4">🎟️ SECURE YOUR SPOT BEFORE IT'S GONE</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
            Baila Dembow doesn't do empty dance floors or second chances. Every event sells out.
          </p>
          <a 
            href="https://linktr.ee/bailadembow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#FF0080] font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300"
          >
            <Ticket size={20} />
            GET YOUR TICKETS NOW
          </a>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <h3 className="font-display text-3xl md:text-4xl mb-4 text-center">
            WORK <span className="gradient-text">WITH US</span>
          </h3>
          <p className="text-gray-600 text-center mb-8">
            For bookings, partnerships, venue collaborations and press — reach out to the Baila Dembow team.
          </p>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="name" value={contactForm.name} onChange={handleContactChange} placeholder="Your Name *" className="input-styled w-full" required data-testid="about-contact-name" />
              <input type="email" name="email" value={contactForm.email} onChange={handleContactChange} placeholder="Your Email *" className="input-styled w-full" required data-testid="about-contact-email" />
            </div>
            <select name="subject" value={contactForm.subject} onChange={handleContactChange} className="input-styled w-full" data-testid="about-contact-subject">
              <option value="Booking">Booking</option>
              <option value="Partnership">Partnership</option>
              <option value="Press">Press</option>
              <option value="Other">Other</option>
            </select>
            <textarea name="message" value={contactForm.message} onChange={handleContactChange} placeholder="Your Message *" rows={5} className="input-styled w-full resize-none" required data-testid="about-contact-message" />
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300" data-testid="about-contact-submit">
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
          
          <div className="flex justify-center gap-6 mt-8 text-sm text-gray-600">
            <a href="https://www.instagram.com/baila.dembow/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#FF0080] transition-colors">
              <Instagram size={18} /> @baila.dembow
            </a>
            <span className="flex items-center gap-2">
              <Mail size={18} /> ask@housedecoded.com
            </span>
          </div>
        </div>

        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};
