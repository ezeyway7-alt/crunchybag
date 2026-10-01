export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: "Kitchen Secrets" | "Food Guides" | "Local Sourcing" | "Delivery Tips";
  author: string;
  authorRole: string;
  date: string;
  isoDate: string;
  readTime: string;
  image: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  relatedDish?: {
    name: string;
    description: string;
    price: number;
    image: string;
    actionLabel: string;
  };
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-1",
    slug: "secret-to-kathmandus-crispiest-chicken",
    title: "The Science of the Crunch: How We Achieve Kathmandu's Crispiest Chicken",
    excerpt:
      "Ever wonder why ordinary fried chicken gets soggy on the way across Kathmandu while Crunchy stays shatteringly crisp? Here is the culinary physics behind our 18-hour marinade and double-dredge method.",
    category: "Kitchen Secrets",
    author: "Head Chef Bikas Thapa",
    authorRole: "Executive Kitchen Director",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12T10:00:00+05:45",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
    tags: ["Fried Chicken", "Kitchen Secrets", "Kathmandu Food", "Crunchy Bag"],
    metaTitle: "The Science of the Crunch: Best Crispy Fried Chicken in Kathmandu | Crunchy Bag",
    metaDescription:
      "Discover the culinary science behind Crunchy Bag's 18-hour Timur marinade, rice flour dredge, and pressure frying that keeps chicken crispy across Kathmandu Valley delivery.",
    relatedDish: {
      name: "Crunchy Fried Chicken",
      description: "Signature 24-hr brined golden fried chicken with Himalayan spice crunch coating.",
      price: 360,
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Crispy Chicken",
    },
    content: [
      "Most fried chicken in urban environments suffers from a single, frustrating fatal flaw: moisture migration. When piping hot chicken is sealed inside a container for a delivery run, steam escaping from the interior meat condenses against the outer skin, turning what was once a crisp crust into a lukewarm sponge within ten minutes.",
      "At Crunchy Bag, we spent over six months perfecting a three-stage culinary technique engineered specifically for Kathmandu's high altitude (1,400m) and fast-paced delivery geography across Lalitpur and Kathmandu Valley.",
      "Step one begins with our signature 18-hour cold brine. We infuse fresh Himalayan Timur peppercorns, crushed mountain garlic, mustard oil, and fermented buttermilk into local grain-fed chicken. The mild lactic acid gently tenders the collagen fibers, ensuring the interior meat retains every drop of natural juice even when subjected to intense frying heat.",
      "Step two is our proprietary dredge formula. Rather than relying solely on heavy all-purpose wheat flour—which absorbs excess oil and traps steam—we introduce a finely balanced ratio of organic rice flour and cornstarch. Rice flour gelatinizes quickly at high heat, constructing a microscopic cellular lattice that repels ambient moisture and stays audibly crunchy long after plating.",
      "Finally, our pressure-frying flash process locks the exterior at precisely 175°C. When your rider arrives from our Imadol hub to your home in Balkumari, Baneshwor, or Koteshwor, unboxing your meal delivers that unmistakably loud, shatteringly crisp bite every single time.",
    ],
  },
  {
    id: "blog-2",
    slug: "himalayan-timur-spices-sourcing",
    title: "From Kavre to Imadol: Sourcing Ethical Poultry & Himalayan Spices",
    excerpt:
      "A deep dive into our farm-to-table supply chain in Nepal, partnering directly with organic smallholders for wild Timur peppercorns, organic ginger, and free-range mountain poultry.",
    category: "Local Sourcing",
    author: "Sourcing Director Priya Shrestha",
    authorRole: "Head of Ethical Supply Chain",
    date: "Aug 28, 2026",
    isoDate: "2026-08-28T10:00:00+05:45",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    tags: ["Local Sourcing", "Nepal Agriculture", "Organic Spices", "Timur Peppercorn"],
    metaTitle: "From Kavre to Imadol: Ethical Poultry & Himalayan Spice Sourcing | Crunchy Bag",
    metaDescription:
      "Learn how Crunchy Bag supports local Nepali farming cooperatives across Kavre, Chitwan, and Rolpa for ethical poultry, organic Timur, and fresh ginger.",
    relatedDish: {
      name: "Chicken 65 Pakoda",
      description: "Crispy boneless chicken bites tossed with fresh curry leaves and mountain Timur spice.",
      price: 260,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Chicken 65 Pakoda",
    },
    content: [
      "Great fast food should never come at the expense of environmental sustainability, food safety, or local farming communities. When we established Crunchy Bag, our founding principle was crystal clear: 100% of our core ingredients must champion Nepal's agricultural heritage.",
      "Our chicken supply chain is built around dedicated contract farming cooperatives located in the foothills of Kavre and the lush valleys of Chitwan. These smallholder farmers adhere to strict zero-preventative-antibiotic standards, humane open-shed stocking densities, and natural whole-grain feeding regimes. This humane approach yields firmer muscle structure, superior moisture retention, and rich natural umami that processed commercial meats can never match.",
      "For our signature seasonings, we bypass industrial spice brokers. Instead, we partner with women-led farming collectives in Rolpa and Makwanpur to source wild-harvested Timur peppercorns (Zanthoxylum armatum). Harvested at peak maturity in early autumn, this indigenous Himalayan berry provides a zesty grapefruit-citrus aroma accompanied by that unmistakable electric tongue-tingling warmth.",
      "Combined with farm-fresh organic ginger from Nuwakot and cold-pressed mustard oil from Chitwan, our kitchen in Imadol, Lalitpur transforms humble Himalayan ingredients into world-class crispy delicacies.",
    ],
  },
  {
    id: "blog-3",
    slug: "guide-to-ordering-with-esewa",
    title: "Zero-Friction Dining: How eSewa Instant Online Checkout Speeds Up Your Order",
    excerpt:
      "Why Crunchy Bag partnered with eSewa for instant digital verification, cutting kitchen prep wait times by 10 minutes and eliminating doorstep cash hassles across Kathmandu.",
    category: "Delivery Tips",
    author: "Operations Lead Sujan Adhikari",
    authorRole: "Customer Experience Team",
    date: "Aug 15, 2026",
    isoDate: "2026-08-15T10:00:00+05:45",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80",
    tags: ["eSewa", "Digital Nepal", "Fast Delivery", "Online Ordering"],
    metaTitle: "Zero-Friction Fast Food Delivery: Ordering with eSewa in Nepal | Crunchy Bag",
    metaDescription:
      "See how eSewa instant digital payment powers automated kitchen ticket dispatch at Crunchy Bag, delivering food up to 10 minutes faster to your door.",
    relatedDish: {
      name: "Crunchy Beast Combo",
      description: "Loaded double crispy chicken burger + golden French fries + chilled drink deal.",
      price: 680,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Beast Combo",
    },
    content: [
      "In modern food delivery, seconds count. Traditional Cash on Delivery (COD) remains a familiar option in Nepal, but it often carries hidden bottlenecks: riders searching for loose banknotes in torrential Kathmandu rain, customers waiting for change, and kitchens holding orders until telephone confirmation is completed.",
      "To eliminate this friction, Crunchy Bag fully integrated native eSewa digital wallet settlement directly into our checkout workflow.",
      "The instant your eSewa transaction completes, our backend pushes an automated real-time dispatch ticket to our Kitchen Display System (KDS) within 0.8 seconds. There are no manual verification calls or order delays—our fryers start crackling immediately.",
      "When our delivery courier arrives at your apartment gate or office lobby, the handoff takes under five seconds. Enjoy your piping hot smash burgers and crisp fried chicken with zero stress, and look out for seasonal cashbacks exclusive to eSewa food lovers.",
    ],
  },
  {
    id: "blog-4",
    slug: "perfect-burger-anatomy-kathmandu",
    title: "The Anatomy of a Smash Burger: Why Lacy Edges Matter",
    excerpt:
      "Thick, rubbery patties are out; caramelized smash burgers with wafer-thin crispy edges are in. Here is how intense cast-iron heat unlocks maximum savory Maillard flavor.",
    category: "Food Guides",
    author: "Head Chef Bikas Thapa",
    authorRole: "Executive Kitchen Director",
    date: "Jul 30, 2026",
    isoDate: "2026-07-30T10:00:00+05:45",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    tags: ["Smash Burgers", "Food Science", "Kathmandu Eats", "Gourmet Burgers"],
    metaTitle: "The Anatomy of a Smash Burger: Lacy Crispy Edges & Brioche Buns | Crunchy Bag",
    metaDescription:
      "Explore the Maillard reaction that makes Crunchy Bag's smash burgers legendary in Kathmandu Valley. Fresh brioche buns, dill pickles, and house sauce.",
    relatedDish: {
      name: "Crunchy Fried Chicken Burger",
      description: "Crispy chicken breast fillet on toasted brioche with crunchy pickles and secret sauce.",
      price: 380,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Smash Burger",
    },
    content: [
      "For years, burger lovers in Kathmandu were served oversized, hockey-puck style patties that were thick in the center, rubbery in texture, and bland underneath a mountain of raw cabbage.",
      "At Crunchy Bag, we introduced the authentic smash burger methodology. The technique centers entirely on culinary chemistry: the Maillard reaction. When a chilled sphere of freshly ground meat hits a scorching 230°C cast-iron flattop and is forcefully smashed flat using a heavy stainless-steel press, maximum surface area makes direct contact with intense heat.",
      "This rapid thermal transfer browns amino acids and sugars within seconds, constructing a deep mahogany-crusted patty bordered by wafer-thin, delightfully crispy 'lacy edges' that pack concentrated savory umami.",
      "We pair this intense crust with soft, golden butter brioche buns baked fresh daily in Patan, house-cured crunchy dill pickles, and our signature tangy burger glaze. The result is a burger that balances crisp crunch, melted cheese, and juicy softness that can be enjoyed with one hand without falling apart.",
    ],
  },
  {
    id: "blog-5",
    slug: "ultimate-nepali-spiced-pakoda-guide",
    title: "The Ultimate Guide to Spiced Pakodas: From Monsoon Snacks to Late-Night Bites",
    excerpt:
      "How we combine heritage chickpea besan flour with mountain herbs to craft the crunchiest Chicken 65, Paneer, and seasonal pakoda snacks in Kathmandu.",
    category: "Food Guides",
    author: "Sous Chef Ramesh Maharjan",
    authorRole: "Appetizers & Traditional Specialist",
    date: "Jul 10, 2026",
    isoDate: "2026-07-10T10:00:00+05:45",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
    tags: ["Pakoda", "Chicken 65", "Nepali Snacks", "Comfort Food"],
    metaTitle: "The Ultimate Guide to Spiced Pakodas in Kathmandu | Crunchy Bag",
    metaDescription:
      "Savor authentic Nepali spiced pakodas: Chicken 65, Paneer, and Gobi fritters crafted with cold-milled besan, ajwain, and fresh mint chutney.",
    relatedDish: {
      name: "Paneer Pakoda",
      description: "Thick fresh paneer cubes coated in spiced chickpea batter and golden fried.",
      price: 220,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Fresh Pakoda",
    },
    content: [
      "In Nepal, rain has an official culinary companion: the pakoda. The sound of monsoon showers rattling against tin roofs in Kathmandu has always prompted families to heat up oil and fry spiced chickpea fritters.",
      "At Crunchy Bag, we took this beloved street tradition and elevated it with precision cooking. It starts with cold-milled gram flour (chana besan), which is sifted and aerated before receiving crushed ajwain (carom seeds), roasted cumin, freshly ground black pepper, and chopped green chilies.",
      "For our Chicken 65 Pakoda, tender chicken morsels are marinated in spiced ginger paste before dipping into the batter, producing an appetizer with a crackling shell and melt-in-your-mouth interior.",
      "Vegetarian foodies love our Paneer Pakoda, featuring dense, pillowy cubes of locally sourced paneer coated in crunchy batter, served alongside our tangy fresh mint and coriander yogurt dip. Perfect for evening tea or late-night party buckets.",
    ],
  },
  {
    id: "blog-6",
    slug: "inside-imadol-kitchen-thermal-delivery",
    title: "Inside Our Imadol Kitchen: How Thermal Bag Tech Keeps Delivery Piping Hot",
    excerpt:
      "A behind-the-scenes look at how orders dispatched from our Imadol hub reach Balkumari, Gwarko, and Koteshwor in under 25 minutes at ideal serving temperature.",
    category: "Delivery Tips",
    author: "Logistics Lead Sujan Adhikari",
    authorRole: "Fleet & Dispatch Director",
    date: "Jun 24, 2026",
    isoDate: "2026-06-24T10:00:00+05:45",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80",
    tags: ["Imadol", "Food Delivery", "Kathmandu Valley", "Thermal Packaging"],
    metaTitle: "Inside Imadol Central Kitchen: Fast Thermal Food Delivery in Lalitpur | Crunchy Bag",
    metaDescription:
      "Discover how Crunchy Bag's central kitchen in Imadol, Lalitpur uses heat-sealed thermal delivery bags to deliver hot crispy fried chicken and burgers across Kathmandu Valley.",
    relatedDish: {
      name: "Crunchy Family Bag",
      description: "Huge sharing bag with 6 crispy chicken pieces, 2 burgers, 2 large fries & 2 cold drinks.",
      price: 1290,
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      actionLabel: "Order Family Bag",
    },
    content: [
      "Fast food delivery is a race against thermodynamic entropy. When hot food departs a commercial fryer at 80°C, ambient air quickly saps heat, while trapped steam can turn crispy surfaces soggy within minutes.",
      "To solve this problem for Lalitpur and Kathmandu residents, Crunchy Bag engineered an advanced thermal dispatch system stationed at our central kitchen hub in Imadol.",
      "First, our packaging features breathable micro-vented carton boxes made from food-grade virgin paperboard. These vents allow steam to escape gradually while retaining radiant heat around the crust.",
      "Second, our riders are equipped with custom multi-layered delivery bags lined with heat-reflective aluminum insulation and reinforced thermal foam. This maintains an internal temperature of over 65°C throughout transit across Gwarko, Balkumari, Koteshwor, and Baneshwor.",
      "With live GPS tracking and optimized delivery corridors, your meal arrives at your doorstep as hot, crispy, and flavorful as if you were seated right in our restaurant.",
    ],
  },
];

export function getBlogBySlug(slug: string): BlogArticle | undefined {
  const cleanSlug = slug.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
  return BLOG_ARTICLES.find(
    (a) => a.slug.toLowerCase() === cleanSlug || a.id.toLowerCase() === cleanSlug
  );
}

export function getRelatedBlogs(currentSlug: string, limit: number = 3): BlogArticle[] {
  return BLOG_ARTICLES.filter((a) => a.slug !== currentSlug).slice(0, limit);
}
