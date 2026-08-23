"use client";

import { useMemo, useState } from "react";

export interface BookingLedgerProps {
  /** Built server-side from content/booking.json. */
  host: string;
  /** Shown in the left slot on a villa page. */
  villaName?: string;
}

/**
 * THE LEDGER (DESIGN-PLAN §7).
 *
 * Not a widget bolted onto the page: it is set in the same micro-label register
 * as every other label on the site, on --basalt, with the datum rule along its
 * top edge — the same 1px --pelagos line that runs through the hero and the
 * collection. Four fields, no icons, no rounded pill, no drop shadow.
 *
 * The engine takes a child COUNT only — there is no per-child ages parameter —
 * so no ages UI is offered (T-155/booking.json).
 */
/** A starting position for the nights field. See the note where it is used. */
const DEFAULT_NIGHTS = 5;

export function BookingLedger({ host, villaName }: BookingLedgerProps) {
  const [checkin, setCheckin] = useState("");
  /*
   * FIVE IS A UI DEFAULT, NOT A MINIMUM STAY.
   *
   * The registry states no minimum stay for any villa — `villas/2142.json`
   * records explicitly that "no cancellation policy, deposit, minimum stay,
   * house rules, pet policy, smoking policy or children policy is stated
   * anywhere". So there is nothing to seed this from, and seeding it from an
   * invented minimum would be putting a policy on the page that the property
   * has never stated (T4-4).
   *
   * Five nights is a sensible starting position for a villa search and nothing
   * more. It is named here so it reads as the arbitrary choice it is, and the
   * real minimum stay is on the owner-pending list.
   */
  const [nights, setNights] = useState(DEFAULT_NIGHTS);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const today = new Date().toISOString().slice(0, 10);

  /*
   * `min={today}` on the input stops the PICKER offering a past date. It does
   * not stop a typed one — a date input accepts keyboard entry, and this bar
   * builds its URL in an effect rather than on form submit, so browser
   * validation never runs.
   *
   * And the engine will not catch it either: a past `checkin` is accepted
   * silently, returns 200, and shows nothing (verified live, 2026-08-23). So
   * the date is dropped here, and the visitor arrives on the engine's own date
   * picker instead of on an empty result they cannot explain.
   */
  const usableCheckin = checkin && checkin >= today ? checkin : "";

  const href = useMemo(() => {
    const url = new URL(`https://${host}/`);
    const p = url.searchParams;
    if (usableCheckin) p.set("checkin", usableCheckin);
    p.set("nights", String(nights));
    p.set("adults", String(adults));
    p.set("children", String(children));
    /*
     * The engine content-negotiates on Accept-Language: a Greek browser gets
     * Greek, a client with no preference gets Croatian. `lang` pins it.
     */
    p.set("lang", "en");
    return url.toString();
  }, [host, usableCheckin, nights, adults, children]);

  return (
    <div className="ledger on-dark">
      <div className="ledger-inner">
        {villaName ? (
          <div className="ledger-slot ledger-slot--name">
            <span className="micro">Villa</span>
            <span className="ledger-value">{villaName}</span>
          </div>
        ) : null}

        <div className="ledger-slot">
          <label className="micro" htmlFor="ledger-checkin">
            Arriving
          </label>
          <input
            id="ledger-checkin"
            type="date"
            min={today}
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            className="ledger-input tabular"
          />
        </div>

        <div className="ledger-slot">
          <label className="micro" htmlFor="ledger-nights">
            Nights
          </label>
          <input
            id="ledger-nights"
            type="number"
            min={1}
            max={60}
            value={nights}
            onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
            className="ledger-input tabular"
          />
        </div>

        <div className="ledger-slot">
          <label className="micro" htmlFor="ledger-adults">
            Adults
          </label>
          <input
            id="ledger-adults"
            type="number"
            min={1}
            max={18}
            value={adults}
            onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
            className="ledger-input tabular"
          />
        </div>

        <div className="ledger-slot">
          <label className="micro" htmlFor="ledger-children">
            Children
          </label>
          <input
            id="ledger-children"
            type="number"
            min={0}
            max={12}
            value={children}
            onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
            className="ledger-input tabular"
          />
        </div>

        <a
          className="ledger-submit micro"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reserve
        </a>
      </div>
    </div>
  );
}
