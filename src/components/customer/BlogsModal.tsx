import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Tag,
  Share2,
  Sparkles,
  Search,
} from "lucide-react";
import { Modal } from "../common/Modal";

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: "Kitchen Secrets" | "Food Guides" | "Local Sourcing" | "Delivery Tips";
  author: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

// Configurable backend schema placeholder:
// In the future, this array will be fetched directly from GET /api/cms/blogs
export const INITIAL_BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-1",
    slug: "secret-to-kathmandus-crispiest-chicken",
    title: "The Science of the Crunch: How We Achieve Kathmandu's Crispiest Chicken",
    excerpt:
      "Ever wonder why ordinary fried chicken gets soggy on the way to Lalitpur while Crunchy stays shatteringly crisp? Here is the culinary physics behind our double-dredge method.",
    category: "Kitchen Secrets",
    author: "Head Chef Bikas Thapa",
    date: "Sep 12, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    tags: ["Fried Chicken", "Kitchen Secrets", "Kathmandu Food"],
    content: [
      "Most fried chicken suffers from a single fatal flaw: moisture migration from the steaming interior turns the outer crust into a damp sponge within ten minutes of leaving the fryer.",
      "At Crunchy, we tackled this challenge using a precision three-stage technique engineered specifically for Kathmandu's high altitude and fast-paced delivery geography.",
      "First, our poultry undergoes an 18-hour cold brine infused with Timur peppercorns, garlic, and buttermilk. The acidity breaks down collagen fibers, ensuring the meat retains its natural juices even at high frying temperatures.",
      "Second, we employ a proprietary cornstarch-and-rice-flour dredge ratio rather than standard wheat flour. Rice flour absorbs 50% less oil and forms a microscopic cellular lattice that repels ambient steam.",
      "Finally, our flash-frying process at 175°C locks in the crunch. Even after a 25-minute motorcycle journey through Lazimpat or Baneshwor, opening the box delivers that unmistakably loud, satisfying bite.",
    ],
  },
  {
    id: "blog-2",
    slug: "himalayan-timur-spices-sourcing",
    title: "From Kavre to Durbar Marg: Sourcing Ethical Poultry & Himalayan Spices",
    excerpt:
      "A deep dive into our farm-to-table supply chain in Nepal, partnering with organic smallholders for Timur, ginger, and free-range mountain chickens.",
    category: "Local Sourcing",
    author: "Sourcing Director Priya Shrestha",
    date: "Aug 28, 2026",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
    tags: ["Local Sourcing", "Nepal Agriculture", "Organic Spices"],
    content: [
      "Great fast food should not come at the expense of environmental ethics or local livelihoods. Since our founding, 100% of our chicken has been sourced from certified contract farmers in Kavre and Chitwan.",
      "These farms adhere to zero-antibiotic preventative standards, humane stocking densities, and natural grain feeding regimes. The result is firmer muscle texture and richer natural umami.",
      "For our seasoning blends, we source wild Timur peppers directly from organic cooperatives in Rolpa and Makwanpur. When combined with fresh local garlic and cold-pressed mustard oil, they provide that tingling citrus heat unique to the Himalayas.",
      "Every time you order a Crunchy bucket, you are directly supporting dozens of farming families across rural Nepal.",
    ],
  },
  {
    id: "blog-3",
    slug: "guide-to-ordering-with-esewa",
    title: "Zero-Friction Dining: How eSewa Instant Online Checkout Speeds Up Your Order",
    excerpt:
      "Why we moved to streamlined eSewa digital payments, ensuring instantaneous kitchen ticket printing and contact-free express courier handoffs.",
    category: "Delivery Tips",
    author: "Crunchy Operations Team",
    date: "Aug 15, 2026",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80",
    tags: ["eSewa", "Digital Nepal", "Fast Delivery"],
    content: [
      "In modern food delivery, seconds count. Cash on delivery often leads to courier delays while counting change, finding loose notes in the rain, or waiting at the doorstep.",
      "By integrating direct eSewa digital wallet settlement, your order triggers our Kitchen Display System (KDS) immediately within 0.8 seconds of payment authorization.",
      "Couriers receive clear digital manifests and can hand over your food in under 5 seconds upon arrival. No card terminals that drop Wi-Fi signal, and no cash exchange hurdles.",
      "Look out for special monthly cashbacks and exclusive eSewa loyalty points on all Crunchy combo packages!",
    ],
  },
  {
    id: "blog-4",
    slug: "perfect-burger-anatomy-kathmandu",
    title: "The Anatomy of a Smash Burger: Why Lacy Edges Matter",
    excerpt:
      "Thick pucks are out; wafer-thin, caramelized smashed beef and chicken patties are in. Here is why the smash technique unlocks maximum flavor.",
    category: "Food Guides",
    author: "Head Chef Bikas Thapa",
    date: "Jul 30, 2026",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    tags: ["Smash Burgers", "Food Science", "Kathmandu Eats"],
    content: [
      "When a meatball hits a 230°C cast-iron flattop and is violently smashed with a heavy steel press, something magical occurs: the Maillard reaction goes into overdrive.",
      "Instead of a soggy sponge of minced meat, smashing creates thousands of microscopic browned ridges and lace-thin crispy perimeter edges.",
      "At Crunchy, we pair this intense crust with toasted butter brioche buns baked daily in Patan, house-made dill pickles, and our signature burger sauce.",
      "The result is a burger that can be eaten cleanly with one hand without falling apart.",
    ],
  },
];

interface BlogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlogsModal: React.FC<BlogsModalProps> = ({ isOpen, onClose }) => {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Kitchen Secrets", "Food Guides", "Local Sourcing", "Delivery Tips"];

  const filteredArticles = INITIAL_BLOG_ARTICLES.filter((article) => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedArticle(null);
        onClose();
      }}
      maxWidth={selectedArticle ? "2xl" : "3xl"}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
            {selectedArticle ? "Crunchy Journal" : "Crunchy Culinary Blog & Stories"}
          </span>
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Kitchen secrets, local sourcing guides, and news from Kathmandu
        </span>
      }
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {selectedArticle ? (
          /* Single Article Reader View */
          <div className="space-y-5">
            <button
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all articles</span>
            </button>

            {/* Article Image */}
            <div className="relative h-48 sm:h-64 w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                {selectedArticle.category}
              </div>
            </div>

            {/* Meta header */}
            <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white leading-snug">
                {selectedArticle.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  {selectedArticle.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {selectedArticle.readTime}
                </span>
                <span>•</span>
                <span>By {selectedArticle.author}</span>
              </div>
            </div>

            {/* Article Body Content */}
            <div className="space-y-3.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {selectedArticle.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              {selectedArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Blog Listing View */
          <div className="space-y-4">
            {/* Search & Category Filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes, ingredients, delivery tips..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs px-2.5 py-1 whitespace-nowrap font-bold transition-colors cursor-pointer border ${
                      activeCategory === cat
                        ? "bg-amber-500 text-black border-amber-500 font-black shadow-2xs"
                        : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-black/85 text-amber-400 border border-amber-500/40">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-10 text-xs text-zinc-500">
                No blog articles match your search.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
