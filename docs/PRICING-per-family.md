# What to charge per family

Market analysis and a recommended price. Every figure is computed in `docs/pricing_model.py`
against the real PCM production rows, not typed in. Re-run it rather than editing numbers here.

Last built: 31 July 2026.

---

## The recommendation, up front

Three tiers, priced per household per month, with a one-off onboarding fee. No AUM component.

| Tier | Monthly | Annual | Onboarding | Properties included | Titan Expert |
|---|---|---|---|---|---|
| **Core** | $750 | $9,000 | $3,500 | 3 | Shared queue, no named expert |
| **Premier** | $2,500 | $30,000 | $7,500 | 6 | Named expert, quarterly review |
| **Estate** | $5,000 | $60,000 | $15,000 | 12 | Named expert, monthly review, concierge |

Beyond the included count: **$200 per property per month.** Additional entities: $150/month each.

**Premier at $2,500/month is the number to lead with.** Core exists to make Premier look
reasonable and to catch families who aren't ready. Estate exists so the biggest households don't
cap out — and because it matches what PCM already charges, so no existing client gets repriced.

---

## Why these numbers

### The market, as it actually prices in 2026

| What it is | Who sells it | Price |
|---|---|---|
| Enterprise reporting/ERP | Addepar, Eton (AtlasFive), Archway | $50K–$250K+/yr, needs $25–50M+ |
| Mid-market, fixed fee | Masttro | $50K–$150K+/yr, explicitly **not** AUM-based |
| Mid-market accounting | FundCount | SFO from $34,099/yr; MFO from $24,449/yr |
| Modern reporting SaaS | Asora | ~$870/mo (~$10,440/yr) |
| Alternatives-first SaaS | Copia Wealth Studios | from $895/mo |
| Coordination layer | X1 Wealth | $97/mo household; advisor $499/mo for 10 households |
| Budget suite | Asseta AI | from $32/mo |
| Aggregator | Kubera | $150/yr individual |
| The service, not the software | Multi-family offices | 1.0–1.5% of AUM on the first $25–50M |
| Virtual family office, all-in | — | $50K–$500K/yr, of which $50K–$200K is technology |

Two things fall out of that table.

**There is a hole between $10K and $50K per year.** Below it sits software with nobody attached.
Above it sits enterprise infrastructure that needs a family office to operate it. A platform with a
named human on it belongs in the hole, and almost nobody is there. $30,000/yr lands in the middle
of it.

**Fixed pricing is the credible posture.** Masttro's whole pitch is that the fee doesn't move when
the portfolio does, and it's the differentiator buyers cite. PCM is not an RIA charging basis
points. Pricing on AUM would invite the worst conversation in the business — "the market went up
15%, what did you do differently for the extra fee?" Don't open that door.

### Where the cost actually sits

Infrastructure is $12/household/month — Supabase, Vercel, Resend, and the Claude API. It is
noise. The entire cost of goods is the Titan Expert's time, at roughly $88/hour fully loaded
($150,000 over 1,700 usable hours).

| Tier | Expert time | Gross margin | Households per expert | ARR per expert |
|---|---|---|---|---|
| Core | 0.5 hr/mo | 93% | ~60 | $540,000 |
| Premier | 4 hr/mo | 85% | ~25 | $750,000 |
| Estate | 9 hr/mo | 84% | ~12 | $720,000 |

Every tier clears 4–5x the expert's loaded cost. That is the number that makes this a business
rather than a job, and it holds because the platform does the assembly work — the report, the
obligations, the vendor register — that would otherwise be the expert's afternoon.

**Price on properties and entities, not on net worth.** Cost to serve tracks the number of things
that generate paper: properties, entities, custodians, vendors. A $40M household with one house is
cheaper to serve than an $8M household with nine rentals. The per-property overage is what keeps
the model honest as a book grows.

---

## The property management offset

This is the strongest argument in the deck, and it needs handling carefully.

**The benchmark is real.** Single-family management runs 8–12% of gross rent, 10% being the most
common, ~8.5% the residential national average, higher at the luxury end. Add tenant placement at
50–100% of the first month's rent and lease renewals at $100–500, and the all-in figure reported
across the industry is **15–20% of gross rental income**.

**The breakeven.** At what gross rent does the displaced fee equal our price?

| Tier | Annual price | Breakeven at 8% | at 10% | at 12% | at all-in 15% |
|---|---|---|---|---|---|
| Core | $9,000 | $112,500 | $90,000 | $75,000 | $60,000 |
| Premier | $30,000 | $375,000 | $300,000 | $250,000 | $200,000 |
| Estate | $60,000 | $750,000 | $600,000 | $500,000 | $400,000 |

The sentence to say out loud: *a family grossing $300,000 in rent is already paying someone
$30,000 a year at the standard 10%. Premier costs the same and replaces the coordination
layer with one that reports to you.*

### Applied to PCM's actual book — and the honest problem

| Household | Properties | Value | Gross rent | Fee at 10% | Fee at 15% |
|---|---|---|---|---|---|
| Kilcoyne | 6 | $32.67M | $677,616 | $67,762 | $101,642 |
| Lamb | 2 | $551K | $30,000 | $3,000 | $4,500 |
| Bennett | 2 | $635K | — | — | — |

Kilcoyne clears every tier several times over. On rent alone, Estate at $60,000 sits below
the $67,762 that a 10% manager would charge, and well below the $101,642 all-in figure.

**But the recorded data says these fees aren't being paid to anyone.** All six Kilcoyne properties
carry `property_management_fee_pct = 0`. Across the whole book, the only management fee on file is
one Lamb property at 10% — $3,000 a year. Two readings, and they lead to different pitches:

- **They self-manage.** Then there is no third-party fee to offset, and the argument changes from
  "we're cheaper than your manager" to "you are doing this yourself, at six properties and
  $678,000 of rent, and we take it off your desk." That is a good pitch. It is not a savings pitch.
- **The field was never filled in.** Then the number exists and we don't know it.

**Confirm which, per household, before the offset appears in any proposal.** Putting a savings
number in front of a client who isn't paying that fee is the kind of error that ends a
relationship.

### The limit of the claim

Property management is a service. Rent collection, tenant calls, maintenance dispatch, turnover,
make-ready. If PCM does oversight and coordination but not those things, the family cannot fire
their manager, and the honest claim is a **partial** offset — we remove the reporting, document
and vendor-coordination portion of what they pay, not the whole fee.

State it that way. The partial version is still a strong argument and it survives scrutiny. The
full version only holds if PCM genuinely takes over management, which is a different business with
different licensing and different liability. Worth deciding deliberately rather than by implication
in a sales conversation.

---

## The other side: licensing TitanOS to firms

Distinct from what a family pays. Recommended: **$150/household/month with a $1,500/month floor.**

| Households | Firm pays TitanOS | Firm bills clients at Premier | Licence as % of firm revenue |
|---|---|---|---|
| 10 | $18,000/yr | $300,000/yr | 6.0% |
| 25 | $45,000/yr | $750,000/yr | 6.0% |
| 50 | $90,000/yr | $1,500,000/yr | 6.0% |
| 100 | $180,000/yr | $3,000,000/yr | 6.0% |

Six percent of revenue for the system the whole practice runs on is an easy yes, and it compares
well against X1's $50/household (a lighter product) and Addepar's six figures. Add a per-firm setup
fee of $10,000–25,000 covering the Supabase project, Vercel deployment, brand record, template
migration and training — that work is real and shouldn't be free.

---

## Things to get right, and things I'd push back on

**Don't reprice existing clients.** PCM's brand record already defaults to $5,000/month, which is
exactly Estate. Map the current four households onto tiers at or below what they pay now.

**Make the onboarding fee non-negotiable.** Migrating a household — properties, documents,
statements, vendors, obligations — is the single biggest cost in the relationship and the one most
likely to be discounted away. Discount the monthly if you must; never the onboarding.

**Annual up front, with a discount.** Two months free on a twelve-month prepay. It fixes cash flow
and it filters for families who are actually committing.

**The weakest part of this model is Core at $750.** It sits below Asora ($870) and Copia ($895),
which is defensible for a self-serve tier, but a "private wealth" brand selling a $750 product
invites the question of what the $2,500 one adds. If Core cannibalises Premier in the first ten
conversations, kill Core rather than discounting Premier. A narrow product sold at a firm price is
a better position than a ladder that trains buyers to shop down it.

**What I could not verify.** Addepar, Eton, Archway, Aleta and Landytech publish no pricing at all;
their figures above are third-party estimates, and the comparison table's own author notes it was
compiled from vendor pages and directories. The FundCount and Asora numbers are published and
therefore firmer. Treat the enterprise band as directional.

---

## Sources

- [Family Office Software Comparison 2026: 14 Platforms with Pricing — X1 Wealth](https://x1wealth.com/compare/family-office-software)
- [Family Office Software Cost: Pricing Factors Explained (2026) — FundCount](https://fundcount.com/family-office-software-cost/)
- [Best Family Office Software for 2026: Features, Pricing, and Use Cases — Masttro](https://masttro.com/insights/best-family-office-software)
- [Virtual Family Office: How It Works & Benefits — FundCount](https://fundcount.com/virtual-family-office-structure-setup-costs/)
- [Family Office Costs and Fees Explained — Aleta](https://aleta.io/knowledge-hub/family-office-costs-and-fees)
- [Family Office Fee Structure by Complexity, Not Just Net Worth — Asset Vantage](https://www.assetvantage.com/blogs/family-office-fee-structure-by-complexity-not-just-net-worth/)
- [Property Management Fees in 2026: A Single-Family Owner's Guide — Home365](https://www.home365.co/general-knowledge/property-management/property-management-fees-2026/)
- [How Much Do Rental Property Managers Charge in 2026? — All Property Management](https://www.allpropertymanagement.com/resources/ask-a-pro/posts/how-much-property-managers-charge/)
- [Property Management Fees: The Complete 2026 Guide — The Property CEO](https://thepropertyceo.com/blog/property-management-fees-guide)
- [Best Advisor Platforms for RIAs in 2026 — X1 Wealth](https://x1wealth.com/compare/advisor-platforms-2026)

Household figures: PCM production (`unkirihxtruhdjeldfpm`), `families` and `properties`, read
31 July 2026. Rental income is a monthly field; taxes, insurance and HOA are annual. Verified by
gross yield — Kilcoyne's rent-producing properties come to 3.8% read as monthly and 0.3% read as
annual, so monthly is the only defensible reading.
