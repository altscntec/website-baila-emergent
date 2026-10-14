'use strict';
// The single scoring rule. Identical for every language and theme.
const QUESTIONS_PER_ATTEMPT = 5;
const THEMES = ['movies', 'facts', 'spells', 'music'];
const TIERS = [5, 10, 15];

const tierForScore = (score) => {
  if (!Number.isInteger(score) || score < 0 || score > QUESTIONS_PER_ATTEMPT) throw new RangeError('score out of range');
  if (score <= 2) return 5;
  if (score <= 4) return 10;
  return 15;
};

module.exports = { tierForScore, QUESTIONS_PER_ATTEMPT, THEMES, TIERS };
