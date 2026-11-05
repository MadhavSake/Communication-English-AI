// ────────────────────────────────────────────────────────────────
// Fill in your real business details here. They appear on the
// Terms, Privacy, Refund and Contact pages (needed for Razorpay).
// Anything still in [square brackets] is shown with a warning.
// ────────────────────────────────────────────────────────────────
export const BUSINESS = {
  brand: 'EnglishAI',
  legalName: '[Registered business name]',
  email: '[support@yourdomain.com]',
  phone: '[+91 XXXXX XXXXX]',
  address: '[Full registered address, City, State, PIN]',
  city: '[City]', // courts for disputes
  state: '[State]',
  grievanceOfficer: '[Name of Grievance Officer]',
  grievanceEmail: '[grievance@yourdomain.com]',
  refundWindowDays: 7,
  refundProcessingDays: '5–7 working days',
  effectiveDate: '5 November 2026',
};

export const isPlaceholder = (v) => typeof v === 'string' && v.startsWith('[');
