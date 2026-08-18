"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE ENQUIRY FORM — UI AND VALIDATION ONLY.
 *
 * There is no mail provider wired and no key anywhere in this repository. The
 * submit handler is a deliberate stub: it validates, shows the success state,
 * and does not pretend to have sent anything. A form that silently discards an
 * enquiry is worse than a form that admits it is not connected yet, so the
 * success state says so plainly.
 *
 * Accessibility is the design, not a pass afterwards: every field has a real
 * label, errors are announced through aria-describedby and aria-invalid, the
 * error summary takes focus on failure, and nothing depends on colour alone.
 *
 * The honeypot is a real field, visually hidden and out of the tab order, never
 * `display: none` — bots read the DOM, and a hidden-but-focusable field would
 * trap keyboard users in an invisible input.
 */
type Errors = Partial<Record<"name" | "email" | "message", string>>;

export function EnquiryForm({
  consentText,
  subject,
}: {
  consentText?: string;
  /** Preselected villa or estate, from an `?enquiry=` param on the CTA. */
  subject?: string;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  /*
   * Focus the error summary AFTER React has rendered it.
   *
   * The first version called `document.getElementById(...).focus()` inside the
   * submit handler, immediately after `setErrors`. React had not rendered the
   * summary yet, so the element did not exist and the focus call silently did
   * nothing — a screen-reader user submitting an empty form got an alert with
   * no landing point, which is the whole reason the summary exists. Caught by
   * asserting focus rather than asserting the summary was visible.
   */
  useEffect(() => {
    if (Object.keys(errors).length) summaryRef.current?.focus();
  }, [errors]);

  function validate(form: HTMLFormElement): Errors {
    const data = new FormData(form);
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name) next.name = "Please tell us your name.";
    // Deliberately permissive. The only address this rejects with confidence is
    // one missing an @ or a dot after it. Stricter patterns reject real
    // addresses, and losing a genuine enquiry costs more than catching a typo.
    if (!email) next.email = "We need an email address to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "That address looks incomplete.";
    if (!message) next.message = "Tell us what you would like to arrange.";
    return next;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // Honeypot: a real person never fills this.
    if (String(new FormData(form).get("company") ?? "")) return;

    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return; // focus is handled after render
    setSent(true);
  }

  if (sent) {
    return (
      <div className="d-form-sent" role="status">
        <p className="micro d-exp-mark">Thank you</p>
        <p className="d-villa-lede">
          We have your note. Someone who knows the place will answer it.
        </p>
        <p className="small d-form-stub">
          <strong>Not yet connected.</strong> The mail provider lands after launch; until then
          this form validates but does not deliver. Please write to us directly in the meantime.
        </p>
      </div>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form className="d-form" onSubmit={onSubmit} noValidate>
      <p className="micro d-exp-mark">Send a note</p>

      {errorList.length ? (
        <div
          id="enquiry-errors"
          ref={summaryRef}
          className="d-form-errors"
          role="alert"
          tabIndex={-1}
        >
          <p className="small">
            {errorList.length === 1
              ? "One field needs attention:"
              : `${errorList.length} fields need attention:`}
          </p>
          <ul className="small">
            {errorList.map(([k, v]) => (
              <li key={k}>
                <a href={`#f-${k}`}>{v}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {subject ? (
        <div className="d-field">
          <label className="micro" htmlFor="f-subject">
            About
          </label>
          <input id="f-subject" name="subject" type="text" defaultValue={subject} readOnly />
        </div>
      ) : null}

      <div className="d-field">
        <label className="micro" htmlFor="f-name">
          Your name
        </label>
        <input
          id="f-name"
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "e-name" : undefined}
        />
        {errors.name ? (
          <span id="e-name" className="caption d-field-error">
            {errors.name}
          </span>
        ) : null}
      </div>

      <div className="d-field">
        <label className="micro" htmlFor="f-email">
          Email
        </label>
        <input
          id="f-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "e-email" : undefined}
        />
        {errors.email ? (
          <span id="e-email" className="caption d-field-error">
            {errors.email}
          </span>
        ) : null}
      </div>

      <div className="d-field">
        <label className="micro" htmlFor="f-message">
          What would you like to arrange?
        </label>
        <textarea
          id="f-message"
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "e-message" : undefined}
        />
        {errors.message ? (
          <span id="e-message" className="caption d-field-error">
            {errors.message}
          </span>
        ) : null}
      </div>

      {/* Honeypot. Visually hidden, out of the tab order, never display:none. */}
      <div className="d-honey" aria-hidden="true">
        <label htmlFor="f-company">Company</label>
        <input id="f-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {consentText ? <p className="caption d-form-consent">{consentText}</p> : null}

      <p className="d-villa-cta">
        <button type="submit" className="btn-primary micro">
          Send
        </button>
      </p>
      <p className="caption d-form-stub">
        Not yet connected to a mail provider — see DEPLOY.md. Validation works; delivery lands
        after launch.
      </p>
    </form>
  );
}
