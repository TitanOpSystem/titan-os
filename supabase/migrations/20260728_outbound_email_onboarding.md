# Onboarding a tenant: outbound email

Workflow correspondence goes out **as the responsible Titan Expert**, from their own
address, on **that firm's own verified domain**. A banker or trustee should see the
name of the person they deal with, not a shared robot mailbox — and not another
firm's domain.

This is why sending is tenant configuration rather than a constant in the code, and
why it has to be completed per firm before workflows can send anything. A tenant
with an unverified domain is **blocked from sending**, deliberately: an unverified
sender either bounces or lands in spam, and a bank instruction that silently fails
to arrive is the worst outcome this feature has.

## Steps for each new firm

1. **Run the migrations.** `20260728_outbound_email.sql` creates
   `outbound_email_settings` (one row, seeded unverified) and the send-tracking
   columns.

2. **Agree the sending domain** with the firm. It must be a domain they control,
   because verification requires DNS records. Usually their primary domain, e.g.
   `accurateadvisory.com`.

3. **Verify it with the email provider** (Resend). Add the DKIM/SPF records they
   give you to the firm's DNS and wait for the domain to show as verified. Nothing
   below matters until this is green.

4. **Set the row:**

   ```sql
   update public.outbound_email_settings
      set sending_domain  = 'accurateadvisory.com',
          from_mode       = 'advisor',        -- send as each client's own Expert
          from_org_label  = 'Accurate Advisory Group',
          fixed_from_email= 'clientservices@accurateadvisory.com', -- fallback, optional
          sender_verified = true,             -- ONLY after step 3 is confirmed
          updated_by      = 'you@yourfirm.com',
          updated_at      = now()
    where id;
   ```

5. **Check every Expert's address is on that domain.** `from_mode='advisor'` sends
   as `families.advisor_email`. If an Expert's address is on a different domain the
   send falls back to `fixed_from_email`, and if that is unset or also off-domain the
   send is refused with a message naming the problem. Worth catching at onboarding
   rather than on a live premium deadline:

   ```sql
   select f.name, f.advisor_email
     from public.families f
     where f.advisor_email is not null
       and lower(split_part(f.advisor_email,'@',2)) <>
           (select lower(sending_domain) from public.outbound_email_settings);
   ```

6. **Set a primary contact per family.** Every outbound draft copies the family
   principal. Where several members have emails and none is marked, the platform
   copies nobody and says so rather than guessing. Use the ★ in the Members card.

7. **Send one test** on a demo family before letting it near a real client.

## What is deliberately not automatic

- **`sender_verified` is never set by code.** It records that a human confirmed the
  domain with the provider. Defaulting it to true would let a misconfigured tenant
  fire off mail that quietly never arrives.
- **`from_mode='fixed'`** exists for a firm that wants one central outbound mailbox,
  but `advisor` is the default because it is what recipients expect.
- **`max_recipients_per_send`** defaults to 10. It is a blast-radius limit against a
  bug, not a business rule.

## Recipient safety

A draft's To line is written by a model from facts that include text extracted from
uploaded documents — untrusted input. Every recipient is therefore checked against
`family_known_emails()`: members, professional contacts, property vendors and the
Expert. Anything else stops the send and is shown to the reviewer, who must confirm
explicitly; the override is recorded on the step in `recipients_unverified`.

Adding a legitimate new counterparty to the family's Contacts is the intended fix,
and has the side benefit of keeping the client record current.
