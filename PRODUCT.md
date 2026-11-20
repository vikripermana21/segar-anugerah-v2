# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Household buyers: low to medium frequency, small totals, pay by QRIS, shopping from a phone during a commute or at night.
- Restaurant and warung buyers: larger and repeating orders, want a saved address, order history, and reordering; often pay by Virtual Account. These repeat business buyers are the store's standing base.
- Three admins, the owner and two partners, with equal authority over catalog, stock, delivery zones, orders, reports, and admin accounts. No buyer can reach the admin area.
- The store's courier is not an app user: an admin hands them the address and the item list.

## Product Purpose

Segar Anugerah is one store selling fresh fish and vegetables, ordered online with clear prices and a delivery date, replacing order-taking through WhatsApp. Orders become rows with a number, a status, and a history. Success as the PRD states it: a first order paid through Midtrans and processed to completion; under three minutes from opening the site to a paid order; no order lost to a stock error in the first month; no paid transaction without a matching order row; an admin finishing an order without opening WhatsApp.

## Positioning

A store with a standing base of restaurants and warungs, delivered by the store's own courier, kecamatan by kecamatan. A marketplace seller cannot copy a route the store runs itself, or the relationship that keeps those buyers ordering again.

## Operating Context

- Delivery is priced per kecamatan. The delivery date follows the 16.00 WIB cut-off: before it ships the same day, after it ships the next.
- Payment runs through Midtrans Snap: QRIS, e-wallets, Virtual Accounts. Card payments are off. Unpaid orders expire after 30 minutes and their stock returns.
- Stock is locked when the order is created and released on expiry, cancellation, or refund.
- The three admins work from a laptop at home and from a phone at the market: the admin surface has to be usable on a phone as well as on a desktop.
- Customer accounts are a phone number and a password. No email and no OTP login in the MVP.
- Launch ships free delivery with an end date; the fee returns to normal automatically after it.

## Capabilities and Constraints

- MVP: catalog with categories, products, size or weight variants, prices, stock, up to four photos per product; buyer accounts with saved addresses and order history; cart and checkout with a delivery zone; Midtrans payment; orders with numbers, statuses, expiry and stock return; admin for orders, products, categories, zones, store settings, and admin users; simple reports of daily revenue, order count, and best sellers.
- Out of MVP: WhatsApp notifications, vouchers, Excel export, OTP login, buyer-initiated cancellation, automatic refunds, a native app, multiple sellers.
- Not a marketplace. No tax handling, no distance or map-based delivery pricing, no live courier tracking, no card data stored.
- The stack is already in this repository and design work does not reopen it: Next.js 16 with the App Router, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM on PostgreSQL, session cookies over httpOnly.
- Terminology to keep: order number `SA-YYMMDD-XXXX`, variant, delivery zone, cut-off, `paid_late`. Interface copy is Indonesian; routes, tables, and files are English.
- Undecided, and not to be invented: whether the store keeps hours or closed days beyond the 16.00 cut-off, and whether an admin may change a paid order's contents. Both are open in PRD §9.2.

## Brand Commitments

- The name Segar Anugerah and the logo at `~/Documents/grinding/SegarAnugerah/assets/logo.png` are the store's.
- Green is the primary colour. The owner confirmed it for v2 while replacing the rest of the visual world; the old project's design tokens are evidence, not authority.
- Interface copy is Indonesian, written plainly, for people shopping from a phone.

## Evidence on Hand

- The PRD, `docs/PRD.md` v1.1, is the product source of truth.
- The current client design is `design/segar-anugerah-client.pen` (23 screens); it fixes layout, typography, and colour. `DESIGN.md` records the tokens and component rules.
- Wireframes for every screen and state: `design/wireframes-store.html`, `design/wireframes-admin.html`, with the coverage record in `design/wireframe-coverage.md`. These fix what is on each screen; they do not fix how it looks.
- A logo at `~/Documents/grinding/SegarAnugerah/assets/logo.png`.
- Six product photographs exist in the old project at `~/Documents/grinding/SegarAnugerah/design/photos/` (nila, lele, kangkung, bayam, sayur, hero-pasar-ikan). The owner's instruction for the build was to source suitable photographs online. Any photograph taken from the web is a placeholder to be replaced by the store's own photography before launch, and no photograph may show a product the store does not sell.
- No testimonials, no usage numbers, and no photography cleared for launch. Nothing here may be fabricated: no review counts, no customer totals, no awards.

## Product Principles

1. Price and delivery cost are visible before payment. Nothing appears at the last step.
2. A standing restaurant buyer's next order is the shortest path to the next sale: saved address, order history, and the same items come before discovery.
3. Stock is stated honestly. An out-of-stock variant stays visible and marked, and never counts toward the total.
4. Every order has a number, a status, and a history, openable at any time by the buyer and by the admin.
5. The admin surface is reached from a phone at the market as easily as from a laptop at home.

## Accessibility & Inclusion

- Equivalent to WCAG 2.1 AA on the buying flow: contrast at or above 4.5:1, every control reachable by keyboard, form labels tied to their inputs, alternative text on product images.
- Buyers are on phones; checkout has to be comfortable at 360 px wide.
