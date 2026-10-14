import { useEffect, useState } from 'react';

// Privacy notice (EN / ES / NL). Covers the Halloween quiz and the website's cookies. The controller details
// are the ones already published on the Press page (House Decoded Events, KVK 67994725, ask@housedecoded.com).
// The retention period is an owner setting served by /api/quiz/config; until it is set the notice says
// "a limited period" instead of inventing a number.
const LANG_KEY = 'bd_quiz_lang';
const NAMES = { en: 'English', es: 'Español', nl: 'Nederlands' };

const C = (retention) => ({
  en: {
    title: 'Privacy notice', updated: 'Last updated 13 October 2026',
    sections: [
      { h: 'Who is responsible', p: ['Baila Dembow is a brand of House Decoded Events (KVK 67994725), the controller of your data. Contact: ask@housedecoded.com.'] },
      { h: 'The Halloween quiz: what we collect and why', p: ['To run the quiz and deliver your reward we collect: your full name, email address, age, sex/gender answer (including "Prefer not to say"), city, country and chosen language; your assigned theme, questions, answers, score and discount tier; the discount code issued to you; and campaign parameters from the link you came from (for example utm_source and utm_campaign).'], ul: ['Running the quiz, verifying your email, scoring and sending your discount code (needed to deliver what you asked for).', 'Preventing abuse, such as repeat entries, and keeping the service secure (our legitimate interest). We keep your IP address only transiently for rate limiting, as a one-way hash.', 'Understanding which campaigns lead to ticket sales, using aggregate statistics.'] },
      { h: 'Promotional emails are optional', p: ['The separate checkbox is unticked by default. If you tick it we add you to our promotional list for future events and offers. Declining never affects your participation or your discount. You can unsubscribe at any time using the link in our emails, or by writing to us. We store the exact wording you saw, its version, the language and the time of your choice.'] },
      { h: 'Who receives your data', p: ['We use service providers who process data on our instructions: Vercel (hosting), our database provider, and Resend (sending email). Weeztix, our ticket shop, only sees the discount code when you use it at checkout. If you accept marketing cookies, Meta, TikTok and Google receive standard website events (never your name, email, answers or code). Some providers process data outside the EEA under appropriate safeguards.'] },
      { h: 'How long we keep it', p: [retention ? `We delete quiz data ${retention} days after the campaign closes, unless you opted in to promotional emails; then we keep it until you unsubscribe.` : 'We keep quiz data for a limited period after the campaign closes, unless you opted in to promotional emails; then we keep it until you unsubscribe.'] },
      { h: 'Cookies and local storage', p: ['The quiz uses one strictly necessary, HttpOnly session cookie so you can resume your attempt, and stores your language and music-mute choice in your browser. Analytics and marketing cookies load only if you accept them in the cookie banner; you can change this at any time via Cookie settings.'] },
      { h: 'Your rights', p: ['You can ask us to access, correct or delete your data, restrict or object to its use, receive a copy, or withdraw consent at any time. Email ask@housedecoded.com. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). The discount tier is calculated automatically from your score; it has no other effect on you.'] },
      { h: 'Age', p: ['The quiz is for people aged 18 or over.'] },
    ],
  },
  es: {
    title: 'Aviso de privacidad', updated: 'Última actualización: 13 de octubre de 2026',
    sections: [
      { h: 'Quién es el responsable', p: ['Baila Dembow es una marca de House Decoded Events (KVK 67994725), responsable del tratamiento de tus datos. Contacto: ask@housedecoded.com.'] },
      { h: 'El quiz de Halloween: qué recogemos y por qué', p: ['Para gestionar el quiz y entregarte tu recompensa recogemos: tu nombre completo, email, edad, respuesta de sexo/género (incluida "Prefiero no decirlo"), ciudad, país e idioma elegido; tu tema asignado, preguntas, respuestas, puntuación y nivel de descuento; el código de descuento emitido; y parámetros de campaña del enlace por el que llegaste (por ejemplo utm_source y utm_campaign).'], ul: ['Gestionar el quiz, verificar tu email, puntuar y enviarte tu código (necesario para darte lo que has pedido).', 'Evitar abusos, como participaciones repetidas, y mantener el servicio seguro (nuestro interés legítimo). Guardamos tu IP solo de forma transitoria para limitar peticiones, como un hash irreversible.', 'Entender qué campañas generan venta de entradas, mediante estadísticas agregadas.'] },
      { h: 'Los emails promocionales son opcionales', p: ['La casilla separada viene desmarcada. Si la marcas, te añadimos a nuestra lista promocional de futuros eventos y ofertas. Rechazarla nunca afecta a tu participación ni a tu descuento. Puedes darte de baja cuando quieras con el enlace de nuestros emails o escribiéndonos. Guardamos el texto exacto que viste, su versión, el idioma y la hora de tu elección.'] },
      { h: 'Quién recibe tus datos', p: ['Usamos proveedores que tratan datos siguiendo nuestras instrucciones: Vercel (alojamiento), nuestro proveedor de base de datos y Resend (envío de emails). Weeztix, nuestra tienda de entradas, solo ve el código de descuento cuando lo usas al pagar. Si aceptas las cookies de marketing, Meta, TikTok y Google reciben eventos estándar del sitio (nunca tu nombre, email, respuestas ni código). Algunos proveedores tratan datos fuera del EEE con garantías adecuadas.'] },
      { h: 'Cuánto tiempo los conservamos', p: [retention ? `Eliminamos los datos del quiz ${retention} días después del cierre de la campaña, salvo que hayas aceptado los emails promocionales; en ese caso los conservamos hasta que te des de baja.` : 'Conservamos los datos del quiz durante un periodo limitado tras el cierre de la campaña, salvo que hayas aceptado los emails promocionales; en ese caso los conservamos hasta que te des de baja.'] },
      { h: 'Cookies y almacenamiento local', p: ['El quiz usa una cookie de sesión estrictamente necesaria y HttpOnly para que puedas retomar tu intento, y guarda en tu navegador tu idioma y si silenciaste la música. Las cookies de analítica y marketing solo se cargan si las aceptas en el aviso de cookies; puedes cambiarlo cuando quieras en Ajustes de cookies.'] },
      { h: 'Tus derechos', p: ['Puedes pedirnos acceder a tus datos, corregirlos o eliminarlos, limitar u oponerte a su uso, recibir una copia o retirar tu consentimiento en cualquier momento. Escribe a ask@housedecoded.com. También puedes reclamar ante la autoridad neerlandesa de protección de datos (Autoriteit Persoonsgegevens). El nivel de descuento se calcula automáticamente a partir de tu puntuación y no tiene ningún otro efecto sobre ti.'] },
      { h: 'Edad', p: ['El quiz es para personas de 18 años o más.'] },
    ],
  },
  nl: {
    title: 'Privacyverklaring', updated: 'Laatst bijgewerkt: 13 oktober 2026',
    sections: [
      { h: 'Wie is verantwoordelijk', p: ['Baila Dembow is een merk van House Decoded Events (KVK 67994725), de verwerkingsverantwoordelijke voor je gegevens. Contact: ask@housedecoded.com.'] },
      { h: 'De Halloween-quiz: wat we verzamelen en waarom', p: ['Om de quiz uit te voeren en je beloning te bezorgen verzamelen we: je volledige naam, e-mailadres, leeftijd, antwoord over geslacht/gender (inclusief "Zeg ik liever niet"), stad, land en gekozen taal; je toegewezen thema, vragen, antwoorden, score en kortingsniveau; de aan jou uitgegeven kortingscode; en campagneparameters uit de link waarmee je kwam (bijvoorbeeld utm_source en utm_campaign).'], ul: ['De quiz uitvoeren, je e-mail verifiëren, scoren en je kortingscode versturen (nodig om te leveren waar je om vroeg).', 'Misbruik voorkomen, zoals herhaalde deelnames, en de dienst veilig houden (ons gerechtvaardigd belang). Je IP-adres bewaren we alleen kortstondig voor limieten op aanvragen, als eenrichtings-hash.', 'Begrijpen welke campagnes tot kaartverkoop leiden, met geaggregeerde statistieken.'] },
      { h: 'Reclamemails zijn optioneel', p: ['Het aparte selectievakje staat standaard uit. Vink je het aan, dan zetten we je op onze lijst voor toekomstige evenementen en aanbiedingen. Weigeren heeft nooit invloed op je deelname of je korting. Je kunt je altijd uitschrijven via de link in onze e-mails of door ons te mailen. We bewaren de exacte tekst die je zag, de versie, de taal en het tijdstip van je keuze.'] },
      { h: 'Wie je gegevens ontvangt', p: ['We gebruiken dienstverleners die gegevens op onze instructie verwerken: Vercel (hosting), onze databaseleverancier en Resend (e-mail versturen). Weeztix, onze ticketshop, ziet alleen de kortingscode wanneer je die bij het afrekenen gebruikt. Accepteer je marketingcookies, dan ontvangen Meta, TikTok en Google standaard websitegebeurtenissen (nooit je naam, e-mail, antwoorden of code). Sommige leveranciers verwerken gegevens buiten de EER met passende waarborgen.'] },
      { h: 'Hoe lang we ze bewaren', p: [retention ? `We verwijderen quizgegevens ${retention} dagen nadat de actie is gesloten, tenzij je reclamemails hebt geaccepteerd; dan bewaren we ze tot je je uitschrijft.` : 'We bewaren quizgegevens een beperkte tijd nadat de actie is gesloten, tenzij je reclamemails hebt geaccepteerd; dan bewaren we ze tot je je uitschrijft.'] },
      { h: 'Cookies en lokale opslag', p: ['De quiz gebruikt één strikt noodzakelijke, HttpOnly sessiecookie zodat je je poging kunt hervatten, en bewaart je taalkeuze en of je de muziek hebt gedempt in je browser. Analytische en marketingcookies laden alleen als je ze accepteert in de cookiebanner; je kunt dit altijd wijzigen via Cookie-instellingen.'] },
      { h: 'Je rechten', p: ['Je kunt ons vragen om inzage, correctie of verwijdering van je gegevens, beperking van of bezwaar tegen het gebruik, een kopie, of je kunt je toestemming op elk moment intrekken. Mail naar ask@housedecoded.com. Je kunt ook klagen bij de Autoriteit Persoonsgegevens. Het kortingsniveau wordt automatisch uit je score berekend en heeft verder geen gevolgen voor je.'] },
      { h: 'Leeftijd', p: ['De quiz is voor mensen van 18 jaar of ouder.'] },
    ],
  },
});

export const PrivacyPage = () => {
  const [lang, setLang] = useState(() => { try { const l = localStorage.getItem(LANG_KEY); return NAMES[l] ? l : 'en'; } catch (_) { return 'en'; } });
  const [retention, setRetention] = useState(null);
  useEffect(() => {
    fetch('/api/quiz/config').then((r) => (r.ok ? r.json() : null)).then((c) => { if (c && c.retentionDays) setRetention(c.retentionDays); }).catch(() => {});
  }, []);
  const doc = C(retention)[lang];
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="privacy-page">
      <div className="container-custom py-16">
        <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Language">
          {Object.keys(NAMES).map((l) => (
            <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch (_) { /* ignore */ } }}
              className={`px-4 py-2 rounded-full text-sm font-bold border ${l === lang ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-300'}`}>{NAMES[l]}</button>
          ))}
        </div>
        <h1 className="font-display text-4xl md:text-6xl mb-4 text-center text-white">{doc.title.toUpperCase()}</h1>
        <p className="text-center text-gray-500 text-sm mb-16">{doc.updated}</p>
        <div className="max-w-3xl mx-auto space-y-10" lang={lang}>
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl text-white mb-4">{s.h}</h2>
              {s.p.map((x) => <p key={x} className="text-gray-400 leading-relaxed mb-3">{x}</p>)}
              {s.ul && <ul className="space-y-2 text-gray-400 leading-relaxed">{s.ul.map((x) => <li key={x}>• {x}</li>)}</ul>}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
