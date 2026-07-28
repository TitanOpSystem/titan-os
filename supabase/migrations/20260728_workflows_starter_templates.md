# Starter workflow templates

Four playbooks ship with the product so a new tenant inherits them at
provisioning instead of retyping them. A firm edits its own copy freely;
`is_starter` only records provenance.

| key | category | steps | earliest offset | conditional steps |
|---|---|---|---|---|
| `ilit_premium` | Insurance | 9 | −75d | `crummey_required` |
| `insurance_renewal` | Insurance | 8 | −75d | `shop_market` |
| `estimated_tax` | Tax | 5 | −30d | `confirm_with_cpa` |
| `capital_call` | Investments | 5 | −12d | — |

## Applying to another tenant

Templates are rows, not schema, so they are copied rather than migrated. The
reliable path is to read them out of a tenant that already has them and insert
them into the target — this avoids hand-retyping the step JSON:

```sql
-- from the source project
select key,name,description,category,is_starter,trigger_kind,steps
from workflow_templates where is_starter;
```

Then insert those rows into the target project. Apply
`20260728_workflows.sql` first — the tables must exist.

## Why the steps live in JSON

Every playbook has a different shape: 5 to 9 steps, lead times from twelve days
to seventy-five, two to four recipient types, and nought to two conditional
steps. Modelling that as columns would mean a migration per playbook. A step
array means a new playbook is a row, which is what makes the library extensible
by the firm rather than only by us.

Conditional steps declare `requires: "<flag>"`, and the engine looks that flag up
in `workflow_instances.resolved_options` — a snapshot of the obligation's options
taken when the cycle was created. Nothing about that mechanism is specific to
Crummey notices; `shop_market` and `confirm_with_cpa` use the same path.
