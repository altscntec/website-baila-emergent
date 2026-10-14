'use strict';
const { normalizeEmail } = require('./normalize');
const { COUNTRY_SET } = require('./countries');
const { sanitizeAttribution } = require('./attribution');

const LANGS = ['en', 'es', 'nl'];
const GENDERS = ['woman', 'man', 'non_binary', 'self_describe', 'prefer_not_to_say'];
const CONTROL = /[\u0000-\u001f\u007f<>]/;

const clean = (s) => (typeof s === 'string' ? s.normalize('NFC').replace(/\s+/g, ' ').trim() : '');

// Returns { ok, errors: {field: code}, value }. Codes are stable keys the browser
// localises; the server never returns prose.
const validateSignup = (input) => {
  const errors = {};
  const i = input && typeof input === 'object' ? input : {};

  const language = LANGS.includes(i.language) ? i.language : null;
  if (!language) errors.language = 'invalid';

  const fullName = clean(i.fullName);
  if (fullName.length < 2 || fullName.length > 100 || CONTROL.test(fullName)) errors.fullName = fullName ? 'invalid' : 'required';

  const emailNorm = normalizeEmail(i.email);
  if (!emailNorm) errors.email = i.email ? 'invalid' : 'required';

  // Age: an integer, as a number or a plain digit string. 18+ enforced here, not only in the browser.
  let age = null;
  if (typeof i.age === 'number' && Number.isInteger(i.age)) age = i.age;
  else if (typeof i.age === 'string' && /^\d{1,3}$/.test(i.age.trim())) age = parseInt(i.age.trim(), 10);
  if (age === null) errors.age = i.age === undefined || i.age === '' || i.age === null ? 'required' : 'invalid';
  else if (age < 18) errors.age = 'under_18';
  else if (age > 120) errors.age = 'invalid';

  const gender = GENDERS.includes(i.gender) ? i.gender : null;
  if (!gender) errors.gender = i.gender ? 'invalid' : 'required';
  let genderSelf = null;
  if (gender === 'self_describe') {
    genderSelf = clean(i.genderSelf);
    if (!genderSelf) errors.genderSelf = 'required';
    else if (genderSelf.length > 40 || CONTROL.test(genderSelf)) errors.genderSelf = 'invalid';
  }

  const city = clean(i.city);
  if (!city) errors.city = 'required';
  else if (city.length > 80 || CONTROL.test(city)) errors.city = 'invalid';

  const country = typeof i.country === 'string' ? i.country.trim().toUpperCase() : '';
  if (!country) errors.country = 'required';
  else if (!COUNTRY_SET.has(country)) errors.country = 'invalid';

  if (i.acceptTerms !== true) errors.acceptTerms = 'required';

  const marketingOptIn = i.marketingOptIn === true; // anything but literal true is "no"

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    value: ok
      ? {
          language, fullName, email: String(i.email).trim(), emailNorm, age, gender, genderSelf,
          city, country, marketingOptIn, attribution: sanitizeAttribution(i.attribution),
        }
      : null,
  };
};

module.exports = { validateSignup, LANGS, GENDERS };
