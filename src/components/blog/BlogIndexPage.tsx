import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  Flame,
  ChefHat,
  ChevronRight,
  ShoppingBag,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { BLOG_ARTICLES, BlogArticle } from "../../data/blogs";
import { applyPageSeo } from "../../lib/seo";

interface BlogIndexPageProps {
  onNavigateToPost: (slug: string) => void;
  onNavigateToMenu: () => void;
}

export const BlogIndexPage: React.FC<BlogIndexPageProps> = ({
  onNavigateToPost,
  onNavigateToMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    applyPageSeo({
      title: "Food Blog & Kathmandu Culinary Guides",
      description:
        "Explore culinary guides, fried chicken recipes, smash burger science, and food culture in Kathmandu by the chefs at Crunchy Bag.",
      keywords: [
        "crunchy bag blog",
        "kathmandu food blog",
        "fried chicken kathmandu",
        "best burger kathmandu",
        "crunchy momo guide",
        "food in kathmandu"
      ],
      canonicalUrl: "https://crunchybag.com/blog",
      ogType: "website",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    BLOG_ARTICLES.forEach((a) => cats.add(a.category));
    return ["All", ...Array.from(cats)];
  }, []);

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = BLOG_ARTICLES[0];

  const handlePostClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    onNavigateToPost(slug);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased pb-20">
      {/* Header Breadcrumbs & Banner */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-[#131317] to-[#09090B] pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
            <button
              onClick={onNavigateToMenu}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-amber-400 font-bold">Food Blog & Guides</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crunchy Bag Culinary Chronicles</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Kathmandu Food Stories, Kitchen Secrets & Master Guides
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              Deep dives into why double-dredged chicken stays crunchy across
              Kathmandu, how smash burgers caramelize, and behind-the-scenes
              culinary craft from our Durbar Marg kitchen.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-zinc-800/80">
            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Keyword Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food guides, recipes..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Featured Story Banner (Shown if no search query active) */}
        {!searchQuery && selectedCategory === "All" && featuredArticle && (
          <div className="mb-14 bg-gradient-to-r from-zinc-900 to-[#16161b] border border-zinc-800 overflow-hidden group hover:border-amber-500/50 transition-all shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full min-h-[280px] overflow-hidden">
                <img
                  src={featuredArticle.featuredImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg">
                    Featured Deep-Dive
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                    <span className="text-amber-400 font-semibold">
                      {featuredArticle.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredArticle.readTime}
                    </span>
                  </div>

                  <a
                    href={`/blog/${featuredArticle.slug}`}
                    onClick={(e) => handlePostClick(e, featuredArticle.slug)}
                    className="block group-hover:text-amber-400 transition-colors"
                  >
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3">
                      {featuredArticle.title}
                    </h2>
                  </a>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {featuredArticle.author.avatar && (
                      <img
                        src={featuredArticle.author.avatar}
                        alt={featuredArticle.author.name}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                      />
                    )}
                    <span className="text-xs font-medium text-zinc-300">
                      {featuredArticle.author.name}
                    </span>
                  </div>

                  <a
                    href={`/blog/${featuredArticle.slug}`}
                    onClick={(e) => handlePostClick(e, featuredArticle.slug)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                  >
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {selectedCategory === "All"
                ? "All Culinary Articles & Guides"
                : `${selectedCategory} Articles`}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Showing {filteredArticles.length} published guide
              {filteredArticles.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Blog Article Cards Grid */}
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 bg-zinc-950/50">
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-300 mb-1">
              No matching articles found
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Try adjusting your search terms or selecting another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col bg-[#111114] border border-zinc-800/90 hover:border-amber-500/50 transition-all duration-300 group overflow-hidden"
              >
                {/* Article Card Image */}
                <a
                  href={`/blog/${article.slug}`}
                  onClick={(e) => handlePostClick(e, article.slug)}
                  className="relative aspect-[16/9] overflow-hidden bg-zinc-900 block"
                >
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 bg-black/80 backdrop-blur-sm border border-zinc-700 text-[11px] font-semibold text-amber-400">
                      {article.category}
                    </span>
                  </div>
                </a>

                {/* Article Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {article.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {article.readTime}
                      </span>
                    </div>

                    <a
                      href={`/blog/${article.slug}`}
                      onClick={(e) => handlePostClick(e, article.slug)}
                      className="block group-hover:text-amber-400 transition-colors"
                    >
                      <h3 className="text-base font-bold text-white leading-snug mb-2.5 line-clamp-2">
                        {article.title}
                      </h3>
                    </a>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Footer / Read Link */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      By {article.author.name}
                    </span>
                    <a
                      href={`/blog/${article.slug}`}
                      onClick={(e) => handlePostClick(e, article.slug)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      Read Guide <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Order Now Conversion Banner */}
        <div className="mt-16 bg-gradient-to-r from-amber-500 to-amber-600 text-black p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-xl text-center md:text-left">
            <span className="px-2.5 py-0.5 bg-black text-amber-400 text-[10px] font-mono font-black uppercase tracking-wider inline-block mb-3">
              Taste The Crunch
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to Experience Kathmandu's Crispiest Food?
            </h2>
            <p className="text-xs sm:text-sm font-medium text-black/80 mt-2">
              Order double-dredged fried chicken, smash burgers, and crunchy
              momos right now. Hot delivery across Kathmandu with instant eSewa
              checkout.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onNavigateToMenu}
              className="px-6 py-3.5 bg-black hover:bg-zinc-900 text-white font-black text-sm tracking-wide transition-all shadow-lg flex items-center gap-2 cursor-pointer group"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>EXPLORE FULL MENU & ORDER</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
