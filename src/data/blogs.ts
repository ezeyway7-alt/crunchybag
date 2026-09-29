export interface BlogFaq {
  question: string;
  answer: string;
}

export interface MenuItemRecommendation {
  name: string;
  price: string;
  badge?: string;
  description: string;
  image: string;
  category: string;
}

export interface BlogSection {
  heading?: string;
  subheading?: string;
  paragraphs: string[];
  callout?: string;
  list?: string[];
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  category: "Fried Chicken" | "Smash Burgers" | "Crunchy Momos" | "Kathmandu Food Guide" | "Kitchen Secrets" | "Delivery & Offers";
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  date: string;
  isoDate: string; // ISO 8601 for Google JSON-LD schema
  readTime: string;
  featuredImage: string;
  excerpt: string;
  summaryPoints?: string[];
  contentSections: BlogSection[];
  menuRecommendations?: MenuItemRecommendation[];
  faqs?: BlogFaq[];
  tags: string[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-crispiest-chicken-kathmandu",
    slug: "secret-to-kathmandus-crispiest-chicken",
    title: "The Secret to Kathmandu's Crispiest Fried Chicken: Crunchy Bag's Double-Dredge Technique",
    metaTitle: "Secret to Kathmandu's Crispiest Fried Chicken | Crunchy Bag",
    metaDescription: "Discover why Crunchy Bag makes the crispiest fried chicken in Kathmandu. Our 18-hour Himalayan Timur brine and double-dredge method keep chicken crunchy for 45 minutes.",
    keywords: [
      "crunchy bag",
      "fried chicken kathmandu",
      "best crunchy fried chicken",
      "food in kathmandu",
      "fried chicken delivery kathmandu",
      "crispy chicken nepal",
      "fast food durbar marg"
    ],
    canonicalUrl: "https://crunchybag.com/blog/secret-to-kathmandus-crispiest-chicken",
    category: "Fried Chicken",
    author: {
      name: "Chef Bikas Thapa",
      role: "Head of Culinary R&D",
      avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&h=200&q=80"
    },
    date: "September 15, 2026",
    isoDate: "2026-09-15T10:00:00+05:45",
    readTime: "4 min read",
    featuredImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&h=630&q=80",
    excerpt: "Ever wonder why standard fried chicken turns into a soggy sponge on motorcycle delivery across Kathmandu? Here is the culinary physics behind Crunchy Bag's shatteringly crisp crust.",
    summaryPoints: [
      "18-hour Timur peppercorn & buttermilk marinade that tenderizes meat and retains natural moisture.",
      "Proprietary rice flour & cornstarch blend that absorbs 50% less oil than conventional wheat flour.",
      "Dual-zone flash frying at 175°C to seal in umami juices while blistering the outer crust.",
      "Vented corrugated delivery packaging engineered to let steam escape without losing core heat."
    ],
    contentSections: [
      {
        heading: "The Curse of the Soggy Delivery Chicken in Kathmandu",
        paragraphs: [
          "Anyone who has ordered food delivery in Kathmandu knows the disappointment: you order golden, crispy fried chicken, but after a 25-minute motorcycle journey navigating traffic from Durbar Marg to Baneshwor or Jhamsikhel, opening the box reveals a damp, limp crust.",
          "This happens because of a simple law of thermodynamics: moisture migrating from the steaming meat gets trapped inside standard plastic or wax containers, condensing directly back onto the breading. Within minutes, the crunch is completely destroyed.",
          "When we founded Crunchy Bag, our culinary team spent four months researching how to solve this exact problem for Nepal's climate and elevation."
        ]
      },
      {
        heading: "Step 1: The 18-Hour Himalayan Timur Buttermilk Brine",
        paragraphs: [
          "True crunch begins deep inside the meat. We source tender farm chicken from contract growers in Kavre and Chitwan. The meat is submerged in an 18-hour cold brine infused with wild Himalayan Timur (Szechuan pepper) from Rolpa, crushed garlic cloves, sea salt, and fresh buttermilk.",
          "The natural lactic acid in buttermilk gently relaxes the protein fibers without turning the flesh mushy. Meanwhile, the citrusy numbing tingling of the Timur permeates all the way to the bone, delivering that signature Kathmandu flavor profile."
        ],
        callout: "Timur pepper doesn't just add heat; its citric tingling activates saliva glands, enhancing your taste receptors for rich savory umami!"
      },
      {
        heading: "Step 2: The Double-Dredge Micro-Lattice",
        paragraphs: [
          "Most local fast-food joints use 100% white wheat flour, which absorbs excess grease and easily dissolves when exposed to steam. At Crunchy Bag, we created a specialized dredging formula combining fine rice flour, tapioca starch, and coarse cornstarch.",
          "Rice flour forms a microscopic crystalline lattice under high heat that repels grease by over 50% compared to all-purpose flour. When dipped into our seasoned egg wash and dredged a second time, it creates thousands of tiny crunchy ridges and bubbles.",
          "This outer barrier traps the steaming juices securely inside the chicken while keeping the exterior hard, loud, and blistered."
        ],
        list: [
          "First dredge creates the moisture anchor directly on the meat.",
          "Hydration bath locks seasoning onto the edges.",
          "Second dredge builds the serrated, shatter-crisp crags.",
          "Flash fried in high-smoke-point sunflower oil at exact 175°C temperatures."
        ]
      },
      {
        heading: "Step 3: Moisture-Vented Bag Engineering",
        paragraphs: [
          "The crunch doesn't stop at the fryer. Even the best fried chicken in the world will turn soggy if trapped in an airtight box. Our custom takeout bags feature micro-perforated steam vents at the top edges.",
          "These vents allow trapped steam to escape into the atmosphere while insulated corrugated sidewalls retain the core heat. That is why when your Crunchy Bag arrives at your doorstep in Kathmandu, the bite is as loud and crisp as if it just came out of the kitchen fryer."
        ]
      }
    ],
    menuRecommendations: [
      {
        name: "Classic Crunchy 6-Piece Bucket",
        price: "NPR 850",
        badge: "Most Popular",
        description: "6 pieces of our signature double-dredged golden fried chicken with house garlic dip and Timur mayo.",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80",
        category: "Buckets"
      },
      {
        name: "Firecracker Spicy Chicken Tenders",
        price: "NPR 490",
        badge: "Spicy Hit",
        description: "Boneless hand-breaded chicken tenders tossed in our Himalayan chili-hot glaze.",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80",
        category: "Tenders"
      }
    ],
    faqs: [
      {
        question: "Where can I get Crunchy Bag fried chicken in Kathmandu?",
        answer: "You can dine in or pick up takeaway at our restaurant on Kings Way, Durbar Marg, Kathmandu (opposite Narayanhiti Palace). We also offer instant online ordering with fast delivery across Kathmandu, Lalitpur, and Bhaktapur."
      },
      {
        question: "How does Crunchy Bag keep fried chicken crisp during delivery?",
        answer: "We use a proprietary double-dredge rice and cornstarch crust that absorbs 50% less oil, and package every order in custom micro-vented insulated boxes that let steam escape while keeping the chicken piping hot."
      },
      {
        question: "Is Crunchy Bag chicken halal-certified?",
        answer: "Yes, 100% of our chicken is ethically sourced from certified Halal suppliers in Nepal and prepared according to strict quality standards."
      }
    ],
    tags: ["Fried Chicken", "Kathmandu Food", "Kitchen Secrets", "Crunchy Bag"]
  },
  {
    id: "blog-best-smash-burgers-kathmandu",
    slug: "best-smash-burgers-in-kathmandu",
    title: "Ultimate Guide to the Best Smash Burgers in Kathmandu (2026 Edition)",
    metaTitle: "Best Smash Burgers in Kathmandu (2026 Guide) | Crunchy Bag",
    metaDescription: "Looking for the best burger in Kathmandu? Discover how Crunchy Bag's ultra-crispy lacy edged smash burgers with potato brioche buns became a city favorite.",
    keywords: [
      "best burger kathmandu",
      "smash burger kathmandu",
      "burger in kathmandu",
      "crunchy bag burger",
      "cheeseburger kathmandu",
      "burger delivery kathmandu",
      "food in kathmandu"
    ],
    canonicalUrl: "https://crunchybag.com/blog/best-smash-burgers-in-kathmandu",
    category: "Smash Burgers",
    author: {
      name: "Suman Adhikari",
      role: "Burger Maestro & Food Stylist",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"
    },
    date: "September 18, 2026",
    isoDate: "2026-09-18T12:30:00+05:45",
    readTime: "5 min read",
    featuredImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&h=630&q=80",
    excerpt: "Forget thick, rubbery patties. Kathmandu's burger culture has evolved into caramelized, sizzling smash burgers with paper-thin crispy edges and melted cheese.",
    summaryPoints: [
      "High-pressure smash technique on a 260°C cast-iron flat top maximizes the Maillard reaction.",
      "Custom 80/20 fresh meat blend providing maximum juiciness and rich beef/chicken flavor.",
      "Toasted golden potato brioche buns that hold up to rich sauces without falling apart.",
      "House secret 'Bag Sauce' with pickled gherkins, smoked paprika, and mustard seed."
    ],
    contentSections: [
      {
        heading: "The Demise of the Traditional 'Hockey Puck' Burger",
        paragraphs: [
          "For decades, the standard burger in Kathmandu was a thick, dense patty that was frequently overcooked on the outside while remaining bland and dry in the center. To make matters worse, ordinary bakery buns would turn into mush under the weight of wet tomato slices.",
          "The culinary world shifted when the smash burger revolution took over New York, Tokyo, and London. In 2026, Crunchy Bag brought this authentic technique to Kathmandu, redefining what a gourmet burger should taste like."
        ]
      },
      {
        heading: "The Chemistry: Why the Maillard Reaction Rules Everything",
        paragraphs: [
          "The magic of a smash burger lies in the Maillard reaction—a chemical reaction between amino acids and reducing sugars that occurs at temperatures above 150°C. This is what creates that deeply savory, nutty, caramelized crust.",
          "When our chefs drop a freshly ground meat ball onto our blazing 260°C chrome flat-top grill, we smash it flat with a 5-pound cast iron press within the first 30 seconds. This forces the proteins into direct contact with the iron, caramelizing the juices before they have a chance to evaporate.",
          "The edges spread outward into wafer-thin, lace-like crispy ruffles that crunch in every single bite."
        ],
        callout: "Smashing after the first 30 seconds squeezes out juices; smashing IMMEDIATELY seals in caramelization while retaining moisture!"
      },
      {
        heading: "The Vessel: The Golden Potato Brioche Bun",
        paragraphs: [
          "A great patty deserves an equal partner. We worked with local master bakers in Lalitpur to formulate a pillowy potato brioche bun. Potato starch holds onto water molecules, giving the bun an impossibly soft, springy crumb that bounces back after being squeezed.",
          "Each bun is slathered in clarified butter and toasted on the flat-top until golden brown. This buttery seal prevents juices and our secret Bag Sauce from soaking into the bread."
        ]
      }
    ],
    menuRecommendations: [
      {
        name: "Double Smash Cheese Burger",
        price: "NPR 620",
        badge: "Chef's Pick",
        description: "Two smashed beef patties, double melted cheddar, caramelized onions, pickles, and Crunchy secret sauce.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
        category: "Burgers"
      },
      {
        name: "Crispy Timur Fried Chicken Burger",
        price: "NPR 580",
        badge: "Best Seller",
        description: "Double-dredged chicken breast, house slaw, spicy mayo, and pickles on a toasted brioche bun.",
        image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=400&q=80",
        category: "Burgers"
      }
    ],
    faqs: [
      {
        question: "What makes a smash burger different from a normal burger?",
        answer: "A smash burger is pressed extremely thin onto a scorching hot flat-top grill within seconds of cooking. This creates an intense caramelized, crispy crust around the edges while locking in the juices."
      },
      {
        question: "Can I order smash burgers online for delivery in Kathmandu?",
        answer: "Yes! Crunchy Bag delivers fresh smash burgers across Kathmandu, Lalitpur, and Bhaktapur with orders placed on crunchybag.com."
      },
      {
        question: "Are vegetarian burger options available?",
        answer: "Yes, we serve the Crispy Mushroom & Halloumi Smash Burger with caramelized onions and house-made truffle garlic aioli."
      }
    ],
    tags: ["Burgers", "Smash Burger", "Kathmandu Food", "Comfort Food"]
  },
  {
    id: "blog-crunchy-fried-momos-guide",
    slug: "crunchy-fried-momos-food-guide",
    title: "Why Crunchy Fried Momos Are Kathmandu's New Ultimate Obsession",
    metaTitle: "Crunchy Fried Momos in Kathmandu: The Food Craze | Crunchy Bag",
    metaDescription: "Tired of regular steamed momos? Taste Kathmandu's newest food obsession: Japanese Panko-crusted Crunchy Fried Momos with spicy sesame Timur achar.",
    keywords: [
      "crunchy momo",
      "fried momo kathmandu",
      "crunchy fried momo",
      "best momo in kathmandu",
      "momo delivery kathmandu",
      "c momo kathmandu",
      "food in kathmandu"
    ],
    canonicalUrl: "https://crunchybag.com/blog/crunchy-fried-momos-food-guide",
    category: "Crunchy Momos",
    author: {
      name: "Priya Shrestha",
      role: "Traditional Cuisine Innovator",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80"
    },
    date: "September 20, 2026",
    isoDate: "2026-09-20T14:15:00+05:45",
    readTime: "4 min read",
    featuredImage: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&h=630&q=80",
    excerpt: "Kathmandu eats over 2.5 million momos every single day. Here is how Crunchy Bag reimagined Nepal's national comfort food into a golden, panko-crusted sensation.",
    summaryPoints: [
      "Light steam-first, flash-fry second technique ensuring juicy filling and crisp exterior.",
      "Japanese Panko crumb coating seasoned with toasted cumin and crushed Timur peppercorns.",
      "Served with both fiery tomato sesame jhol and cooling creamy house garlic sauce.",
      "Available in juicy minced chicken, buff, and farmhouse paneer-vegetable fillings."
    ],
    contentSections: [
      {
        heading: "Kathmandu: The City Built on Momos",
        paragraphs: [
          "In Kathmandu, momos are not just an afternoon snack—they are a cultural obsession. From street-side carts in New Road to family gatherings in Patan, momos unite generations. Yet for years, the choices were limited to steamed (kothey), standard deep-fried, or drenched in spicy C-momo gravy.",
          "Standard deep-fried momos often suffered from tough, leathery dough because plain refined flour wrapper becomes chewy when submerged in hot oil. We knew there was a better way."
        ]
      },
      {
        heading: "The Innovation: Panko-Blistered Golden Shell",
        paragraphs: [
          "At Crunchy Bag, we created the hybrid steam-and-crunch process. First, our momos are lightly steamed to perfection so the savory meat filling is fully cooked, aromatic, and bursting with rich natural broth.",
          "Then, instead of dropping plain flour dough into hot oil, each momo is brushed with an egg-free starch wash and rolled in Japanese panko flakes seasoned with roasted cumin and crushed Timur pepper.",
          "A 90-second flash fry creates a golden, bubble-textured crust that shatters on impact, giving way to the tender, soupy filling inside."
        ],
        callout: "The secret to an epic crunchy momo: crisp outer panko shell on the outside, steaming savory broth on the inside!"
      },
      {
        heading: "The Holy Grail of Achar Pairings",
        paragraphs: [
          "No momo experience in Kathmandu is complete without achar. With Crunchy Fried Momos, we serve a dual-dip pairing:",
          "1. Classic Sesame & Roasted Tomato Jhol: Rich, tangy, nutty, with a gentle kick of coriander and roasted fenugreek.",
          "2. Creamy Timur Garlic Dip: Cool, rich, and mildly citrusy, the perfect contrast to the hot crunchy bite."
        ]
      }
    ],
    menuRecommendations: [
      {
        name: "Signature Crunchy Chicken Momos (10 pcs)",
        price: "NPR 380",
        badge: "Crowd Favorite",
        description: "10 pieces of panko-crusted chicken momos served with spicy sesame jhol and garlic timur dip.",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80",
        category: "Momos"
      },
      {
        name: "Crunchy Paneer & Herb Momos (10 pcs)",
        price: "NPR 350",
        badge: "Vegetarian",
        description: "Fresh cottage cheese, ginger, scallions, and herbs encased in a crisp golden shell.",
        image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=400&q=80",
        category: "Momos"
      }
    ],
    faqs: [
      {
        question: "What is a Crunchy Momo?",
        answer: "A Crunchy Momo is a freshly prepared momo coated in light panko breadcrumbs and flash-fried to create an ultra-crispy outer shell while maintaining a juicy, flavorful filling."
      },
      {
        question: "Can I get crunchy momos delivered hot in Kathmandu?",
        answer: "Yes, Crunchy Bag packs momos in custom thermal boxes that preserve the crispness and keep the jhol achar warm during courier transit."
      }
    ],
    tags: ["Crunchy Momo", "Fried Momo", "Momo Kathmandu", "Nepali Street Food"]
  },
  {
    id: "blog-late-night-food-kathmandu",
    slug: "late-night-food-delivery-kathmandu",
    title: "Late Night Food Delivery in Kathmandu: How to Satisfy Midnight Cravings",
    metaTitle: "Late Night Food Delivery in Kathmandu | Crunchy Bag",
    metaDescription: "Craving food at midnight in Kathmandu? Crunchy Bag delivers hot fried chicken, smash burgers, and fries until late. Fast delivery to Thamel, Baneshwor & Lalitpur.",
    keywords: [
      "late night food kathmandu",
      "food delivery kathmandu",
      "midnight burger delivery kathmandu",
      "night food order kathmandu",
      "late night restaurant durbar marg",
      "crunchy bag delivery"
    ],
    canonicalUrl: "https://crunchybag.com/blog/late-night-food-delivery-kathmandu",
    category: "Kathmandu Food Guide",
    author: {
      name: "Rohan Gurung",
      role: "Logistics & Delivery Fleet Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80"
    },
    date: "September 22, 2026",
    isoDate: "2026-09-22T21:00:00+05:45",
    readTime: "3 min read",
    featuredImage: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&h=630&q=80",
    excerpt: "When midnight strikes in Kathmandu and most kitchens shutter their doors, where do you find piping-hot, gourmet fast food? Here is your ultimate night-owl guide.",
    summaryPoints: [
      "Crunchy Bag operates our central Durbar Marg kitchen late for midnight dine-in and express delivery.",
      "Dedicated motorcycle fleet equipped with heated thermal delivery backpacks.",
      "Fast 30-40 minute delivery across Thamel, Lazimpat, Baluwatar, Naxal, Baneshwor, and Patan.",
      "Seamless online ordering with instant digital payment via eSewa."
    ],
    contentSections: [
      {
        heading: "The Midnight Dilemma in the Valley",
        paragraphs: [
          "Kathmandu's nightlife is thriving—from live music gigs in Thamel to late-night software sprints in Kupondole and study sessions before exams. But until recently, finding real food past 10 PM meant settling for stale instant noodles or cold biscuits.",
          "At Crunchy Bag, we believe that night owls deserve food made to order with the same fresh ingredients and chef-level precision as lunch service."
        ]
      },
      {
        heading: "Express Kitchen to Doorstep in 35 Minutes",
        paragraphs: [
          "Our central kitchen located in Durbar Marg (Kings Way) is strategically situated at the hub of the Valley's road network. With night traffic cleared, our dedicated riders reach most central neighborhoods within 25 to 35 minutes.",
          "Our delivery bags feature active insulation, ensuring that when your smash burger, seasoned crinkle fries, and chicken bucket arrive at your door, they are piping hot and ready to enjoy."
        ]
      }
    ],
    menuRecommendations: [
      {
        name: "Midnight Snack Attack Combo",
        price: "NPR 750",
        badge: "Late Night Deal",
        description: "1 Smash Cheese Burger + 2 Crispy Chicken Tenders + Crinkle Fries + Chilled Beverage.",
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80",
        category: "Combos"
      }
    ],
    faqs: [
      {
        question: "What are Crunchy Bag's late night delivery hours?",
        answer: "We accept delivery orders until 11:30 PM on weekdays and until midnight on weekends directly on crunchybag.com."
      },
      {
        question: "Which areas in Kathmandu are covered for night delivery?",
        answer: "We cover Durbar Marg, Thamel, Lazimpat, Baluwatar, Naxal, Maitighar, New Baneshwor, Old Baneshwor, Sinamangal, Jhamsikhel, and Sanepa."
      }
    ],
    tags: ["Late Night Delivery", "Kathmandu Food", "Night Cravings", "Fast Food"]
  },
  {
    id: "blog-online-order-esewa-guide",
    slug: "how-to-order-online-esewa-crunchy-bag",
    title: "How to Order Food Online in Kathmandu with Instant eSewa Payment",
    metaTitle: "Order Food Online with eSewa in Kathmandu | Crunchy Bag",
    metaDescription: "Learn how to order the crispiest food in Kathmandu on crunchybag.com with zero-hassle eSewa digital checkout and live GPS kitchen order tracking.",
    keywords: [
      "order food online kathmandu",
      "esewa food delivery",
      "online food order kathmandu",
      "crunchy bag order",
      "esewa fast food nepal",
      "food in kathmandu"
    ],
    canonicalUrl: "https://crunchybag.com/blog/how-to-order-online-esewa-crunchy-bag",
    category: "Delivery & Offers",
    author: {
      name: "Suman Adhikari",
      role: "Operations Lead",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"
    },
    date: "September 24, 2026",
    isoDate: "2026-09-24T16:00:00+05:45",
    readTime: "3 min read",
    featuredImage: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&h=630&q=80",
    excerpt: "No more hunting for loose cash in the rain or dealing with card machine network errors. Here is how our direct eSewa checkout sends your food to the fryer in under a second.",
    summaryPoints: [
      "Instant 0.8-second automated ticket dispatch directly to our Kitchen Display Station upon eSewa authorization.",
      "100% contact-free delivery with no physical cash handling.",
      "Live order countdown showing exact cooking, packing, and courier transit stages.",
      "Exclusive cashback offers and points for digital wallet customers."
    ],
    contentSections: [
      {
        heading: "Why Cash on Delivery Is Slowing Down Your Meal",
        paragraphs: [
          "Cash on delivery seems simple until the driver arrives at your gate. You spend 5 minutes searching for exact change, the delivery rider doesn't have change for a NPR 1000 note, or notes get damp in the monsoon rain.",
          "At Crunchy Bag, we integrated automated eSewa digital checkout directly into our ordering portal. The moment your payment is verified, your order slip prints immediately in the kitchen."
        ]
      },
      {
        heading: "Step-by-Step: Ordering on Crunchy Bag in 60 Seconds",
        paragraphs: [
          "Ordering your favorite meal takes less than a minute:",
          "1. Visit crunchybag.com and browse our visual menu of smash burgers, fried chicken buckets, and crunchy momos.",
          "2. Customize your dips, spice levels, and beverages, then click 'Add to Bag'.",
          "3. Select 'Delivery' or 'Takeaway Counter', enter your delivery address and phone number.",
          "4. Select 'Pay with eSewa'. You are securely redirected to approve the payment with your biometric login or PIN.",
          "5. Your order immediately enters our Kitchen Display System (KDS), and you receive a live order tracker with estimated prep and delivery time."
        ]
      }
    ],
    menuRecommendations: [
      {
        name: "Crunchy Party Feast Platter",
        price: "NPR 1,890",
        badge: "Family & Party",
        description: "8 Pcs Crispy Chicken + 2 Double Smash Burgers + 10 Pcs Crunchy Momos + 2 Crinkle Fries + Large Dips.",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
        category: "Platters"
      }
    ],
    faqs: [
      {
        question: "Can I pay for my Crunchy Bag order using eSewa?",
        answer: "Yes, Crunchy Bag offers direct automated eSewa payment integration for instant, secure digital checkout."
      },
      {
        question: "Is there any extra convenience fee for paying with eSewa?",
        answer: "No, there are zero extra payment processing fees when paying with eSewa on crunchybag.com."
      }
    ],
    tags: ["eSewa", "Food Delivery", "Online Ordering", "Digital Nepal"]
  }
];

export const getArticleBySlug = (slug: string): BlogArticle | undefined => {
  return BLOG_ARTICLES.find(
    (article) => article.slug.toLowerCase() === slug.toLowerCase()
  );
};

export const getRelatedArticles = (currentSlug: string, count = 3): BlogArticle[] => {
  const current = getArticleBySlug(currentSlug);
  return BLOG_ARTICLES.filter((a) => a.slug !== currentSlug)
    .sort((a, b) => {
      if (current && a.category === current.category) return -1;
      return 0;
    })
    .slice(0, count);
};
