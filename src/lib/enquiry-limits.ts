/**
 * THE ENQUIRY FORM'S SIZE LIMITS — one source for the browser and the server.
 *
 * Today only the browser enforces them (`EnquiryForm.tsx`), because there is no
 * server route: the form validates and delivers nothing until a mail provider
 * is wired. The route that eventually sends MUST check them again — a browser
 * limit is a courtesy to the guest, not a control, since anyone can post
 * whatever they like to an endpoint. Keeping both on this one object is what
 * stops the two from drifting apart.
 *
 * Generous on purpose: a real enquiry about a wedding runs long, and losing one
 * costs more than a large message does.
 */
export const ENQUIRY_LIMITS = {
  name: 120,
  /* The SMTP path limit (RFC 5321 §4.5.3.1.3), less the angle brackets. */
  email: 254,
  subject: 120,
  message: 5000,
} as const;
