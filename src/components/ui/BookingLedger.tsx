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
export function BookingLedger({ host, villaName }: BookingLedgerProps) {
  const [checkin, setCheckin] = useState("");
  const [nights, setNights] = useState(5);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const href = useMemo(() => {
    const url = new URL(`https://${host}/`);
    const p = url.searchParams;
    if (checkin) p.set("checkin", checkin);
    p.set("nights", String(nights));
    p.set("adults", String(adults));
    p.set("children", String(children));
    // The engine renders in Greek without this.
    p.set("lang", "en");
    return url.toString();
  }, [host, checkin, nights, adults, children]);

  const today = new Date().toISOString().slice(0, 10);

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
