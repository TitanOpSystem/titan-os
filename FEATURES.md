# TitanOS — Feature Inventory

Running record of what the platform does, written for a pitchbook rather than as
a changelog. Grouped by the problem each capability solves, because that is how a
prospect hears it.

**Status key** — `LIVE` in PCM production · `DEMO` on the pitch instance only ·
`BUILDING` in progress

Last updated: 28 July 2026 (playbook library shipped)

---

## 1. White-label, genuinely

The product is TitanOS. Every firm — including PCM — is a tenant that supplies its
own identity. Nothing about the codebase treats one firm as special.

| Capability | Status |
|---|---|
| Brand name, logo, tagline, full colour palette per tenant | LIVE |
| Runtime brand switching from an admin screen — no rebuild, no developer | DEMO |
| Multiple saved brands, switched with one click, for concurrent sales cycles | DEMO |
| Branding flows through to exported PDFs, print reports and outbound email | LIVE |
| Branded link previews, favicons and browser chrome per tenant | LIVE |
| Dedicated database per firm — no shared tables, no shared rows | LIVE |

**The line that lands:** every client firm gets an isolated environment with its
own database, provisioned in under a day, carrying their brand end to end — down
to the PDF a client opens on their phone.

---

## 2. One place for the whole balance sheet

| Capability | Status |
|---|---|
| Properties with loan, tax, insurance, flood and rental detail | LIVE |
| Portfolio accounts, including lines of credit excluded from asset totals | LIVE |
| Valuables with insured / not-scheduled status | LIVE |
| Cash flow modelling with tax treatment and multi-year projection | LIVE |
| Deals pipeline and prospect tracking | LIVE |
| Tasks, deadlines and recurring obligations | LIVE |
| Professional contacts and property vendors, click-to-call and click-to-email | LIVE |

---

## 3. Documents that are attached to the numbers

Most platforms give you a folder. This links a document to the figure it supports.

| Capability | Status |
|---|---|
| Vault organised into folders by category | LIVE |
| AI reads uploaded documents — embedded text, and OCR for scans | LIVE |
| Documents linked to a specific property section: mortgage, tax bill, insurance declarations, insurance invoice, flood, rental agreement | LIVE |
| Valuables linked to the schedule that covers them | LIVE |
| Attach from the figure itself — a paperclip beside Property Taxes opens a pre-filled upload | LIVE |
| Replacing a document keeps the old one in the Vault, unlinked, for history | LIVE |
| Download audit log — who opened which document, and when | LIVE |
| Time-limited signed URLs; no permanent public file links | LIVE |

**The demo moment:** open a property, click the icon beside the insurance
premium, and the declarations page opens. Next year's bill replaces it in two
clicks and last year's stays on file.

---

## 4. AI that works from the client's own records

Not a chatbot bolted on. It answers from one family's data and cites the document
it used.

| Capability | Status |
|---|---|
| Per-family assistant answering from that family's records and document contents | LIVE |
| Strictly scoped to one family — it cannot answer across relationships | LIVE |
| Floating assistant on every page; firm-wide screens ask which client first | LIVE |
| Named per family, so the client meets a consistent assistant | LIVE |
| Scheduled reports on a cadence, delivered as branded PDFs | LIVE |
| Concierge research — live web search for what a client asked the firm to watch for, with sources | LIVE |
| Document field extraction to pre-fill property records from a statement | LIVE |
| Treats document text strictly as data, never as instructions | LIVE |

**The demo moment:** ask *"is anything uninsured?"* and it names the vehicle
missing from the schedule, because it read the endorsement.

---

## 5. Workflows: obligations carried to completion

The difference between software that tells you something and software that gets
something done.

| Capability | Status |
|---|---|
| Recurring obligations: premiums, estimated tax, RMDs, capital calls, loan payments | DEMO |
| Four starter playbooks ship with the product | DEMO |
| Lead times measured back from the due date, per playbook | DEMO |
| Conditional steps — e.g. Crummey notices only where the trust requires them | DEMO |
| Conditions resolved before dates are set, because they change the schedule | DEMO |
| At-risk flagged on day one when a cycle starts too late to fit its own lead times | DEMO |
| Every outbound item held for named human approval | DEMO |
| Skipped steps stay visible, so nothing looks forgotten | DEMO |
| Template library in Resources: read the exact playbook before it runs | DEMO |
| Steps read in plain language — "60 days before", who acts, to whom | DEMO |
| Admins edit lead times, actors, recipients and conditions; others read only | DEMO |
| New playbooks are rows, not code — the firm adds its own | DEMO |
| Review queue on the dashboard: everything awaiting a person, across the book | BUILDING |

### Starter playbooks

| Playbook | Steps | Lead time | Conditional |
|---|---|---|---|
| ILIT Premium Funding | 9 | 75 days | Crummey notices |
| Property Insurance Renewal | 8 | 75 days | Market check |
| Quarterly Estimated Tax | 5 | 30 days | CPA sign-off |
| Private Fund Capital Call | 5 | 12 days | — |

**Two things to say out loud in a pitch:** nothing sends without a named
approval, and the platform prepares payment instructions but never moves money.
Those are the reasons a compliance officer says yes.

---

## 6. Roles and permissions enforced at the data layer

Access rules live in the database, so they hold even if the application layer is
bypassed.

| Capability | Status |
|---|---|
| Four roles: Admin, Titan Expert, Partner, Client | LIVE |
| Row-level security per family, enforced in Postgres | LIVE |
| Titan Experts see only their own book | LIVE |
| Partners: read-only, per-family grants, document upload only | LIVE |
| Clients: their own family, read-only | LIVE |
| Permission changes take effect immediately, including for scheduled automations | LIVE |
| Per-partner feature permissions, e.g. who may run scheduled reports | LIVE |
| Admin screens gated on role at the view, not only in the menu | LIVE |
| Clients may email their own advisor, never other advisors at the firm | LIVE |

---

## 7. Client experience

| Capability | Status |
|---|---|
| Branded client portal with the firm's identity | LIVE |
| Read-only net worth, properties, accounts, valuables, documents | LIVE |
| Email their advisor from inside the portal; primary advisor always copied | LIVE |
| Mobile responsive throughout | LIVE |
| Firm-paid bills marked paid, with who paid and when | LIVE |

---

## 8. Operational quality

Unglamorous, and the reason it survives a real deployment.

| Capability | Status |
|---|---|
| Long AI jobs run in the background — no gateway timeouts on multi-minute research | LIVE |
| Every build stamped; open tabs are told when a newer version is live | LIVE |
| Cache rules: immutable hashed assets, never-cached entry point | LIVE |
| Brand artwork versioned so a replaced logo appears immediately | LIVE |
| Artwork failure falls back to the brand name rather than a blank header | LIVE |
| Unsaved brand edits survive leaving the page | DEMO |
| Unrecognised categories fall into "Other" rather than hiding an asset | LIVE |

---

## Known gaps — worth naming before a prospect does

- **Cross-firm single sign-on.** A Titan Expert serving clients through several
  branded instances logs into each separately. Deliberate isolation today;
  central identity is on the roadmap.
- **MFA and an audit trail of record changes.** Document downloads and task
  completions are attributed; a full change history is not yet built.
- **Portfolio statements and cash flow line items** are not yet linked to source
  documents the way properties and valuables are.
- **Backup and recovery policy** should be stated explicitly for an enterprise
  buyer.
