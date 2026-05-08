/**
 * Upsert real content for Ascendyl's legal / info pages.
 *
 * Run with: npm run pages:seed
 *
 * Note on sourcing:
 *  Terms, Privacy, Shipping, Returns and About were drafted by adapting the
 *  publicly-available legal pages on the user's existing site (femfabs.com)
 *  to the Ascendyl entity, address and contacts, with corrections where the
 *  source had typos / placeholders (e.g. "westrova.com" copy-paste, "[Your
 *  Company Name]" template leftover, missing "I" in "f you create").
 *  FAQ, Cookies, Size guide, Sustainability, Careers and Press are
 *  Ascendyl-original copy.
 */
import { prisma } from "../src/lib/prisma";

const STORE_NAME = process.env.STORE_NAME ?? "Ascendyl";
const LEGAL_NAME =
  process.env.STORE_LEGAL_NAME ?? "Ascendyl Solutions Private Limited";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "Ascendyl204@gmail.com";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? "+91 7037638457";
const COMPANY_ADDR_LINE =
  process.env.STORE_ADDRESS ??
  "Office No 206, Plot No 1, 2nd Floor, Ambar Tower, Naniwala Bagh, Azadpur, North West Delhi, Delhi - 110033";
const SITE_URL = process.env.STORE_URL ?? "https://ascendyl.in";
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

const TODAY = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const PAGES: { slug: string; title: string; body: string }[] = [
  {
    slug: "about",
    title: "About us",
    body: `Welcome to ${STORE_NAME}, where fashion meets confidence, comfort, and self-expression. We believe clothing is more than just what you wear — it's how you show up in the world. Every outfit tells a story, and at ${STORE_NAME} we're here to help you tell yours boldly, beautifully, and unapologetically.

${STORE_NAME} is an Indian online fashion destination, proudly owned and operated by ${LEGAL_NAME}. Our mission is simple: to make stylish, versatile, quality clothing accessible to people who want to feel good, look great, and stay true to themselves — every single day.

Our story
${STORE_NAME} was born from a deep understanding of the modern Indian shopper and their evolving lifestyle. Today's customer is dynamic — balancing work, wellness, social life, family, ambitions, and personal growth. The wardrobe needs to keep up with the pace, the personality, and the priorities.

We noticed a gap in the market: fashion that looks great online but disappoints in real life, styles that follow trends but ignore comfort, and brands that speak at customers instead of with them. ${STORE_NAME} was created to change that narrative — combining thoughtful design, trend awareness and practical wearability so you can build a wardrobe that works for real life, not just the runway.

What we stand for
1. Confidence through clothing
We design and curate styles that empower you to feel confident in your own skin — from a relaxed t-shirt to a statement dress to everyday activewear, our collections celebrate individuality.

2. Comfort without compromise
Looking good should never mean feeling uncomfortable. We prioritise fabrics, fits and cuts that move with you, breathe with you, and support your lifestyle.

3. Style for every moment
Life isn't one-dimensional, and neither is your wardrobe. From casual days to active hours and dressed-up evenings, ${STORE_NAME} offers styles that transition effortlessly.

4. Inclusive and approachable fashion
Fashion should feel welcoming, not intimidating. Our collections are designed for real bodies and real lives.

Our collections
${STORE_NAME} offers a thoughtfully curated range of clothing that blends trend-forward design with everyday practicality. Our key categories include:

• Dresses — from effortless day dresses to elevated evening styles, designed to flatter, flow and fit seamlessly into your lifestyle.
• Tops & blouses — minimal basics or standout silhouettes, easy to style and easy to love.
• Jeans & trousers — designed for comfort, structure and long-lasting wear so you can move with confidence all day long.
• T-shirts — soft, durable and stylish enough to wear on repeat.
• Skirts — from casual chic to polished looks, adapting to your mood and moment.
• Activewear — function plus fashion, helping you feel motivated, comfortable and confident whether you're working out or winding down.

Each category reflects our commitment to quality, fit and modern design.

Why shop with ${STORE_NAME}?
Curated with care — we don't believe in overwhelming you with endless options. Every product is carefully selected to meet our quality and style standards.
Quality you can trust — from stitching to fabric selection, we focus on delivering clothing that lasts and feels good wear after wear.
Seamless online experience — shopping should be simple and enjoyable; our website is designed to help you browse, choose and check out with ease.
Customer-first approach — at ${STORE_NAME}, you are at the heart of everything we do. We listen, we learn, and we continuously improve.

Powered by ${LEGAL_NAME}
${STORE_NAME} is a brand operated by ${LEGAL_NAME}, a company incorporated in India and driven by innovation, technology and customer-centric thinking. This foundation allows us to focus on what matters most — creating a fashion platform you can trust and love.

Our vision
We see ${STORE_NAME} as more than just an online clothing store. Our goal is to build a community — a space where customers feel seen, supported and inspired through fashion. As we grow, we aim to expand our collections, explore sustainable practices, and continue evolving with our customers' needs.

Whether you're dressing for comfort, confidence or celebration, ${STORE_NAME} is here to be part of your journey — one outfit at a time.

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
${LEGAL_NAME}
${COMPANY_ADDR_LINE}

Order help
For order-related questions, please include your order number (e.g. ASC-XXXXXXXX-XXXX) when writing in. You can also see your order status at /account.

We look forward to hearing from you and will try to respond within three business days.`,
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    body: `Orders & shipping

How long does delivery take?
Most orders ship within 1–2 business days and reach metro cities in 3–5 business days. Tier-2/3 cities may take 5–8 business days. You'll receive tracking by email and SMS once your order is dispatched.

Do you ship outside India?
Not at the moment. We ship across India only.

How do I track my order?
Sign in and visit /account to see live status and the courier tracking link. You'll also receive shipping updates by email/SMS.

Do you offer Cash on Delivery?
Yes, COD is available on most orders up to ₹5,000. A small COD handling fee may apply at checkout.

Returns

What's your return window?
You can request a return within 7 days of delivery. The product must be unworn, unwashed, with tags intact and in original packaging.

How do refunds work?
Once we receive and inspect the returned item, refunds are issued to the original payment method within 3–5 business days. COD refunds are issued via bank transfer or store credit.

Are there items I can't return?
Innerwear, swimwear, accessories and final-sale items cannot be returned for hygiene/policy reasons. Please check the product page before ordering.

Account

I forgot my password.
Use /forgot-password to receive a reset link.

How do I update my address?
Visit /account/profile.`,
  },
  {
    slug: "shipping",
    title: "Shipping policy",
    body: `${STORE_NAME} is committed to excellence and to the full satisfaction of our customers. We proudly offer shipping services across India and we are doing everything in our power to get your order to you as soon as possible. Please consider any holidays that might impact delivery times.

1. Shipping
All orders are processed and shipped out in 1–2 business days, with delivery typically completed in 3–8 business days depending on your location. Orders are not shipped or delivered on weekends or public holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days; in that case we will contact you by email.

2. Wrong address
It is the customer's responsibility to make sure that the shipping address entered at checkout is correct. We do our best to speed up processing and shipping time, so there is always only a small window to correct an incorrect address. Please contact ${SUPPORT_EMAIL} immediately if you believe you have provided an incorrect shipping address.

3. Undeliverable orders
Orders that are returned to us as undeliverable because of incorrect shipping information may be subject to a restocking fee, to be determined by us at our sole discretion.

4. Lost or stolen packages
${STORE_NAME} is not responsible for packages that are lost or stolen after the courier confirms delivery. If your tracking information shows that your package was delivered to your address but you have not received it, please contact ${SUPPORT_EMAIL} within 48 hours so we can raise a query with the courier, and report it to your local authorities if required.

5. Out-of-stock items
In the event one or more items in your order is out of stock, we will wait for all items to be available before dispatching the order. If you would prefer a partial dispatch or refund of the unavailable item, write to ${SUPPORT_EMAIL}.

6. Shipping charges
Shipping charges for orders placed on ${SITE_HOST} are calculated based on factors such as order value, delivery location, product weight and applicable logistics costs.

• Free shipping — we may offer free shipping on select orders, promotional campaigns, or above a specified order value. Such offers will be clearly displayed on the website.
• Standard shipping — for orders that do not qualify for free shipping, applicable shipping charges will be displayed at checkout before payment is completed.
• Location-based — shipping charges may vary depending on the delivery address, especially for remote or hard-to-reach areas.
• Additional charges — in certain cases, additional charges such as Cash on Delivery (COD) handling fees may apply. These will also be shown at checkout.

We reserve the right to modify shipping charges at any time without prior notice; however, the charges applicable to your order will be those displayed at the time of checkout.

7. Acceptance
By accessing our site and placing an order, you have willingly accepted the terms of this Shipping Policy.

8. Contact
For any questions or comments about shipping, contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE}.`,
  },
  {
    slug: "returns",
    title: "Return & refund policy",
    body: `Last updated: ${TODAY}

Thank you for shopping at ${STORE_NAME}. If for any reason you are not completely satisfied with a purchase, we invite you to review our policy on refunds and returns. The following terms are applicable for any products that you purchased from us.

Definitions
For the purposes of this policy:
• "Company", "we", "us" or "our" refers to ${LEGAL_NAME}, operating ${STORE_NAME}.
• "Goods" means the items offered for sale on the site.
• "Order" means a request by you to purchase Goods from us.
• "Service" / "Website" refers to ${STORE_NAME}, accessible at ${SITE_URL}.
• "You" means the individual using the Service.

Your order cancellation rights
You are entitled to cancel your order before it is shipped, without giving any reason. To do so, write to ${SUPPORT_EMAIL} from the email used to place the order, with the order number in the subject. We will reimburse you no later than 14 days from the day on which we receive the returned goods, using the same means of payment you used for the order, with no fees charged to you.

Conditions for returns
For Goods to be eligible for a return, please make sure:
• The Goods were purchased in the last 7 days (counting from delivery date).
• The Goods are unworn, unwashed, and in their original condition with all tags attached.
• The Goods are in their original packaging.

We reserve the right to refuse returns of any merchandise that does not meet the above conditions, in our sole discretion.

Final-sale exclusions
The following are not eligible for return: innerwear, swimwear, accessories such as jewellery, and products marked "Final sale" on the product page.

Returning goods
We will arrange a return pickup from the address provided on the order. Once the goods are received and verified, we will process your refund. Refunds are made to the original source of payment within 3–5 business days after the returned goods are received and inspected. For Cash-on-Delivery orders, refunds are issued via bank transfer or store credit.

Please ensure that the goods are in their original condition and packaging at the time of return. If you face any issue with the return process, you can contact our support team for assistance.

Contact
For any questions about our Return and Refund Policy, contact:
Email: ${SUPPORT_EMAIL}
Phone: ${SUPPORT_PHONE}`,
  },
  {
    slug: "terms",
    title: "Terms & conditions",
    body: `Last updated: ${TODAY}

Welcome to ${STORE_NAME}.

These terms and conditions outline the rules and regulations for the use of the ${STORE_NAME} website, located at ${SITE_URL}. By accessing this website you agree to accept these terms and conditions. Do not continue to use ${STORE_NAME} if you do not agree to take all of the terms and conditions stated on this page.

These Terms and Conditions govern the use of this website and the services offered by ${LEGAL_NAME}, a company incorporated and existing under the laws of India.

The following terminology applies to these Terms and Conditions and any related agreements: "Client", "You" and "Your" refers to you, the person accessing this website and complying with the Company's terms. "The Company", "Ourselves", "We", "Our" and "Us" refers to ${LEGAL_NAME}. "Party" or "Parties" refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner, in accordance with and subject to the prevailing law of Delhi, India.

Cookies
We employ the use of cookies. By accessing ${STORE_NAME} you agree to the use of cookies in agreement with our Privacy Policy. Most interactive websites use cookies to retrieve user details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our partners may also use cookies.

Licence
Unless otherwise stated, ${LEGAL_NAME} and/or its licensors own the intellectual property rights for all material on ${STORE_NAME}. All intellectual property rights are reserved. You may access this material from ${STORE_NAME} for your own personal use, subject to restrictions set in these terms and conditions.

You must not:
• Republish material from ${STORE_NAME}
• Sell, rent or sub-licence material from ${STORE_NAME}
• Reproduce, duplicate or copy material from ${STORE_NAME}
• Redistribute content from ${STORE_NAME}

Hyperlinking to our content
The following organisations may link to our website without prior written approval: government agencies, search engines, news organisations, online directory distributors (in the same manner as they hyperlink to other listed businesses), and system-wide accredited businesses (excluding charity solicitations).

These organisations may link to our home page, to publications, or to other website information so long as the link (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products or services; and (c) fits within the context of the linking party's site.

We may consider link requests from other reputable businesses, associations or educational institutions. To request a link, write to ${SUPPORT_EMAIL} including your name, organisation, contact information, and the URLs you intend to link from / to. Allow 2–3 weeks for a response. No use of the ${STORE_NAME} logo or other artwork is allowed for linking absent a separate trademark licence agreement.

iFrames
Without prior approval and written permission, you may not create frames around our webpages that alter in any way the visual presentation or appearance of our website.

Content liability
We shall not be held responsible for any content that appears on your website. You agree to protect and defend us against all claims arising on your website. No link(s) should appear on any website that may be interpreted as libellous, obscene or criminal, or which infringes any third-party rights.

Reservation of rights
We reserve the right to request that you remove all links or any particular link to our website. You agree to immediately remove all links to our website upon request. We also reserve the right to amend these terms and conditions and our linking policy at any time. By continuously linking to our website, you agree to be bound by and follow these linking terms and conditions.

Removal of links
If you find any link on our website that is offensive for any reason, contact ${SUPPORT_EMAIL}. We will consider requests to remove links but are not obligated to do so or to respond directly.

Disclaimer
To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will: (a) limit or exclude our or your liability for death or personal injury; (b) limit or exclude our or your liability for fraud or fraudulent misrepresentation; (c) limit any of our or your liabilities in any way that is not permitted under applicable law; or (d) exclude any liabilities that may not be excluded under applicable law.

The limitations and prohibitions of liability set in this section and elsewhere in this disclaimer (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including in contract, in tort and for breach of statutory duty.

Indemnity
You agree to indemnify, defend and hold harmless ${LEGAL_NAME}, its directors, employees, partners and affiliates from and against any losses, liabilities, claims, damages, demands, costs and expenses (including legal fees) arising out of or related to: (a) your use of the website or services; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; or (d) any infringement of intellectual property or other rights of any third party.

Account responsibility
If you create an account on our website, you are responsible for maintaining the confidentiality of your account credentials, including your username and password, and you accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account or any other breach of security. We shall not be liable for any loss or damage arising from your failure to comply with this obligation.

Force majeure
We shall not be held liable for any failure or delay in performance of our obligations under these Terms if such failure or delay is due to events beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, civil disturbances, government actions, strikes, pandemics, supply chain disruptions, or internet/service outages. In such cases, our obligations shall be suspended for the duration of the force majeure event.

Jurisdiction
Any dispute arising under these terms and conditions shall be subject to the exclusive jurisdiction of the courts at Delhi, India.

Contact
For any questions about these Terms, contact ${SUPPORT_EMAIL}.

Registered office
${LEGAL_NAME}, ${COMPANY_ADDR_LINE}.`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    body: `Last updated: ${TODAY}

At ${STORE_NAME}, one of our main priorities is the privacy of our visitors. This Privacy Policy describes the types of information that is collected and recorded by ${STORE_NAME} and how we use it.

If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact ${SUPPORT_EMAIL}.

This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they share with and/or that is collected by ${STORE_NAME}. This policy is not applicable to any information collected offline or via channels other than this website.

This Privacy Policy governs the use of this website and the services offered by ${LEGAL_NAME}, a company incorporated and existing under the laws of India.

Consent
By using our website, you hereby consent to our Privacy Policy and agree to its terms.

Information we collect
The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.

If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.

When you register for an account or place an order, we may ask for your contact information including name, address, email address, telephone number, and shipping address.

How we use your information
We use the information we collect in various ways, including to:
• Provide, operate and maintain our website and process your orders
• Improve, personalise and expand our website and services
• Understand and analyse how you use our website
• Develop new products, services, features and functionality
• Communicate with you, either directly or through partners, including for customer service, to provide updates and information relating to the website, and (with your consent) for marketing and promotional purposes
• Send you transactional and service emails
• Detect and prevent fraud

Data retention
We retain your information only for as long as necessary to fulfil the purposes for which it was collected, or as required by law.
• Personal information — we retain your personal information as long as your account is active or as needed to provide you services.
• Usage data — we may retain usage data for 7–21 days to analyse trends and improve our services.
When your information is no longer needed, we will securely delete or anonymise it.

Log files
${STORE_NAME} follows a standard procedure of using log files. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, and referring/exit pages. These are not linked to any information that is personally identifiable. The purpose of the information is for analysing trends, administering the site, tracking user movement on the website, and gathering aggregate demographic information.

Cookies and web beacons
Like any other website, ${STORE_NAME} uses cookies. These cookies are used to store information including visitor preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimise the user experience by customising our web page content based on visitor browser type and/or other information.

Payment & logistics data handling
We collect, process and store certain information related to payments and logistics to facilitate order processing, payment transactions, delivery of products, and customer support.

Payment information — payment-related data such as transaction details, payment method type, billing information and transaction identifiers may be collected and processed through secure third-party payment gateway providers. We do not store or process sensitive payment information such as full credit/debit card numbers, CVV or banking credentials on our servers. Such information is handled directly by authorised payment service providers in accordance with their privacy and security standards.

Logistics and delivery information — to ensure timely and accurate delivery, we may collect and share information including your name, contact number, delivery address and order details with third-party logistics and delivery partners. These partners are authorised to use the information solely for the purpose of fulfilling deliveries and related services.

Data security and confidentiality — we implement reasonable technical and organisational measures to protect payment and logistics-related data from unauthorised access, misuse, alteration or disclosure. Third-party service providers are contractually obligated to safeguard personal data and comply with applicable data protection laws.

Third-party privacy policies
${STORE_NAME}'s Privacy Policy does not apply to other advertisers or websites. We advise you to consult the respective Privacy Policies of these third-party services for more detailed information. You can choose to disable cookies through your individual browser options.

Legal compliance (Information Technology Act, 2000)
This Privacy Policy is prepared in accordance with the provisions of the Information Technology Act, 2000 and the rules made thereunder, including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.

We are committed to ensuring that your personal information is protected in compliance with applicable Indian laws. We collect, use, store and process personal data in accordance with the requirements prescribed under these laws.

Compliance with the Digital Personal Data Protection Act, 2023
We are committed to protecting your personal data and ensuring transparency in how it is collected, used, and processed. In accordance with the Digital Personal Data Protection Act, 2023 of India ("DPDP Act"), we process your personal data only for lawful purposes and with your consent, wherever applicable.

As a user, you have the following rights under the DPDP Act:
• The right to access information about your personal data processed by us
• The right to correction and erasure of your personal data
• The right to withdraw consent at any time
• The right to grievance redressal
• The right to nominate another individual to exercise your rights in case of incapacity or death

We implement reasonable security safeguards to protect your personal data from unauthorised access, disclosure, alteration or destruction.

Grievance Officer
If you have any concerns or requests regarding your personal data, you may contact our Grievance Officer at ${SUPPORT_EMAIL}.

Children's information
Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in and/or monitor and guide their online activity.

${STORE_NAME} does not knowingly collect any personal identifiable information from children under the age of 18. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately at ${SUPPORT_EMAIL} and we will do our best efforts to promptly remove such information from our records.

Updates to this policy
We may update this Privacy Policy from time to time to remain compliant with applicable laws, including the DPDP Act. The latest version will always be posted on this page with the "Last updated" date.

Contact
${SUPPORT_EMAIL} · ${LEGAL_NAME}, ${COMPANY_ADDR_LINE}.`,
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    body: `${STORE_NAME} uses cookies and similar technologies to make the site work, to improve your experience, and (with your consent) to measure performance and personalise marketing.

What are cookies?
Cookies are small text files placed on your device by websites you visit. They are widely used to make sites work or work more efficiently, and to provide information to the site owner.

Types we use
• Strictly necessary — required for the site to function (cart, checkout, login).
• Performance — anonymised analytics so we can improve the site.
• Marketing — only set when you opt in.

Managing cookies
Most browsers let you block or delete cookies. Visit aboutcookies.org for guidance on how to manage cookies in your browser. Note that disabling certain cookies may affect site functionality (for example, your cart may not be remembered between visits).

Contact
Questions about cookies: ${SUPPORT_EMAIL}.`,
  },
  {
    slug: "size-guide",
    title: "Size guide",
    body: `Use this as a starting point. Fit can vary by style — when in doubt, write to us at ${SUPPORT_EMAIL} with the product and your measurements and we'll help.

Women's tops (in inches)
XS — bust 32, waist 24
S — bust 34, waist 26
M — bust 36, waist 28
L — bust 38, waist 30
XL — bust 40, waist 32

Women's bottoms (in inches)
XS — waist 24, hips 34
S — waist 26, hips 36
M — waist 28, hips 38
L — waist 30, hips 40
XL — waist 32, hips 42

How to measure
• Bust — around the fullest part of the chest, keeping the tape level.
• Waist — around the narrowest part of the natural waist.
• Hips — around the fullest part, with feet together.

Tip: between sizes, size up for a relaxed fit, size down for a tailored fit.`,
  },
  {
    slug: "sustainability",
    title: "Sustainability",
    body: `We're a small team trying to do better, every season. Here's where we are.

Materials
We prefer natural fibres — cotton, linen, viscose blends — and partner with mills that share our values.

Production
Our garments are produced in small batches by partner manufacturers in India who are paid fairly and operate in safe, audited workplaces.

Packaging
All ${STORE_NAME} parcels ship in recyclable kraft paper or biodegradable mailers. Hang tags are recycled paper. We're working on eliminating plastic from our packaging entirely.

Care for longevity
Buying less and wearing longer is the most sustainable thing any of us can do. Each ${STORE_NAME} piece comes with care instructions designed to extend its life.

We don't claim to be perfect. We share progress updates — write to us at ${SUPPORT_EMAIL} to receive them.`,
  },
  {
    slug: "careers",
    title: "Careers",
    body: `We're a small, ambitious team building a better Indian clothing brand from the ground up. We hire for craft, ownership, and care.

Currently we're not actively hiring, but we always like meeting good people. If you're interested in working with ${STORE_NAME}, write to ${SUPPORT_EMAIL} with a short note about yourself and what you'd want to work on.

What we offer
• Meaningful work on a brand that's growing fast
• Direct access to founders
• Flexible hours and generous time off`,
  },
  {
    slug: "press",
    title: "Press",
    body: `For press inquiries, partnerships and image requests, contact ${SUPPORT_EMAIL}.

We can provide:
• High-resolution product images
• Lookbooks and seasonal campaign assets
• Founder quotes and interview availability

Please include the publication, deadline, and angle in your initial email so we can respond quickly.`,
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
