export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: "Kitchen Secrets" | "Food Guides" | "Local Sourcing" | "Delivery Tips";
  author: string;
  authorRole: string;
  authorType?: "Person" | "Organization";
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

// Rewritten using owner-confirmed service facts and the public menu; original URLs retained.
export const BLOG_ARTICLES: BlogArticle[] = [
  {
    "id": "blog-1",
    "slug": "secret-to-kathmandus-crispiest-chicken",
    "title": "Fried Chicken in Kathmandu: Portions, Sides and Ordering",
    "excerpt": "Compare the fried chicken choices on our current menu and plan a delivery or takeaway order.",
    "content": [
      "Choosing a fried chicken order starts with the portion you want. Crunchy Bag lists individual fried chicken options, including 2-piece and 4-piece products, in the current online menu. Open the product to compare its price and any options before adding it to your cart.",
      "For a full meal, compare chicken with sides such as French fries, crispy potatoes or a drink. If you are ordering for more than one person, also browse the Offer category and check what each combo includes. Do not assume that a product image includes every side shown: use the item description and selected options.",
      "You can order delivery across Kathmandu, Lalitpur and Bhaktapur, or collect takeaway from Dhungesadhu Chowk, Imadol. Both services run 24/7, so the same menu is a starting point for lunch, dinner or a late-night order. Availability is shown on the website.",
      "Preparation usually takes 7–15 minutes depending on order size. That is preparation time, not a promise of arrival within 15 minutes. Your address, route and traffic affect the additional delivery time.",
      "There is no minimum order. Check the delivery charge and final total before confirming. If you need ingredient or allergen information beyond the description, contact the restaurant before placing the order."
    ],
    "category": "Food Guides",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/6ede399aa943386fcfbb7babe769e882d2916f56d112f8b691af22afb6d27b98.avif",
    "tags": [
      "Food Guides",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "Fried Chicken in Kathmandu: Portions, Sides and Ordering | Crunchy Bag",
    "metaDescription": "Compare the fried chicken choices on our current menu and plan a delivery or takeaway order."
  },
  {
    "id": "blog-2",
    "slug": "himalayan-timur-spices-sourcing",
    "title": "Food Ingredients and Dietary Requests: A Guide to Ordering",
    "excerpt": "What to check in a dish description and what to ask our restaurant before choosing your meal.",
    "content": [
      "A food name or photograph cannot tell you everything about its ingredients. Start with the current product description and the options shown on the website. Contact Crunchy Bag if you need information that is not listed.",
      "If you are comparing vegetarian choices, the live menu includes products such as Aloo Tikki Burger, vegetarian grilled sandwiches, vegetable pakoda and paneer pakoda. Check the specific product rather than assuming all items in a category have the same ingredients.",
      "For an allergy or a strict dietary requirement, ask the team about the ingredients and preparation arrangements before ordering. A vegetarian label does not establish that a dish is dairy-free, gluten-free or suitable for a particular allergy.",
      "Customizations depend on the dish. Use the selections actually offered on its product page, and confirm any special request with the restaurant. A note on an order is not a substitute for confirming whether the kitchen can accommodate it.",
      "Our restaurant is at Dhungesadhu Chowk, Imadol, Lalitpur. Delivery and takeaway are available 24/7; dine-in is available from 5 AM to 11 PM. The live menu is the source for current prices and availability."
    ],
    "category": "Food Guides",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/0a30df3f9d71f46d679d0b3bbefad260c9e228eba7c5cf274b092626dcd0ce2a.avif",
    "tags": [
      "Food Guides",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "Food Ingredients and Dietary Requests: A Guide to Ordering | Crunchy Bag",
    "metaDescription": "What to check in a dish description and what to ask our restaurant before choosing your meal."
  },
  {
    "id": "blog-3",
    "slug": "guide-to-ordering-with-esewa",
    "title": "How to Order Food Online from Crunchy Bag",
    "excerpt": "A practical checklist for choosing food, checking the total and arranging delivery or takeaway.",
    "content": [
      "Open the current Crunchy Bag menu and choose a food category. Select the dish you want, review its description and price, and choose any available portion or extra options. The selected options may change the total.",
      "Add the items to your cart and check quantities before continuing. Enter accurate customer and contact details so the restaurant can reach you about preparation or delivery. For delivery, provide your complete address, local tole, nearby landmark and an accurate map pin where requested.",
      "Choose from the payment and fulfilment options actually available at checkout. Review the final payable amount and follow the displayed payment instructions. Do not send payment based only on a blog price or a previous order.",
      "Crunchy Bag offers 10% off the first website order. Check that the applicable discount is reflected in your checkout total before confirming. The live checkout determines the final price and any other applicable offers.",
      "Delivery and takeaway are available 24/7, with no minimum order. Preparation usually takes 7–15 minutes depending on the order; delivery travel time is additional. For pickup, confirm your collection arrangements at Dhungesadhu Chowk, Imadol."
    ],
    "category": "Delivery Tips",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/a9e7905956a9b6729a3536ef9c0b28c52bb0b8cb6a02e326816ce1d1322006da.avif",
    "tags": [
      "Delivery Tips",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "How to Order Food Online from Crunchy Bag | Crunchy Bag",
    "metaDescription": "A practical checklist for choosing food, checking the total and arranging delivery or takeaway."
  },
  {
    "id": "blog-4",
    "slug": "perfect-burger-anatomy-kathmandu",
    "title": "Which Burger or Sandwich Should You Order in Kathmandu?",
    "excerpt": "Compare chicken burgers, aloo tikki burgers and grilled sandwiches on the Crunchy Bag menu.",
    "content": [
      "If you want a burger, start by choosing between the chicken and aloo tikki options listed in our current menu. Chicken Burger and Chicken Cheese Burger offer two straightforward choices; Aloo Tikki Burger and Aloo Tikki Cheese Burger are also listed. Open each product to check its current description and price.",
      "If you would prefer a sandwich, compare Chicken Grilled Sandwich with the vegetarian grilled sandwich options. Use the product descriptions to compare the fillings and available options rather than relying on the category name alone.",
      "Consider whether you want just the main item or a larger meal. French fries, crispy snacks and drinks are listed in their own categories. Check the current Offer category before choosing a combo, and read the included items.",
      "For customers in Kathmandu, Lalitpur or Bhaktapur, delivery runs 24/7 from the single Crunchy Bag kitchen in Imadol. You can also collect takeaway at Dhungesadhu Chowk, or dine in between 5 AM and 11 PM.",
      "There is no minimum order, and preparation generally takes 7–15 minutes depending on the order size. Confirm the delivery charge and allow additional time for the journey to your address."
    ],
    "category": "Food Guides",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/86125bf5ea9ddacf6391f160419ddfbfd986cf3431a30253bec1d4b3da846e28.avif",
    "tags": [
      "Food Guides",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "Which Burger or Sandwich Should You Order in Kathmandu? | Crunchy Bag",
    "metaDescription": "Compare chicken burgers, aloo tikki burgers and grilled sandwiches on the Crunchy Bag menu."
  },
  {
    "id": "blog-5",
    "slug": "ultimate-nepali-spiced-pakoda-guide",
    "title": "Chicken 65 Pakoda, Veg Pakoda or Fries: Choosing Your Snack",
    "excerpt": "A guide to the pakoda and crispy snack choices available from our Imadol restaurant.",
    "content": [
      "Chicken 65 Pakoda is one of the dishes to explore when you want a chicken snack from Crunchy Bag. Compare it with Classic Chicken Pakoda on the live menu, and read each description for the available preparation and portion details.",
      "For other pakoda choices, the menu includes Classic Veg Pakoda, Onion Pakoda and Paneer Pakoda. These names describe different options; they do not establish allergy suitability or guarantee that a dish meets a particular dietary requirement. Ask the restaurant if you need more ingredient information.",
      "If you want a different crispy side, browse French fries, crispy potatoes, chicken nuggets and chicken meatballs. Choose according to the dish description, quantity and current price rather than assuming all snacks are interchangeable portions.",
      "Order a snack on its own or pair it with a burger, sandwich or drink. There is no minimum order. The live menu and checkout show the selected items and final payable amount, including any applicable offer.",
      "Delivery across Kathmandu, Lalitpur and Bhaktapur and takeaway from Dhungesadhu Chowk, Imadol are available 24/7. Preparation usually takes 7–15 minutes depending on order size, with additional time for delivery."
    ],
    "category": "Food Guides",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/0a30df3f9d71f46d679d0b3bbefad260c9e228eba7c5cf274b092626dcd0ce2a.avif",
    "tags": [
      "Food Guides",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "Chicken 65 Pakoda, Veg Pakoda or Fries: Choosing Your Snack | Crunchy Bag",
    "metaDescription": "A guide to the pakoda and crispy snack choices available from our Imadol restaurant."
  },
  {
    "id": "blog-6",
    "slug": "inside-imadol-kitchen-thermal-delivery",
    "title": "24-Hour Food Delivery in Kathmandu Valley: Before You Order",
    "excerpt": "A late-night ordering checklist for Kathmandu, Lalitpur and Bhaktapur, with preparation and pickup information.",
    "content": [
      "If you need food late at night or early in the morning, Crunchy Bag offers delivery and takeaway 24 hours a day, seven days a week. The restaurant dispatches from Dhungesadhu Chowk, Imadol, Lalitpur, serving Kathmandu, Lalitpur and Bhaktapur.",
      "Start with the live menu to see which burgers, fried chicken, chicken 65 pakoda, fries, sandwiches, momo and drinks are currently available. A 24-hour service does not mean every item is always in stock: check the dish before completing your order.",
      "Give your complete delivery address, local tole, landmark and accurate location pin. This is especially useful for a building inside a lane or a shared entrance. Confirm the delivery charge for your address before paying.",
      "Preparation usually takes 7–15 minutes depending on how much food you order. The journey from Imadol takes additional time and depends on distance and traffic. Request a current estimate instead of treating preparation time as the full delivery time.",
      "Takeaway continues overnight if you prefer to collect your food. Dine-in has separate hours, from 5 AM to 11 PM daily. There is no minimum order; first website orders have a 10% offer, with the applicable discount shown in the checkout total."
    ],
    "category": "Delivery Tips",
    "author": "Crunchy Bag",
    "authorRole": "Restaurant team",
    "authorType": "Organization",
    "date": "Oct 31, 2026",
    "isoDate": "2026-10-31T12:00:00+05:45",
    "readTime": "3 min read",
    "image": "https://crunchybag.com/media/menu/1/17570680017190dd84761f1a2c9f8fdc0601493918db83fbed944d237552ff69.avif",
    "tags": [
      "Delivery Tips",
      "Crunchy Bag",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur"
    ],
    "metaTitle": "24-Hour Food Delivery in Kathmandu Valley: Before You Order | Crunchy Bag",
    "metaDescription": "A late-night ordering checklist for Kathmandu, Lalitpur and Bhaktapur, with preparation and pickup information."
  }
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
