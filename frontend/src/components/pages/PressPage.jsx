import { Mail, Instagram } from 'lucide-react';

export const PressPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <h1 className="font-display text-4xl md:text-6xl mb-8 text-center">
          BAILA DEMBOW<br /><span className="gradient-text">PRESS & MEDIA</span>
        </h1>
        
        <div className="max-w-3xl mx-auto">
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">About Baila Dembow</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Baila Dembow is the leading Latin Event organizer in the Netherlands, pioneering the 
              Reggaeton and Dembow party scene in Amsterdam, Rotterdam, and beyond. Founded as a 
              cultural movement, we bring authentic Caribbean music experiences to European audiences.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our Latin Party events feature world-class sound systems, professional dancers, CO2 blasts, 
              confetti drops, and an atmosphere that transports attendees to the heart of Latin America. 
              We've hosted thousands of party-goers and continue to grow as the premier Latin Event 
              brand in the Netherlands.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">Key Facts</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Founded:</strong> 2018, Amsterdam</li>
              <li>• <strong>Event Types:</strong> Reggaeton, Dembow, Latin Party</li>
              <li>• <strong>Cities:</strong> Amsterdam, Rotterdam, Leiden, European expansion</li>
              <li>• <strong>Venue Capacity:</strong> 500-2000+ attendees</li>
              <li>• <strong>Community:</strong> 25K+ members</li>
              <li>• <strong>Parent Company:</strong> House Decoded Events (KVK 67994725)</li>
            </ul>
          </section>
          
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">Contact</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">• <strong>Press Inquiries:</strong> <Mail size={16} className="inline" /> ask@housedecoded.com</li>
              <li className="flex items-center gap-2">• <strong>Instagram:</strong> <Instagram size={16} className="inline" /> @baila.dembow</li>
              <li>• <strong>Facebook:</strong> facebook.com/baila.dembow</li>
              <li>• <strong>TikTok:</strong> @baila.dembow</li>
              <li>• <strong>YouTube:</strong> @baila.dembow</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-display text-2xl mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {['Latin Event Amsterdam', 'Latin Event Netherlands', 'Latin Party', 'Dembow', 
                'Reggaeton', 'Latin Event Rotterdam', 'Reggaeton Amsterdam', 'Latin Club Amsterdam',
                'Dembow Party', 'Caribbean Party Netherlands'].map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{tag}</span>
              ))}
            </div>
          </section>
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
