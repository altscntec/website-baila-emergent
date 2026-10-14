// Thin client for the quiz API. Same-origin; the session lives in an HttpOnly cookie, so
// nothing sensitive (no token, no code) is ever readable by page scripts.
const BASE = process.env.REACT_APP_QUIZ_API_BASE || '';

export class ApiError extends Error {
  constructor(status, code, data) { super(code); this.status = status; this.code = code; this.data = data || {}; }
}

const call = async (method, path, body) => {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    throw new ApiError(0, 'network');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch (_) { /* empty or non-JSON */ }
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'server', data);
  return data;
};

export const quizApi = {
  config: () => call('GET', '/api/quiz/config'),
  ping: (metric, attribution, language) => call('POST', '/api/quiz/ping', { metric, attribution, language }).catch(() => null),
  signup: (payload) => call('POST', '/api/quiz/signup', payload),
  resend: (email, language) => call('POST', '/api/quiz/resend', { email, language }),
  verifyToken: (token) => call('POST', '/api/quiz/verify', { token }),
  verifyCode: (email, code) => call('POST', '/api/quiz/verify', { email, code }),
  state: (lang) => call('GET', `/api/quiz/state?lang=${encodeURIComponent(lang)}`),
  start: (language) => call('POST', '/api/quiz/start', { language }),
  answer: (questionId, optionId, language) => call('POST', '/api/quiz/answer', { questionId, optionId, language }),
  setLanguage: (language) => call('POST', '/api/quiz/language', { language }),
  resendReward: (language) => call('POST', '/api/quiz/resend-reward', { language }),
  logout: () => call('POST', '/api/quiz/logout', {}),
  unsubscribe: (token) => call('POST', '/api/quiz/unsubscribe', { token }),
};
