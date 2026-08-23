"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { Inventory as InventoryData, InventoryItem } from "@/lib/inventory";

/**
 * THE INVENTORY (DESIGN-PLAN §6.4).
 *
 * The six domains are NOT peers — 65 / 16 / 3 / 12 / 17 items — and the design
 * prints that rather than padding it. "Minding 3" is shown at full dignity: an
 * honest tiny number in a beautiful setting reads as candour, whereas hiding it
 * behind an equal-width tab reads as concealment.
 *
 * The reading is a CSS multi-column FLOW, not a grid. A two-item group in a
 * flow is simply two lines; a two-item cell in a 6-up grid is visibly broken.
 * That single decision is why the uneven distribution stops being a layout
 * problem at all.
 *
 * All 139 FontAwesome classes are discarded. `fa-solid fa-knife-kitchen`
 * communicates nothing to a screen reader that the word "Kitchen" does not, and
 * nothing kills the stock-travel-theme look faster than deleting the icon grid.
 */
export function Inventory({
  data,
  villaName,
  beat,
}: {
  data: InventoryData;
  villaName: string;
  /** Beat number in the page's numbered spine, e.g. "04". Omit off-spine. */
  beat?: string;
}) {
  const [active, setActive] = useState(data.groups[0]?.clause ?? "");
  const reduced = useReducedMotion();
  const group = data.groups.find((g) => g.clause === active) ?? data.groups[0];

  return (
    <section className="canon inventory">
      {/*
        Deliberately NOT a clause. The group rail below already speaks the
        grammar six times, and the first group is itself "Living" — reusing the
        brand's core clause as a section header on top of that would dilute the
        device rather than deploy it. Clause density is the thing that keeps the
        signature powerful, so this beat spends none.
      */}
      <p className="micro">{beat ? `${beat} — ` : ""}The Inventory</p>
      <h2 className="display c2 inventory-heading">
        <span className="tabular">{data.total}</span> provisions
      </h2>

      <div className="inventory-body">
        {/* Group rail — the site's grammar, with the count as the tail. */}
        <nav className="inventory-rail" aria-label={`${villaName} inventory groups`}>
          <ul>
            {data.groups.map((g) => {
              const isActive = g.clause === active;
              return (
                <li key={g.clause}>
                  <button
                    type="button"
                    className={`inventory-group${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActive(g.clause)}
                  >
                    <span className="display c4 inventory-group-name">{g.clause}</span>
                    <span className="tabular inventory-count">{g.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {group ? (
          <motion.div
            key={group.clause}
            className="inventory-flow"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.25 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {group.subgroups.map((sg) => (
              <div key={sg.name} className="inventory-subgroup">
                <p className="micro inventory-subgroup-name">{sg.name}</p>
                <ul className="inventory-items">
                  {sg.items.map((item) => (
                    <InventoryLine key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Presence is expressed by the item simply being printed — no bullets, no
 * checkmarks, no cards. Only the items that carry a real description are
 * interactive, and those are real buttons so they work by tap, click AND
 * keyboard rather than by hover alone.
 */
function InventoryLine({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);

  if (!item.description) {
    return (
      <li className="inventory-item">
        {item.name}
        {item.value ? (
          <>
            {" · "}
            <span className="tabular">{item.value}</span>
          </>
        ) : null}
      </li>
    );
  }

  /*
   * `aria-controls` + a real panel id, matching the pattern the register
   * already uses. Before this the button announced "expanded" and named
   * nothing it had expanded — a screen-reader user was told a state had
   * changed and not what changed. The panel also stays in the DOM and is
   * `hidden`, rather than being conditionally rendered, so the relationship
   * the id declares is always true.
   */
  const panelId = `inv-${item.id}`;

  return (
    <li className="inventory-item">
      <button
        type="button"
        className="inventory-item-button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {item.name}
        {item.value ? (
          <>
            {" · "}
            <span className="tabular">{item.value}</span>
          </>
        ) : null}
      </button>
      <span id={panelId} className="inventory-item-panel" hidden={!open}>
        <span className="caption inventory-item-desc">{item.description}</span>
        {/* The second registry text, when there is one. See T4-7. */}
        {item.extra ? (
          <span className="caption inventory-item-extra">{item.extra}</span>
        ) : null}
      </span>
    </li>
  );
}
