# Tenant drift — reference copies, NOT deployable

Copies of a deployed function from a tenant whose version was NOT chosen as the repo's
authoritative copy. Kept so no live code is lost while drift is unreconciled.

They live here rather than beside the function they belong to because a stray `.ts` inside
`supabase/functions/<slug>/` invites being picked up by a deploy. Nothing in this folder is
an entrypoint and nothing here should ever be deployed.

## family-ai-assistant.prod-v25.ts

PCM production, v25. Not chosen despite the higher version number, because **version
counters are not comparable across projects** — each is a per-project deploy counter. Two
proofs from this same backup: `send-advisor-email` is demo v11 / prod v12 with
byte-identical content, and `admin-set-password` is demo v10 / prod v2 with identical code.

Prod v25 is the older lineage by timestamp (27 July vs 29 July) and is a strict subset: it
has none of the spend-by-category rules, no `spendByVendor` block, no "where a figure comes
from" section, and still tells a licensed firm's client to contact "their Titan Expert"
rather than naming the firm. Demo v14 was written after it and supersedes it.

Reconciling means deploying the repo's `family-ai-assistant/index.ts` to PCM production.
That has not been done — PCM's assistant is currently running the older prompt.
