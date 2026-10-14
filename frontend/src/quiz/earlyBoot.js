// Runs before React and before any analytics script can load.
// 1) The email verification link carries its one-time token in the URL FRAGMENT (#t=...). Fragments are never sent
//    to servers, but analytics tags can read the full URL, so the token is moved into memory and removed from the
//    address bar immediately.
// 2) Campaign parameters are captured for attribution.
let pendingToken = null;

export const takeVerificationToken = () => { const t = pendingToken; pendingToken = null; return t; };
export const peekVerificationToken = () => pendingToken;
export const setVerificationToken = (t) => { pendingToken = t; };

export const bootQuiz = () => {
  try {
    const { pathname, hash } = window.location;
    if (pathname.startsWith('/halloween/quiz') && hash) {
      const m = /[#&]t=([A-Za-z0-9_.-]{20,120})/.exec(hash);
      if (m) {
        pendingToken = m[1];
        window.history.replaceState(null, '', pathname + window.location.search);
      }
    }
  } catch (_) { /* never block rendering */ }
};
