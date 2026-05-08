/**
 * Generate a 100-SKU men's catalog with original copy and royalty-free
 * Unsplash imagery (commercial-use licence, no attribution required).
 *
 * Imports as DRAFT by default so the team can review before publishing.
 * Reuses the same persistence layer as the WooCommerce importers.
 *
 * Run:
 *   npm run generate:men                 # full run, draft, with images
 *   npm run generate:men -- --dry-run    # preview only, no DB writes
 *   npm run generate:men -- --limit=5    # first 5 products
 *   npm run generate:men -- --skip-images
 *   npm run generate:men -- --status=ACTIVE   # publish immediately (not advised)
 *   npm run generate:men -- --update     # overwrite existing same-slug products
 */

import {
  type NormalizedProduct,
  persistProduct,
  slugify,
} from "./lib/woo-persist";
import { prisma } from "../src/lib/prisma";

// ---------------- CLI args ----------------

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      args[k] = v ?? true;
    }
  }
  return args;
}
const ARGS = parseArgs(process.argv);
const DRY = !!ARGS["dry-run"];
const LIMIT = ARGS.limit ? Number(ARGS.limit) : Infinity;
const SKIP_IMAGES = !!ARGS["skip-images"];
const STATUS = (ARGS.status as string) === "ACTIVE" ? "ACTIVE" : "DRAFT";
const UPDATE = !!ARGS.update;

// ---------------- Image pool ----------------
//
// All photos are from Unsplash, which licenses them for commercial and
// non-commercial use without attribution. (See https://unsplash.com/license.)
// We curate a small pool per category so visual identity stays coherent and
// the same SKU never gets a wildly off-category image. The persister downloads
// each URL and re-uploads to Cloudinary, so even if Unsplash later changes the
// URL the hosted version is safe.

const IMAGES: Record<string, string[]> = {
  shirts: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=80",
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80",
    "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&q=80",
    "https://images.unsplash.com/photo-1602810316693-3667c854239a?w=1200&q=80",
  ],
  tshirts: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80",
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1200&q=80",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80",
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80",
  ],
  polos: [
    "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=1200&q=80",
    "https://images.unsplash.com/photo-1622445275576-721325763afe?w=1200&q=80",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80",
    "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=1200&q=80",
  ],
  jeans: [
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80",
    "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=1200&q=80",
    "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=1200&q=80",
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1200&q=80",
  ],
  trousers: [
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&q=80",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
  ],
  jackets: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80",
    "https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=1200&q=80",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&q=80",
  ],
  hoodies: [
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80",
    "https://images.unsplash.com/photo-1614495039944-0a55d6d4a51e?w=1200&q=80",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&q=80",
    "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=1200&q=80",
  ],
  shorts: [
    "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=1200&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&q=80",
  ],
  ethnic: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=1200&q=80",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80",
    "https://images.unsplash.com/photo-1604335079800-b9bd05c9c45c?w=1200&q=80",
  ],
  active: [
    "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1200&q=80",
    "https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&q=80",
  ],
};

// ---------------- Catalog ----------------

type CatKey = keyof typeof IMAGES;
type Spec = {
  title: string;
  category: CatKey;
  collectionLabel: string; // human label for sub-collection
  basePrice: number; // ₹
  comparePrice?: number; // ₹, original / strikethrough
  description: string;
  tags?: string;
  /** Override default size set if the category needs different sizes. */
  sizes?: string[];
};

const STD_SIZES = ["S", "M", "L", "XL", "XXL"];

const CATALOG: Spec[] = [
  // ------------------- SHIRTS (12) -------------------
  s("Men's Classic White Oxford Button-Down Shirt", "shirts", "Shirts", 1499, 1999, "A timeless oxford-cotton shirt in clean white. Tailored regular fit, button-down collar, and reinforced stitching. Pairs with denim, chinos and tailoring alike."),
  s("Men's Navy Blue Slim-Fit Oxford Shirt", "shirts", "Shirts", 1499, 1999, "Cool navy oxford in a contemporary slim cut. Soft brushed cotton, mother-of-pearl-style buttons, and a clean curved hem made for tucked or untucked wear."),
  s("Men's Sky Blue Casual Linen Shirt", "shirts", "Shirts", 1399, 1899, "Lightweight linen-blend shirt for warm-weather days. Breathable, slightly textured, and cut with a relaxed silhouette and chest pocket."),
  s("Men's Black Premium Slim-Fit Formal Shirt", "shirts", "Shirts", 1599, 2199, "Sharp jet-black formal shirt in a slim cut. Wrinkle-resistant cotton blend with a subtle sheen — ideal for office wear and evening events."),
  s("Men's Striped White & Blue Casual Shirt", "shirts", "Shirts", 1199, 1599, "Classic vertical-stripe shirt in soft cotton. Versatile enough for the office, a brunch, or weekend layering."),
  s("Men's Pink Pastel Regular-Fit Shirt", "shirts", "Shirts", 1199, 1599, "Powder-pink button-down in lightweight cotton — a contemporary shade that works as a fresh alternative to plain white."),
  s("Men's Olive Green Cargo Utility Shirt", "shirts", "Shirts", 1399, 1799, "Heavy-cotton utility overshirt in deep olive. Twin chest cargo pockets and metal snap buttons for an everyday workwear look."),
  s("Men's Checked Black & White Flannel Shirt", "shirts", "Shirts", 1499, 1999, "Cosy brushed flannel in a classic windowpane check. Layer over a tee or wear solo with denim — a winter staple."),
  s("Men's Maroon Mandarin-Collar Shirt", "shirts", "Shirts", 1399, 1799, "Mandarin-collar shirt in rich maroon. Smart-casual silhouette with a clean, collarless neckline that pairs well under a blazer."),
  s("Men's Beige Linen Half-Sleeve Shirt", "shirts", "Shirts", 1199, 1599, "Half-sleeve linen shirt in soft beige. Made for Indian summers — relaxed fit, breathable, easy to throw on."),
  s("Men's Denim-Look Indigo Overshirt", "shirts", "Shirts", 1599, 1999, "Denim-effect overshirt in deep indigo. Doubles as a lightweight jacket; layers over tees, rolls neatly to the elbows."),
  s("Men's Grey Micro-Print Formal Shirt", "shirts", "Shirts", 1499, 1899, "Subtle micro-printed grey shirt with a clean tailored cut. Adds depth to a formal outfit without being loud."),

  // ------------------- T-SHIRTS (14) -------------------
  s("Men's Plain Black Cotton Crew Tee", "tshirts", "T-Shirts", 599, 899, "The everyday black tee. 100% combed cotton, breathable knit, ribbed neckline, no logo — wears in beautifully."),
  s("Men's Plain White Cotton Crew Tee", "tshirts", "T-Shirts", 599, 899, "Clean white tee in heavyweight combed cotton. Pre-shrunk, bias-cut shoulders, no twisting after wash."),
  s("Men's Heather Grey Crew-Neck Tee", "tshirts", "T-Shirts", 599, 899, "Soft heather grey tee in a relaxed regular fit — the layer-it-with-anything basic every wardrobe needs."),
  s("Men's Olive Green Pocket Tee", "tshirts", "T-Shirts", 699, 999, "Earthy olive cotton tee with a single chest pocket. Garment-washed for a lived-in hand-feel from day one."),
  s("Men's Striped Navy & White Tee", "tshirts", "T-Shirts", 749, 999, "Breton-style horizontal stripes in navy on white. A nautical classic that works year-round."),
  s("Men's Maroon Solid Crew Tee", "tshirts", "T-Shirts", 599, 899, "Deep maroon tee in soft cotton. Rich colour that holds up wash after wash."),
  s("Men's Tan Beige Solid Tee", "tshirts", "T-Shirts", 599, 899, "Warm tan basic — a quietly modern alternative to the usual blacks and whites."),
  s("Men's Black Oversized Streetwear Tee", "tshirts", "T-Shirts", 799, 1199, "Oversized boxy fit, dropped shoulders, heavyweight knit. Streetwear-ready, layers cleanly under jackets."),
  s("Men's Sage Green Henley Tee", "tshirts", "T-Shirts", 749, 1099, "Three-button henley in soft sage. A grown-up upgrade to the round-neck tee."),
  s("Men's Mustard Yellow Crew Tee", "tshirts", "T-Shirts", 599, 899, "Bold mustard tee in cotton jersey. A statement colour with everyday softness."),
  s("Men's Royal Blue Solid Tee", "tshirts", "T-Shirts", 599, 899, "Vibrant royal blue tee in 100% cotton. Holds its shape and colour through repeated wash cycles."),
  s("Men's Charcoal Grey Solid Tee", "tshirts", "T-Shirts", 599, 899, "Deep charcoal tee — a refined alternative to plain black, pairs beautifully with denim and tailoring alike."),
  s("Men's White Long-Sleeve Cotton Tee", "tshirts", "T-Shirts", 799, 1099, "Lightweight long-sleeve white tee. Ideal as a layering piece in cooler months or a clean stand-alone in summer."),
  s("Men's Forest Green Acid-Wash Tee", "tshirts", "T-Shirts", 799, 1099, "Acid-washed cotton tee in deep forest green. Subtle vintage character without trying too hard."),

  // ------------------- POLOS (8) -------------------
  s("Men's Navy Blue Cotton Pique Polo", "polos", "Polo Shirts", 999, 1499, "Classic three-button polo in soft pique cotton. Ribbed cuffs, contrast inner placket — a wardrobe essential."),
  s("Men's White Slim-Fit Polo", "polos", "Polo Shirts", 999, 1499, "Crisp white polo in a tailored slim cut. Office-appropriate, weekend-ready."),
  s("Men's Black Premium Polo", "polos", "Polo Shirts", 1099, 1599, "Heavyweight black polo with reinforced collar and side vents. Holds shape after countless washes."),
  s("Men's Light Grey Two-Tone Polo", "polos", "Polo Shirts", 1099, 1499, "Light grey polo with contrast navy collar trim. Subtle detail, smart finish."),
  s("Men's Maroon Solid Cotton Polo", "polos", "Polo Shirts", 999, 1399, "Deep maroon polo in pique cotton. A grown-up colour that pairs with chinos, denim and tailoring."),
  s("Men's Sage Olive Mercerised Polo", "polos", "Polo Shirts", 1199, 1599, "Mercerised cotton polo in muted olive. The mercerisation gives a soft sheen and improved colour-fastness."),
  s("Men's Striped Navy & Cream Polo", "polos", "Polo Shirts", 1099, 1499, "Engineered navy-cream stripe polo. A casual update to a wardrobe staple."),
  s("Men's Royal Blue Slim Pique Polo", "polos", "Polo Shirts", 999, 1399, "Vivid royal blue polo, slim cut. Brings energy to denim and chinos alike."),

  // ------------------- JEANS (10) -------------------
  s("Men's Dark-Wash Slim-Fit Jeans", "jeans", "Jeans", 1799, 2499, "Dark indigo wash, slim through the leg, slight stretch for comfort. Pairs with everything."),
  s("Men's Mid-Wash Straight-Fit Jeans", "jeans", "Jeans", 1799, 2299, "Classic mid-blue wash in a straight leg. Sits naturally at the waist, no break to the leg."),
  s("Men's Black Slim-Fit Stretch Jeans", "jeans", "Jeans", 1899, 2499, "Jet-black slim jeans with 2% elastane for movement. The most versatile colour you can own in denim."),
  s("Men's Light-Wash Distressed Jeans", "jeans", "Jeans", 1899, 2499, "Light-blue jeans with subtle distressing at the knees. Slim-tapered leg, weekend-ready."),
  s("Men's Indigo Tapered-Fit Jeans", "jeans", "Jeans", 1999, 2599, "Modern tapered cut — relaxed at the thigh, narrow at the ankle. Indigo wash, raw selvedge-style finish."),
  s("Men's Charcoal Grey Slim Jeans", "jeans", "Jeans", 1799, 2399, "Deep charcoal jeans with a clean slim cut. Smart enough for the office, casual enough for weekends."),
  s("Men's White Slim-Fit Jeans", "jeans", "Jeans", 1799, 2299, "Crisp white denim, slim cut. A summer staple for warm-weather styling."),
  s("Men's Olive Green Cargo Jeans", "jeans", "Jeans", 1899, 2499, "Cargo-pocket jeans in army-olive denim. Utility detailing meets a tailored fit."),
  s("Men's Acid-Wash Vintage Jeans", "jeans", "Jeans", 1899, 2599, "Acid-washed denim in a relaxed straight cut — vintage-inspired character without looking costume-y."),
  s("Men's Black Distressed Skinny Jeans", "jeans", "Jeans", 1899, 2499, "Black skinny jeans with knee-rip detailing. High-stretch denim that holds shape all day."),

  // ------------------- TROUSERS / CHINOS (10) -------------------
  s("Men's Khaki Slim-Fit Chinos", "trousers", "Trousers & Chinos", 1399, 1899, "Classic khaki chino in a clean slim cut. Brushed cotton with a touch of stretch — a wardrobe foundation."),
  s("Men's Navy Cotton Chinos", "trousers", "Trousers & Chinos", 1399, 1899, "Navy cotton chinos with a flat front and clean side seams. Smart-casual at its most useful."),
  s("Men's Beige Stone Chinos", "trousers", "Trousers & Chinos", 1399, 1899, "Soft beige chinos in lightweight cotton — pairs beautifully with whites, navies and pastels."),
  s("Men's Charcoal Grey Formal Trousers", "trousers", "Trousers & Chinos", 1599, 2199, "Tailored charcoal grey trouser in wool-blend twill. Slim through the leg, finished with a clean hem."),
  s("Men's Olive Tapered Chinos", "trousers", "Trousers & Chinos", 1499, 1999, "Olive cotton chinos in a tapered fit. Relaxed up top, narrow at the ankle for a modern silhouette."),
  s("Men's Black Formal Slim Trousers", "trousers", "Trousers & Chinos", 1499, 1999, "Versatile slim-fit black trouser. Office-ready with a notched waistband and finished interior."),
  s("Men's Brown Corduroy Trousers", "trousers", "Trousers & Chinos", 1599, 2199, "Mid-weight corduroy trouser in warm brown. Soft hand-feel, perfect for cooler months."),
  s("Men's White Linen Drawstring Trousers", "trousers", "Trousers & Chinos", 1299, 1799, "Lightweight white linen trousers with a soft drawstring waist. Beach-to-bar styling."),
  s("Men's Light Grey Slim Chinos", "trousers", "Trousers & Chinos", 1399, 1899, "Cool light-grey chinos — a cleaner everyday alternative to navy or khaki."),
  s("Men's Wine Burgundy Tailored Trousers", "trousers", "Trousers & Chinos", 1699, 2299, "Burgundy tailored trousers in soft wool blend. A fresh occasion-wear colour."),

  // ------------------- JACKETS (8) -------------------
  s("Men's Black Bomber Jacket", "jackets", "Jackets", 2499, 3499, "Classic MA-1-style bomber in matte black. Ribbed cuffs and hem, satin-feel shell, smooth nylon lining."),
  s("Men's Olive Field Utility Jacket", "jackets", "Jackets", 2799, 3799, "Cotton field jacket in olive green. Four utility pockets, snap front, broken-in finish."),
  s("Men's Navy Blue Quilted Jacket", "jackets", "Jackets", 2499, 3499, "Diamond-quilted lightweight jacket in navy. Wind-resistant, packable, perfect for layering."),
  s("Men's Brown Faux-Suede Trucker Jacket", "jackets", "Jackets", 2999, 3999, "Faux-suede trucker in warm tobacco brown. Vintage Western-style detailing, soft modern hand."),
  s("Men's Black Faux-Leather Biker Jacket", "jackets", "Jackets", 3499, 4999, "Asymmetric biker in soft faux-leather. Zip detailing, quilted shoulders, lined for comfort."),
  s("Men's Khaki Lightweight Windbreaker", "jackets", "Jackets", 1999, 2799, "Packable khaki windbreaker — water-repellent, bag-pocket compactable, always in your bag."),
  s("Men's Grey Wool-Blend Overcoat", "jackets", "Jackets", 3999, 5499, "Tailored single-breasted overcoat in grey wool blend. Notched lapels, two-button closure — your formal-weather upgrade."),
  s("Men's Denim Trucker Jacket", "jackets", "Jackets", 2299, 3199, "Mid-wash denim trucker with copper rivets and chest pocket flaps. The eternal wardrobe classic."),

  // ------------------- HOODIES & SWEATSHIRTS (10) -------------------
  s("Men's Black Pullover Hoodie", "hoodies", "Hoodies & Sweatshirts", 1499, 1999, "Heavyweight black hoodie in brushed-back fleece. Drawstring hood, kangaroo pocket, ribbed cuffs."),
  s("Men's Heather Grey Pullover Hoodie", "hoodies", "Hoodies & Sweatshirts", 1499, 1999, "Soft heather grey hoodie — the wardrobe staple every guy wears more than they admit."),
  s("Men's Navy Blue Zip-Up Hoodie", "hoodies", "Hoodies & Sweatshirts", 1599, 2099, "Full-zip hoodie in deep navy. YKK-style zipper, fleece-backed for warmth without bulk."),
  s("Men's Olive Green Crew Sweatshirt", "hoodies", "Hoodies & Sweatshirts", 1299, 1799, "Crew-neck sweatshirt in olive — a cleaner, less casual alternative to the hoodie."),
  s("Men's Maroon Pullover Hoodie", "hoodies", "Hoodies & Sweatshirts", 1499, 1999, "Rich maroon hoodie with a relaxed boxy cut and brushed inside. Brings warmth without weight."),
  s("Men's Cream White Crew Sweatshirt", "hoodies", "Hoodies & Sweatshirts", 1399, 1799, "Soft cream sweatshirt in heavy cotton-blend fleece. The neutral that goes with everything."),
  s("Men's Beige Oversized Hoodie", "hoodies", "Hoodies & Sweatshirts", 1599, 2199, "Oversized beige hoodie with dropped shoulders and a long body. Streetwear silhouette in a soft palette."),
  s("Men's Charcoal Grey Quarter-Zip Sweatshirt", "hoodies", "Hoodies & Sweatshirts", 1499, 1999, "Charcoal quarter-zip in midweight fleece — smart-casual layering at its easiest."),
  s("Men's Black Graphic Print Hoodie", "hoodies", "Hoodies & Sweatshirts", 1599, 2199, "Black hoodie with subtle tonal chest print. Heavyweight, soft-handle fleece."),
  s("Men's Forest Green Crew Sweatshirt", "hoodies", "Hoodies & Sweatshirts", 1299, 1799, "Deep forest green crew in cotton-blend fleece. Ribbed neckline, cuffs and hem hold shape after wash."),

  // ------------------- SHORTS (8) -------------------
  s("Men's Navy Cotton Shorts", "shorts", "Shorts", 799, 1199, "Mid-thigh cotton shorts in navy with a flat-front waist and side pockets. Summer wardrobe essential."),
  s("Men's Khaki Cargo Shorts", "shorts", "Shorts", 899, 1299, "Six-pocket cargo shorts in khaki. Heavy cotton twill, reinforced bartacks at stress points."),
  s("Men's Black Athletic Shorts", "shorts", "Shorts", 799, 1199, "Lightweight athletic shorts with mesh inner liner. Made for the gym or weekend errands alike."),
  s("Men's Olive Drawstring Linen Shorts", "shorts", "Shorts", 899, 1299, "Linen-blend shorts in olive with a soft drawstring waist. Beach-ready, weekend-perfect."),
  s("Men's Grey Sweat Shorts", "shorts", "Shorts", 799, 1199, "Brushed-fleece sweat shorts in heather grey. Loungewear quality, athleisure ready."),
  s("Men's White Cotton Bermuda Shorts", "shorts", "Shorts", 799, 1199, "Crisp white cotton bermudas — knee-length, clean lines, classic styling."),
  s("Men's Beige Slim-Fit Chino Shorts", "shorts", "Shorts", 899, 1199, "Stone-beige chino shorts in a tailored slim cut. Smart enough for restaurant dinners."),
  s("Men's Camo Print Cargo Shorts", "shorts", "Shorts", 999, 1399, "Multi-pocket cargo shorts in subtle woodland camo. Heavy cotton twill, drawcord hem."),

  // ------------------- ETHNIC (10) -------------------
  s("Men's White Cotton Kurta", "ethnic", "Ethnic Wear", 1199, 1699, "Classic white cotton kurta — straight cut, knee-length, side slits, mandarin collar. Pair with churidar or denim."),
  s("Men's Beige Linen Kurta", "ethnic", "Ethnic Wear", 1399, 1899, "Lightweight linen kurta in soft beige. Embroidered placket detail, breathable for Indian summers."),
  s("Men's Maroon Festive Silk-Blend Kurta", "ethnic", "Ethnic Wear", 1799, 2499, "Subtle silk-blend kurta in deep maroon. Festive sheen, comfortable enough for all-day wear."),
  s("Men's Navy Blue Bandhgala-Style Kurta", "ethnic", "Ethnic Wear", 1599, 2199, "Mandarin-collar bandhgala-style kurta in indigo. Slim cut, contrast piping at the placket."),
  s("Men's Grey Modi Jacket (Nehru Vest)", "ethnic", "Ethnic Wear", 1499, 1999, "Classic Nehru-collar vest in soft grey wool blend. Layer over a kurta or shirt for instant occasion-wear."),
  s("Men's Black Embroidered Sherwani-Style Kurta", "ethnic", "Ethnic Wear", 1999, 2799, "Long-line kurta with subtle metallic-thread embroidery on the placket. Festive, slim-cut, modern."),
  s("Men's Cream Cotton Pathani Suit", "ethnic", "Ethnic Wear", 1799, 2499, "Two-piece pathani in soft cream cotton — straight kurta with full sleeves and drawstring salwar."),
  s("Men's Olive Green Short Kurta", "ethnic", "Ethnic Wear", 1299, 1799, "Hip-length short kurta in olive cotton. Modern silhouette, easy to pair with jeans or chinos."),
  s("Men's Off-White Chikankari Kurta", "ethnic", "Ethnic Wear", 1599, 2199, "Off-white kurta with subtle chikankari (white-on-white) hand-look embroidery on the chest panel."),
  s("Men's Burgundy Velvet-Look Kurta", "ethnic", "Ethnic Wear", 1899, 2599, "Soft velvet-look kurta in deep burgundy. Festive without being formal."),

  // ------------------- ACTIVEWEAR (10) -------------------
  s("Men's Black Performance Track Pants", "active", "Activewear", 999, 1499, "Quick-dry track pants in matte black. Tapered leg, zipped pockets, drawcord waist."),
  s("Men's Grey Joggers (Heavy Fleece)", "active", "Activewear", 999, 1399, "Heather grey jogger in brushed-back fleece. Soft, warm, and weekend-perfect."),
  s("Men's Navy Athletic Shorts (5-inch)", "active", "Activewear", 799, 1199, "Five-inch athletic shorts with mesh-lined comfort and zipped key pocket."),
  s("Men's Black Compression T-Shirt", "active", "Activewear", 899, 1299, "Quick-wicking compression tee — ideal as a base layer or solo workout top."),
  s("Men's White Performance Polo", "active", "Activewear", 1099, 1499, "Moisture-wicking performance polo in stretch fabric — golf course to gym."),
  s("Men's Black Track Jacket", "active", "Activewear", 1499, 2199, "Lightweight track jacket with full zip, side pockets and stand collar — gym-ready or weekend-casual."),
  s("Men's Navy Mesh-Panel Tee", "active", "Activewear", 899, 1299, "Performance tee with strategic mesh panels for ventilation. Lightweight, fast-drying."),
  s("Men's Olive Drawstring Joggers", "active", "Activewear", 1099, 1499, "Tapered cotton-blend joggers in olive. Smart enough to leave the gym in."),
  s("Men's Black Yoga / Lounge Pants", "active", "Activewear", 999, 1399, "Soft 4-way stretch lounge pants in matte black. Loungewear comfort with athletic performance."),
  s("Men's Grey Tech Fleece Hoodie", "active", "Activewear", 1599, 2199, "Performance fleece hoodie with soft inner brushing and stretch fabric. The everyday active layer."),
];

function s(
  title: string,
  category: CatKey,
  collectionLabel: string,
  basePrice: number,
  comparePrice: number,
  description: string,
  sizes?: string[],
  tags?: string,
): Spec {
  return { title, category, collectionLabel, basePrice, comparePrice, description, sizes, tags };
}

// ---------------- SKU helper ----------------

const SKU_PREFIX: Record<CatKey, string> = {
  shirts: "ASC-SHT",
  tshirts: "ASC-TEE",
  polos: "ASC-POL",
  jeans: "ASC-JNS",
  trousers: "ASC-TRS",
  jackets: "ASC-JKT",
  hoodies: "ASC-HDY",
  shorts: "ASC-SHR",
  ethnic: "ASC-ETH",
  active: "ASC-ACT",
};

function makeSku(spec: Spec, idx: number, size: string): string {
  // Stable, human-readable per-variant SKU.
  const code = String(idx + 1).padStart(3, "0");
  return `${SKU_PREFIX[spec.category]}-${code}-${size}`;
}

// ---------------- Spec -> NormalizedProduct ----------------

function specToNormalized(spec: Spec, idx: number): NormalizedProduct {
  const sizes = spec.sizes ?? STD_SIZES;
  const variants = sizes.map((size) => ({
    sku: makeSku(spec, idx, size),
    optionName1: "Size",
    optionValue1: size,
    price: spec.basePrice * 100, // -> paise
    compareAtPrice: spec.comparePrice ? spec.comparePrice * 100 : null,
    weightGrams: 350,
    inventoryQty: 50,
  }));

  // Pick 2 images cyclically from the category pool to avoid every product
  // using the same first image.
  const pool = IMAGES[spec.category];
  const start = idx % pool.length;
  const imageUrls = [pool[start], pool[(start + 1) % pool.length]];

  return {
    slug: slugify(spec.title.replace(/^Men's\s*/i, "men ")),
    title: spec.title,
    description: spec.description,
    tags: spec.tags ?? "men, " + spec.collectionLabel.toLowerCase(),
    seoTitle: `${spec.title} | Ascendyl`,
    seoDescription: spec.description.slice(0, 155),
    variants,
    imageUrls,
    collectionTitles: ["Men", spec.collectionLabel],
  };
}

// ---------------- Main ----------------

async function main() {
  console.log(
    `\nMen's catalog generator — ${CATALOG.length} products planned, status=${STATUS}, dryRun=${DRY}, skipImages=${SKIP_IMAGES}, limit=${LIMIT}\n`,
  );

  // Quick category breakdown for sanity
  const breakdown: Record<string, number> = {};
  for (const c of CATALOG) breakdown[c.collectionLabel] = (breakdown[c.collectionLabel] ?? 0) + 1;
  for (const [k, v] of Object.entries(breakdown)) console.log(`  ${k.padEnd(24)} ${v}`);
  console.log();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let imageCount = 0;

  for (let i = 0; i < CATALOG.length && i < LIMIT; i++) {
    const spec = CATALOG[i];
    const np = specToNormalized(spec, i);

    if (DRY) {
      console.log(
        `[${String(i + 1).padStart(3, "0")}/${CATALOG.length}] (dry) ${spec.title} — ${np.variants.length} variants, ${np.imageUrls.length} imgs`,
      );
      continue;
    }

    try {
      const r = await persistProduct(np, {
        status: STATUS,
        update: UPDATE,
        skipImages: SKIP_IMAGES,
        imagesPerProduct: 4,
      });
      const tag =
        r.kind === "created" ? "✓ created"
          : r.kind === "updated" ? "✓ updated"
            : `· skipped (${r.reason})`;
      const imgs = r.kind === "skipped" ? 0 : r.imageCount;
      console.log(
        `[${String(i + 1).padStart(3, "0")}/${CATALOG.length}] ${spec.title.padEnd(60).slice(0, 60)} ${tag}${r.kind !== "skipped" ? ` imgs=${imgs}` : ""}`,
      );
      if (r.kind === "created") created++;
      if (r.kind === "updated") updated++;
      if (r.kind === "skipped") skipped++;
      if (r.kind !== "skipped") imageCount += r.imageCount;
    } catch (e: any) {
      console.error(
        `[${String(i + 1).padStart(3, "0")}/${CATALOG.length}] ✗ ERROR ${spec.title}: ${e?.message ?? e}`,
      );
      skipped++;
    }
  }

  console.log(
    `\nDone. created=${created}, updated=${updated}, skipped=${skipped}, total images migrated=${imageCount}\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
