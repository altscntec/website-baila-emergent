'use strict';
// Localised transactional emails (EN / ES / NL). Plain table layout with inline
// styles for broad client support. These are transactional: no promotional content.
const LOCALE = { en: 'en-GB', es: 'es-ES', nl: 'nl-NL' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (iso, lang) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(iso));
};

const S = {
  en: {
    brand: 'Baila Dembow',
    hi: (n) => `Hi ${n},`,
    signin: {
      verify_new: { subject: 'Confirm your email to receive your Halloween discount code', title: 'Confirm your email', intro: 'Nice one. You finished the Baila Dembow Halloween quiz. Confirm this email address and we will send your discount code to it right away.' },
      resume: { subject: 'Continue your Halloween quiz', title: 'Pick up where you left off', intro: 'Use the button below to sign in and continue your Halloween quiz. Your questions and answers are saved.' },
      completed: { subject: 'Your Halloween quiz reward', title: 'You already played', intro: 'This email address has already completed the quiz, so it cannot be played again. Use the button below to see your result and request your reward email again.' },
      cta: 'Confirm and continue', codeLabel: 'Or enter this code on the quiz page',
      expires: (m) => `This link and code expire in ${m} minutes and work once.`,
      ignore: 'If you did not request this, you can safely ignore this email.',
    },
    reward: {
      subject: (t) => `Your Baila Dembow Halloween reward: ${t}% off`,
      title: (t) => `${t}% off your Halloween ticket`,
      score: (s) => `You scored ${s} out of 5.`,
      codeLabel: 'Your personal discount code',
      cta: 'Get your tickets',
      stepsTitle: 'How to redeem',
      steps: ['Tap the button below. The code is applied automatically at checkout.', 'If it is not, paste the code into the discount field at checkout.', 'Check that the discount shows before you pay.'],
      validUntil: (d) => `Valid until ${d} (Amsterdam time).`,
      eligible: (l) => `Valid for: ${l}.`,
      terms: 'Good to know',
      personal: 'This code is personal and can be used once. Please do not share it.',
      why: 'You are receiving this one-off message because you completed the Baila Dembow Halloween quiz. It is not a promotion and has no unsubscribe list attached.',
    },
  },
  es: {
    brand: 'Baila Dembow',
    hi: (n) => `Hola ${n},`,
    signin: {
      verify_new: { subject: 'Confirma tu email para recibir tu código de descuento de Halloween', title: 'Confirma tu email', intro: 'Bien hecho. Has terminado el quiz de Halloween de Baila Dembow. Confirma esta dirección y te enviaremos tu código de descuento enseguida.' },
      resume: { subject: 'Continúa tu quiz de Halloween', title: 'Sigue donde lo dejaste', intro: 'Usa el botón de abajo para entrar y continuar tu quiz de Halloween. Tus preguntas y respuestas están guardadas.' },
      completed: { subject: 'Tu recompensa del quiz de Halloween', title: 'Ya has jugado', intro: 'Este email ya completó el quiz, así que no se puede jugar otra vez. Usa el botón de abajo para ver tu resultado y pedir de nuevo el email con tu recompensa.' },
      cta: 'Confirmar y continuar', codeLabel: 'O introduce este código en la página del quiz',
      expires: (m) => `Este enlace y este código caducan en ${m} minutos y solo funcionan una vez.`,
      ignore: 'Si no lo solicitaste, puedes ignorar este email sin problema.',
    },
    reward: {
      subject: (t) => `Tu recompensa de Halloween de Baila Dembow: ${t}% de descuento`,
      title: (t) => `${t}% de descuento en tu entrada de Halloween`,
      score: (s) => `Has acertado ${s} de 5.`,
      codeLabel: 'Tu código de descuento personal',
      cta: 'Consigue tus entradas',
      stepsTitle: 'Cómo canjearlo',
      steps: ['Pulsa el botón de abajo. El código se aplica automáticamente al pagar.', 'Si no se aplica, pega el código en el campo de descuento al pagar.', 'Comprueba que aparece el descuento antes de pagar.'],
      validUntil: (d) => `Válido hasta el ${d} (hora de Ámsterdam).`,
      eligible: (l) => `Válido para: ${l}.`,
      terms: 'Conviene saber',
      personal: 'Este código es personal y se puede usar una sola vez. Por favor, no lo compartas.',
      why: 'Recibes este mensaje único porque completaste el quiz de Halloween de Baila Dembow. No es una promoción y no pertenece a ninguna lista de envíos.',
    },
  },
  nl: {
    brand: 'Baila Dembow',
    hi: (n) => `Hoi ${n},`,
    signin: {
      verify_new: { subject: 'Bevestig je e-mail om je Halloween-kortingscode te ontvangen', title: 'Bevestig je e-mailadres', intro: 'Goed gedaan. Je hebt de Baila Dembow Halloween-quiz afgerond. Bevestig dit e-mailadres en we sturen je kortingscode meteen.' },
      resume: { subject: 'Ga verder met je Halloween-quiz', title: 'Ga verder waar je gebleven was', intro: 'Gebruik de knop hieronder om in te loggen en je Halloween-quiz af te maken. Je vragen en antwoorden zijn bewaard.' },
      completed: { subject: 'Je beloning van de Halloween-quiz', title: 'Je hebt al gespeeld', intro: 'Met dit e-mailadres is de quiz al afgerond, dus je kunt hem niet opnieuw spelen. Gebruik de knop hieronder om je uitslag te bekijken en de beloningsmail opnieuw aan te vragen.' },
      cta: 'Bevestigen en doorgaan', codeLabel: 'Of vul deze code in op de quizpagina',
      expires: (m) => `Deze link en code verlopen over ${m} minuten en werken maar één keer.`,
      ignore: 'Heb je dit niet aangevraagd? Dan kun je deze e-mail gewoon negeren.',
    },
    reward: {
      subject: (t) => `Je Baila Dembow Halloween-beloning: ${t}% korting`,
      title: (t) => `${t}% korting op je Halloween-ticket`,
      score: (s) => `Je had ${s} van de 5 goed.`,
      codeLabel: 'Je persoonlijke kortingscode',
      cta: 'Koop je tickets',
      stepsTitle: 'Zo gebruik je hem',
      steps: ['Tik op de knop hieronder. De code wordt bij het afrekenen automatisch toegepast.', 'Gebeurt dat niet, plak de code dan in het kortingsveld bij het afrekenen.', 'Controleer of de korting zichtbaar is voordat je betaalt.'],
      validUntil: (d) => `Geldig tot ${d} (Amsterdamse tijd).`,
      eligible: (l) => `Geldig voor: ${l}.`,
      terms: 'Goed om te weten',
      personal: 'Deze code is persoonlijk en kan één keer worden gebruikt. Deel hem alsjeblieft niet.',
      why: 'Je ontvangt dit eenmalige bericht omdat je de Baila Dembow Halloween-quiz hebt afgerond. Het is geen reclame en er hoort geen mailinglijst bij.',
    },
  },
};

const layout = ({ lang, title, bodyHtml }) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#0b0610;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0610;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#1a1020;">
<tr><td style="background:linear-gradient(135deg,#FF0080 0%,#FF3B30 50%,#7F00FF 100%);background-color:#FF0080;padding:22px 24px;color:#ffffff;font-size:13px;letter-spacing:2px;font-weight:700;">BAILA DEMBOW &nbsp;·&nbsp; HALLOWEEN</td></tr>
<tr><td style="padding:28px 24px 8px 24px;">${bodyHtml}</td></tr>
</table></td></tr></table></body></html>`;

const button = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#FF0080;border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;">${esc(label)}</a></td></tr></table>`;

const firstName = (full) => String(full || '').trim().split(' ')[0] || '';

const signinEmail = ({ lang, kind, name, link, code, ttlMinutes }) => {
  const t = S[lang] || S.en; const k = t.signin[kind];
  const body = `
<h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.2;">${esc(k.title)}</h1>
<p style="margin:0 0 8px 0;font-size:16px;line-height:1.5;">${esc(t.hi(firstName(name)))}</p>
<p style="margin:0;font-size:16px;line-height:1.5;">${esc(k.intro)}</p>
${button(link, t.signin.cta)}
<p style="margin:0 0 6px 0;font-size:14px;color:#5b4a66;">${esc(t.signin.codeLabel)}</p>
<p style="margin:0 0 16px 0;font-family:Menlo,Consolas,monospace;font-size:30px;letter-spacing:6px;font-weight:700;">${esc(code)}</p>
<p style="margin:0 0 6px 0;font-size:13px;color:#5b4a66;">${esc(t.signin.expires(ttlMinutes))}</p>
<p style="margin:0 0 24px 0;font-size:13px;color:#5b4a66;">${esc(t.signin.ignore)}</p>`;
  const text = [t.hi(firstName(name)), '', k.intro, '', `${t.signin.cta}: ${link}`, `${t.signin.codeLabel}: ${code}`, '', t.signin.expires(ttlMinutes), t.signin.ignore].join('\n');
  return { subject: k.subject, html: layout({ lang, title: k.subject, bodyHtml: body }), text };
};

const rewardEmail = ({ lang, name, tier, score, code, link, codeExpiresAt, eligibleTickets, notes }) => {
  const t = S[lang] || S.en; const r = t.reward;
  const exp = fmtDate(codeExpiresAt, lang);
  const lines = [];
  if (exp) lines.push(r.validUntil(exp));
  if (eligibleTickets && eligibleTickets.length) lines.push(r.eligible(eligibleTickets.join(', ')));
  for (const n of notes || []) if (n) lines.push(n);
  lines.push(r.personal);
  const body = `
<h1 style="margin:0 0 12px 0;font-size:26px;line-height:1.2;">${esc(r.title(tier))}</h1>
<p style="margin:0 0 8px 0;font-size:16px;line-height:1.5;">${esc(t.hi(firstName(name)))}</p>
<p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">${esc(r.score(score))}</p>
<p style="margin:0 0 6px 0;font-size:14px;color:#5b4a66;">${esc(r.codeLabel)}</p>
<p style="margin:0 0 4px 0;padding:14px 16px;background:#f6eefb;border:2px dashed #7F00FF;border-radius:12px;font-family:Menlo,Consolas,monospace;font-size:26px;letter-spacing:3px;font-weight:700;text-align:center;">${esc(code)}</p>
${button(link, r.cta)}
<h2 style="margin:8px 0 8px 0;font-size:16px;">${esc(r.stepsTitle)}</h2>
<ol style="margin:0 0 16px 20px;padding:0;font-size:15px;line-height:1.5;">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2 style="margin:8px 0 8px 0;font-size:16px;">${esc(r.terms)}</h2>
<ul style="margin:0 0 16px 20px;padding:0;font-size:14px;line-height:1.5;color:#3a2a45;">${lines.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<p style="margin:0 0 24px 0;font-size:12px;color:#7a6a85;">${esc(r.why)}</p>`;
  const text = [t.hi(firstName(name)), '', r.title(tier), r.score(score), '', `${r.codeLabel}: ${code}`, `${r.cta}: ${link}`, '', r.stepsTitle, ...r.steps.map((s, i) => `${i + 1}. ${s}`), '', r.terms, ...lines.map((l) => `- ${l}`), '', r.why].join('\n');
  return { subject: r.subject(tier), html: layout({ lang, title: r.subject(tier), bodyHtml: body }), text };
};

// Owner alerts are English, short, and never contain personal data or codes.
const alertEmail = ({ kind, detail }) => {
  const subject = `[Baila Dembow quiz] Alert: ${kind}`;
  const text = `Alert: ${kind}\n\n${JSON.stringify(detail || {}, null, 2)}\n\nOpen the quiz admin to review.`;
  return { subject, text, html: `<pre style="font-family:Menlo,monospace;font-size:13px;">${esc(text)}</pre>` };
};

module.exports = { signinEmail, rewardEmail, alertEmail, fmtDate, esc, S };
