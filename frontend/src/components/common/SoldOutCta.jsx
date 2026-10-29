import { Ban, ShieldAlert, Sparkles } from 'lucide-react';

export const H27_SIGNUP_PATH = '/halloween/2027';
export const RESELLER_WARNING =
  'No more tickets are available. If you still want to come, only buy from a reputable reseller such as TicketSwap and be aware of fake tickets: never pay strangers by bank transfer.';

// Replaces every "GET TICKETS" button for an event flagged `sold_out: true` in constants.js.
// tone="dark" for black sections, tone="light" for white cards. compact=true drops the warning
// copy (used in tight card layouts where the warning is shown elsewhere on the page).
export const SoldOutCta = ({ tone = 'dark', compact = false, align = 'left', testId = 'sold-out-cta' }) => {
  const dark = tone === 'dark';
  const alignCls = align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-center md:items-end text-center md:text-right' : 'items-start text-left';
  return (
    <div className={`flex flex-col gap-3 ${alignCls}`} data-testid={testId}>
      <span
        className={`inline-flex items-center gap-2 font-extrabold uppercase tracking-wider text-sm px-5 py-3 rounded-full border ${
          dark ? 'bg-[#FF3B30]/15 text-[#FF6B60] border-[#FF3B30]/50' : 'bg-[#FF3B30]/10 text-[#D7261E] border-[#FF3B30]/40'
        }`}
        aria-label="Sold out. No tickets available."
      >
        <Ban size={16} /> Sold out · No tickets left
      </span>
      <a
        href={H27_SIGNUP_PATH}
        className={`inline-flex items-center gap-2 font-extrabold py-3.5 px-7 rounded-full transition-colors duration-300 ${
          dark ? 'bg-white text-black hover:bg-[#FF0080] hover:text-white' : 'bg-black text-white hover:bg-[#FF0080]'
        }`}
        data-testid={`${testId}-h27`}
      >
        <Sparkles size={18} /> Sign up for Halloween 2027
      </a>
      {!compact && (
        <p className={`flex items-start gap-2 text-xs md:text-sm leading-relaxed max-w-md ${dark ? 'text-white/70' : 'text-gray-600'}`}>
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#FF6B60]" />
          <span>{RESELLER_WARNING}</span>
        </p>
      )}
    </div>
  );
};
