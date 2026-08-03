"""Pricing model for TitanOS / PCM per-family SaaS. Every figure in the memo comes from here.

Rental income on properties is a MONTHLY figure; taxes/insurance/HOA are ANNUAL. Verified by
sanity-checking gross yield: Kilcoyne's rent-producing properties come to a 3.8% gross yield if
monthly and 0.3% if annual, so monthly is the only reading that isn't absurd.
"""

# Real PCM production rows, rental_income in $/month.
BOOK = {
    "Kilcoyne": {"props": 6, "value": 32_668_718,
                 "rent_mo": [16_375.99, 14_623.89, 7_500, 12_000, 5_968.11],
                 "recorded_mgmt_pct": [0, 0, 0, 0, 0, 0]},
    "Bennett":  {"props": 2, "value": 635_000, "rent_mo": [], "recorded_mgmt_pct": [0, 0]},
    "Lamb":     {"props": 2, "value": 551_000, "rent_mo": [2_500],
                 "recorded_mgmt_pct": [0, 10]},
}

def annual_rent(h): return sum(h["rent_mo"]) * 12

print("=" * 74)
print("PCM ACTUAL BOOK — rental gross and the property-management fee it implies")
print("=" * 74)
tot_rent = 0
for name, h in BOOK.items():
    r = annual_rent(h); tot_rent += r
    yld = r / h["value"] * 100 if h["value"] else 0
    print(f"\n{name}: {h['props']} properties, ${h['value']:,.0f} value")
    print(f"  gross rent          ${r:,.0f}/yr  ({yld:.2f}% of total value)")
    for pct in (8, 10, 12):
        print(f"  PM fee at {pct:>2}%        ${r*pct/100:,.0f}/yr")
    print(f"  all-in 15% (fees+leasing+markups)  ${r*0.15:,.0f}/yr")
    print(f"  recorded mgmt pct in the data: {h['recorded_mgmt_pct']}")
print(f"\nBook total gross rent: ${tot_rent:,.0f}/yr")
print(f"Fees actually recorded as being paid today: "
      f"${2_500*12*0.10:,.0f}/yr (Lamb, one property at 10%)")

print("\n" + "=" * 74)
print("TIERS — recommended per-family pricing")
print("=" * 74)
TIERS = [
    # name, monthly, onboarding, properties included, expert hrs/mo, households per expert
    ("Core",    750,   3_500,  3,  0.5, 60),
    ("Premier", 2_500, 7_500,  6,  4.0, 25),
    ("Estate",  5_000, 15_000, 12, 9.0, 12),
]
EXPERT_LOADED_COST = 150_000      # fully loaded Titan Expert, salary + benefits + overhead
EXPERT_HOURS_YR = 1_700           # billable-capable hours after admin, PTO, training
HOURLY = EXPERT_LOADED_COST / EXPERT_HOURS_YR
INFRA_PER_HH_MO = 12              # Supabase + Vercel + Resend + Claude API, per household
PER_EXTRA_PROPERTY_MO = 200

print(f"\nTitan Expert loaded cost ${EXPERT_LOADED_COST:,}/yr over {EXPERT_HOURS_YR} hrs "
      f"= ${HOURLY:,.2f}/hr")
print(f"Infrastructure ${INFRA_PER_HH_MO}/household/month = ${INFRA_PER_HH_MO*12}/yr\n")

for name, mo, onb, props, hrs, cap in TIERS:
    arr = mo * 12
    labour = hrs * 12 * HOURLY
    infra = INFRA_PER_HH_MO * 12
    cost = labour + infra
    gm = (arr - cost) / arr * 100
    print(f"{name}")
    print(f"  ${mo:,}/mo  =  ${arr:,}/yr   + ${onb:,} onboarding (one-off)")
    print(f"  includes {props} properties, then ${PER_EXTRA_PROPERTY_MO}/property/mo")
    print(f"  expert time {hrs:.1f} hr/mo -> labour ${labour:,.0f}/yr, infra ${infra:,.0f}/yr")
    print(f"  gross margin {gm:.0f}%   contribution ${arr-cost:,.0f}/yr")
    if cap:
        print(f"  one expert carries ~{cap} households -> "
              f"${arr*cap:,.0f} ARR per expert against ${EXPERT_LOADED_COST:,} cost "
              f"({arr*cap/EXPERT_LOADED_COST:.1f}x)")
    print()

print("=" * 74)
print("THE OFFSET ARGUMENT — at what rental gross does each tier pay for itself?")
print("=" * 74)
print("\nBreakeven gross rent, i.e. the rent at which the displaced PM fee equals our price:\n")
print(f"{'Tier':<16}{'ARR':>10}   {'at 8%':>12}{'at 10%':>12}{'at 12%':>12}{'all-in 15%':>13}")
for name, mo, onb, props, hrs, cap in TIERS:
    arr = mo * 12
    row = "".join(f"{arr/(p/100):>12,.0f}" for p in (8, 10, 12))
    print(f"{name:<16}{arr:>10,}   {row}{arr/0.15:>13,.0f}")

print("\nRead that as: a family grossing this much rent is already paying an outside manager")
print("more than our fee, so the platform is free at the margin and everything else is upside.\n")

print("=" * 74)
print("APPLIED TO THE REAL BOOK")
print("=" * 74)
for name, h in BOOK.items():
    r = annual_rent(h)
    if r == 0:
        print(f"\n{name}: no rental income recorded — offset argument does not apply.")
        continue
    print(f"\n{name} (${r:,.0f} gross rent):")
    for tname, mo, *_ in TIERS:
        arr = mo * 12
        for pct in (10, 15):
            net = r * pct / 100 - arr
            verdict = "covered" if net >= 0 else f"short ${-net:,.0f}"
            print(f"  {tname:<15} ${arr:>7,}/yr vs {pct}% fee ${r*pct/100:>9,.0f}  -> {verdict}")

print("\n" + "=" * 74)
print("FIRM-LEVEL: what a tenant firm pays us, and what it makes")
print("=" * 74)
LICENCE_PER_HH_MO = 150   # what TitanOS charges a white-label firm per household
PLATFORM_FLOOR_MO = 1_500 # minimum monthly platform fee per firm
for n in (10, 25, 50, 100):
    lic = max(PLATFORM_FLOOR_MO, n * LICENCE_PER_HH_MO) * 12
    firm_rev = n * 2_500 * 12          # firm charges Premier
    print(f"{n:>4} households: firm pays TitanOS ${lic:,}/yr, "
          f"bills clients ${firm_rev:,}/yr, licence is {lic/firm_rev*100:.1f}% of its revenue")
