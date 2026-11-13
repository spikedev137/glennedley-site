# MondayMotivator signup review

This is a review-only update. It has not been pushed or deployed, and no real
email address has been submitted.

## Website changes

- The homepage has an email box immediately above the existing blue button,
  as shown in the supplied mockup. The other homepage design and copy remain
  unchanged.
- The existing `/subscribe/` page uses the same form, so header and footer
  signup links no longer require a click through to Spike.
- The new thank-you page is `/thank-you/`. Its production URL will be
  `https://glennedley.com/thank-you/`. It is marked `noindex` and excluded from
  the sitemap.
- Copy draws on Spike's signup page and the welcome/what-to-expect structure
  of James Clear's example. It does not promise a confirmation email,
  welcome sequence, free chapter, or other unverified delivery.
- All 703 archive entries and all unrelated existing review changes are
  preserved.

## What the form does

The form posts to the exact Mailchimp endpoint in the supplied code. It keeps
the audience `aa2e9c1ec2`, form ID `005390e3f0`, tag `6691322`, required `EMAIL`
field, and Mailchimp anti-bot field. It opens Mailchimp's response in the same
tab. Browser email validation works without JavaScript. Mailchimp remains
responsible for duplicate-address handling, server validation, bot challenges,
opt-in status, and the actual success response.

Mailchimp's default styles and JavaScript are omitted so the existing design
is retained and Mailchimp can perform its configured redirect. There is no
timer, hidden iframe, unconditional redirect, or simulated subscription success.

## Required before launch: configure the redirect in Mailchimp

**The supplied embed code does not set a custom success URL. The redirect to
Glenn's thank-you page is not configured or verified by this website update.**

1. Deploy the reviewed website only after approval, so the thank-you URL exists.
2. In Mailchimp, choose the audience matching the supplied code. Open Forms →
   Settings → Basic Subscribe Form → Edit, then the Outline panel → Success.
3. Choose the external-link option and set
   `https://glennedley.com/thank-you/` as the successful-signup destination.
   Confirm the audience and any other forms using this shared setting before
   saving. Changing this setting can affect other forms for the same audience.
4. Keep embedded-form JavaScript disabled. This site already uses the native
   POST equivalent of that option.
5. Confirm the audience's opt-in setting and tag meaning in the authenticated
   account. Do not change opt-in settings just to match this page. If double
   opt-in is enabled later, use a separate pending-confirmation page at the
   initial submission stage and keep this thank-you page for confirmed signup.
6. With an explicitly approved test email, verify successful signup, correct
   tagging, any challenge, duplicate and invalid-address responses, the final
   redirect, and email delivery before calling the live flow complete.

Until the Mailchimp setting is saved, a valid submission can end on Mailchimp's
current response page instead of Glenn's thank-you page. Local build checks
cannot establish account settings, live acceptance, or delivery.

## Sources

- Supplied Mailchimp embed code and two supplied homepage images.
- https://spike.co.nz/sign-me-up/
- https://jamesclear.com/check-your-email?3-2-1
- https://mailchimp.com/help/design-and-host-your-own-thank-you-pages/
