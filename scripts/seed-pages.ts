/**
 * Upsert real content for legal / info pages.
 * Run with: npm run pages:seed
 */
import { prisma } from "../src/lib/prisma";

const STORE_NAME = process.env.STORE_NAME ?? "Ascendyl";
const LEGAL_NAME = process.env.STORE_LEGAL_NAME ?? "Ascendyl Solutions Private Limited";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "Ascendyl204@gmail.com";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? "+91 7037638457";
const COMPANY_ADDR =
  process.env.STORE_ADDRESS ??
  `${LEGAL_NAME}, Office No 206, Plot No 1, 2nd Floor, Ambar Tower, Naniwala Bagh, Azadpur, North West Delhi, Delhi - 110033`;

const PAGES: { slug: string; title: string; body: string }[] = [
  {
    slug: "about",
    title: "About us",
    body: `${STORE_NAME} is a homegrown Indian clothing label by ${LEGAL_NAME}, crafting considered, everyday pieces designed for the way you actually live.

We started with one belief: clothing should feel as good as it looks. Every cut, every fabric, every stitch is chosen for comfort, durability, and a quiet kind of confidence that lasts beyond the season.

Our process
• Fabrics — breathable cottons, soft linens and premium blends, sourced responsibly.
• Fit — tested across body types, designed to flatter without compromise.
• Process — small-batch production, low-waste cuts, and quality checks on every piece before it ships.

Why we exist
We believe great style shouldn't cost the earth — financially or environmentally. We keep operations lean, work directly with manufacturers, and pass the savings to you.

Thanks for being here.`,
  },
  {
    slug: "contact",
    title: "Contact us",
    body: `We're here to help. Most queries are answered within one business day.

Customer support
Email: ${SUPPORT_EMAIL}
Phone / WhatsApp: ${SUPPORT_PHONE} (Mon–Sat, 10:00 – 18:00 IST)

Wholesale & partnerships
Email: ${SUPPORT_EMAIL}

Registered office
${COMPANY_ADDR}

Order help
For order-related questions, please include your order number (e.g. ASC-XXXXXXXX-XXXX) when writing in. You can also see your order status at /account.`,
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    body: `Orders & shipping

How long does delivery take?
Standard delivery is 3–7 business days across India. Metro cities typically see delivery within 3–4 days.

Do you ship internationally?
Currently we ship within India only.

Can I change my shipping address after placing the order?
Reach us at ${SUPPORT_EMAIL} within 2 hours of placing the order. Once dispatched, the address cannot be changed.

What if my order arrives damaged?
Email ${SUPPORT_EMAIL} within 48 hours with photos. We'll replace or refund.

Payments

What payment methods do you accept?
We accept UPI, all major credit/debit cards, netbanking, popular wallets, and cash on delivery (COD) across India.

Is COD available everywhere?
COD is available across most pincodes in India. Use the delivery checker on the product page to confirm.

Returns

What is your return policy?
We accept returns within 7 days of delivery on unworn, unwashed items with all tags intact. See our refund policy for details.

How do I start a return?
Visit /account, open the order, and click "Return item". Or email ${SUPPORT_EMAIL} with your order number.

When will I get my refund?
Once we receive and inspect the returned item, refunds are processed within 5–7 business days to the original payment method. COD refunds go to your bank account.

Sizes & fit

I'm between sizes — what should I order?
We recommend sizing up for a relaxed fit, sizing down for a tailored fit. See our size guide.

Account

I forgot my password.
Use the "Forgot password" link on the sign-in page.

How do I update my contact details?
Visit /account/profile.`,
  },
  {
    slug: "shipping",
    title: "Shipping policy",
    body: `Where we ship
${STORE_NAME} ships across India. We do not currently ship outside India.

Delivery times
• Metro cities: 3–4 business days
• Tier-2 cities: 4–6 business days
• Remote pincodes: up to 7 business days

Shipping charges
• Free shipping on prepaid orders above ₹999.
• Orders below ₹999 are charged a flat ₹49 shipping fee.
• Cash on delivery: a non-refundable handling fee of ₹49 applies on all COD orders.

Tracking your order
A tracking link is sent to your email & WhatsApp once the order is dispatched. You can also track inside /account.

Dispatch timelines
Orders placed before 14:00 IST on a business day are dispatched the same day. Orders placed afterwards or on holidays go out the next business day.

Holiday & sale-period delays
During major sales (EOSS, festive), delivery may take 1–3 extra days. We'll keep you informed.

Lost / not delivered
If your order shows delivered but you haven't received it, contact ${SUPPORT_EMAIL} within 48 hours so we can raise a query with the courier.`,
  },
  {
    slug: "returns",
    title: "Return & refund policy",
    body: `Eligibility
Items can be returned within 7 days of delivery if they are:
• Unworn and unwashed
• In original condition with all tags intact
• In original packaging

Non-returnable items
For hygiene and safety reasons, the following are non-returnable:
• Innerwear, swimwear & socks
• Items marked "final sale"
• Customised / altered items
• Gift cards

How to return
1. Visit /account, open the order, click "Return item".
2. Pick your items and the reason. We'll arrange a reverse pickup.
3. Hand the parcel to the courier in original condition.
4. Once received and inspected (3–5 business days), we issue a refund.

Refunds
• Prepaid orders: refunded to the original payment method.
• COD orders: refunded to a bank account you'll be asked to provide.
• Refunds typically reflect within 5–7 business days after we approve the return.

Exchanges
We don't currently offer direct exchanges. To exchange, return the item and place a new order — you'll have your refund before placing the new order in most cases.

Damaged / wrong item
If you received a damaged or wrong item, email ${SUPPORT_EMAIL} within 48 hours with photos. We'll arrange free replacement or full refund.

Contact
${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`,
  },
  {
    slug: "terms",
    title: "Terms & conditions",
    body: `Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

By accessing and using ${STORE_NAME} (the "Site"), operated by ${LEGAL_NAME}, you agree to these Terms.

1. Eligibility
You must be 18+ to make a purchase. If you are under 18, please use the Site under the supervision of a parent or guardian.

2. Account
You are responsible for the security of your account credentials and all activity on your account. Notify us immediately of any unauthorised access.

3. Orders & pricing
All orders are subject to acceptance and product availability. We reserve the right to refuse or cancel an order at any time, including after order confirmation, in cases of pricing errors, suspected fraud, stock issues, or violation of these Terms.

4. Pricing & taxes
Prices are listed in Indian Rupees (₹) and are inclusive of GST unless otherwise stated. Shipping charges, where applicable, are shown at checkout.

5. Payments
Payments are processed by trusted payment partners (Razorpay). We do not store full card details on our servers. By submitting payment information, you authorise us to charge the relevant amount.

6. Shipping & delivery
Please refer to our Shipping policy for delivery timelines, charges, and dispatch policies.

7. Returns
Please refer to our Return & refund policy.

8. Intellectual property
All content on the Site (text, graphics, photos, logos) is the property of ${STORE_NAME} or its licensors and is protected under applicable intellectual-property laws. You may not reuse this content without prior written consent.

9. User conduct
You agree not to use the Site for any unlawful purpose, attempt to bypass security, or interfere with the Site's operation.

10. Limitation of liability
${STORE_NAME} is not liable for indirect, incidental, special, or consequential damages arising from use of the Site or products purchased on it.

11. Governing law & jurisdiction
These Terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of courts in Delhi.

12. Changes
We may update these Terms at any time. Continued use of the Site after changes constitutes acceptance.

13. Contact
${SUPPORT_EMAIL} · ${SUPPORT_PHONE}
${COMPANY_ADDR}`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    body: `Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

${STORE_NAME}, operated by ${LEGAL_NAME} ("we", "us", "our"), respects your privacy. This policy explains what we collect, how we use it, and your rights.

What we collect
• Identity & contact: name, email, phone, shipping/billing address.
• Account data: encrypted password, role, order history.
• Order data: items, prices, payment provider order/payment IDs (we do not store card numbers, CVVs, or UPI PINs).
• Browsing data: pages visited, products viewed, cart contents — used to improve the experience.
• Cookies: session, cart, wishlist, marketing preferences.

How we use it
• To process and ship your orders.
• To provide customer support.
• To send order/shipment notifications and (with consent) marketing messages.
• To prevent fraud and improve site security.
• To comply with legal obligations (tax, accounting).

Sharing
We share data only with:
• Payment processors (Razorpay) for payment processing
• Logistics partners for delivery
• Email/SMS providers for transactional & marketing messages
• Authorities, where legally required

We do not sell your data.

Cookies
You can manage cookies through your browser settings. Disabling some cookies may affect site functionality (e.g., the cart).

Your rights
You may request access to, correction of, or deletion of your personal data by emailing ${SUPPORT_EMAIL}. We respond within 30 days.

Retention
We retain order data for 7 years to comply with Indian tax law. Marketing data is retained until you unsubscribe.

Security
Data is encrypted in transit (HTTPS). Passwords are hashed (bcrypt). Access to our systems is role-restricted and audited.

Children
We do not knowingly collect data from anyone under 18.

Changes
We may update this policy. Material changes will be notified via email and/or a banner on the Site.

Contact
${SUPPORT_EMAIL} · ${COMPANY_ADDR}`,
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    body: `${STORE_NAME} uses cookies and similar technologies to make the Site work, to improve your experience, and (with your consent) to measure performance and personalise marketing.

Strictly necessary
• Session cookies for sign-in
• Cart token (ascendyl_guest_cart)
• Coupon application (ascendyl_coupon)
• Wishlist (ascendyl_favs)
These cannot be turned off — the Site won't work without them.

Data controller
${LEGAL_NAME}, ${COMPANY_ADDR}. Contact: ${SUPPORT_EMAIL}.

Performance & analytics
With your consent, we use analytics to understand how the Site is used. You can opt out via your browser.

Marketing
With your consent, we use cookies to show you relevant ads on partner platforms. You can opt out at any time.

Managing cookies
Most browsers let you block or delete cookies. Visit aboutcookies.org for guidance.`,
  },
  {
    slug: "size-guide",
    title: "Size guide",
    body: `Use this as a starting point. Fit can vary by style — when in doubt, write to us at ${SUPPORT_EMAIL} with the product and your measurements.

Tops & dresses (women, in inches)
XS  — Bust 32   Waist 25   Hips 35
S   — Bust 34   Waist 27   Hips 37
M   — Bust 36   Waist 29   Hips 39
L   — Bust 38   Waist 31   Hips 41
XL  — Bust 40   Waist 33   Hips 43
XXL — Bust 42   Waist 35   Hips 45

T-shirts & shirts (men, in inches)
S   — Chest 36   Shoulder 17   Length 27
M   — Chest 38   Shoulder 18   Length 28
L   — Chest 40   Shoulder 19   Length 29
XL  — Chest 42   Shoulder 20   Length 30
XXL — Chest 44   Shoulder 21   Length 31

Bottoms (waist, in inches)
28 / 30 / 32 / 34 / 36 / 38 / 40

How to measure
• Bust: around the fullest part of the chest, under the arms.
• Waist: at the narrowest part, just above the navel.
• Hips: around the fullest part of the hips, ~20cm below the waist.
• Inseam: from the crotch to the bottom of the leg.

Tip: between sizes, size up for a relaxed fit, size down for a tailored fit.`,
  },
  {
    slug: "sustainability",
    title: "Sustainability",
    body: `We're a small team trying to do better, every season. Here's where we are.

Materials
• Cotton sourced from responsible suppliers wherever possible.
• Preference for OEKO-TEX certified linens and blends.
• We avoid leather, fur, and virgin polyester in new collections.

Production
• Small-batch runs to limit overproduction.
• Surplus fabric reused in trims and packaging filler.
• Partner units reviewed for fair-wage compliance.

Packaging
• 100% recyclable mailers (FSC-certified paper).
• No single-use plastics in packaging.

What's next
• Carbon-offset shipping in the near future.
• Closed-loop recycling pilots with our partner units.

We don't claim to be perfect. We share progress updates — write to us at ${SUPPORT_EMAIL} to receive them.`,
  },
  {
    slug: "careers",
    title: "Careers",
    body: `We're a small, ambitious team building a better Indian clothing brand from the ground up. We hire for craft, ownership, and care.

We don't have any open roles right now, but we're always happy to hear from talented people in design, merchandising, marketing, customer experience, and engineering.

How to apply
Email ${SUPPORT_EMAIL} with the subject "Careers — [your role]", your CV, and a short note on why you'd be a fit. We respond to every application we can.

What we offer
• Honest, growth-stage work with real ownership
• A team that argues kindly and ships often
• Flexible hours and generous time off`,
  },
  {
    slug: "press",
    title: "Press",
    body: `For press inquiries, partnerships, and image requests, contact ${SUPPORT_EMAIL}.

Press kit available on request: logo files (SVG/PNG), product imagery, brand story.`,
  },
];

async function main() {
  for (const p of PAGES) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, body: p.body, isPublished: true },
      create: { slug: p.slug, title: p.title, body: p.body, isPublished: true },
    });
    console.log(`✓ /pages/${p.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
