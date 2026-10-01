import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Search,
  Sparkles,
  Flame,
  ChefHat,
  ChevronRight,
  Filter,
} from "lucide-react";
import { BLOG_ARTICLES, BlogArticle } from "../../data/blogData";
import { updatePageSEO } from "../../lib/seo";

interface BlogsPortalPageProps {
  onNavigate?: (path: string) => void;
}

export const BlogsPortalPage: React.FC<BlogsPortalPageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    updatePageSEO({
      title: "Culinary Journal & Food Guides in Kathmandu | Crunchy Bag Blogs",
      description:
        "Explore kitchen secrets, Himalayan spice sourcing, and crispy fried chicken food guides in Kathmandu from Crunchy Bag culinary team.",
      canonical: "https://crunchybag.com/blogs",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
      type: "website",
    });
  }, []);

  const handleArticleClick = (e: React.MouseEvent, slug: string) => {
    // If middle click or ctrl/cmd click, let browser handle new tab natively
    if (e.ctrlKey || e.metaKey || e.button === 1) return;
    e.preventDefault();
    const targetUrl = `/blog/${slug}`;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (onNavigate) {
      onNavigate(targetUrl);
    }
  };

  const categories = [
    "All",
    "Kitchen Secrets",
    "Food Guides",
    "Local Sourcing",
    "Delivery Tips",
  ];

  const filteredArticles = BLOG_ARTICLES.filter((article) => {
    const matchesCategory =
      selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = BLOG_ARTICLES[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="hover:text-amber-500 transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-300 font-medium">Culinary Blogs</span>
        </nav>

        {/* Portal Header Hero */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider rounded-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Crunchy Culinary Journal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Stories, Food Science &amp; Kathmandu Kitchen Secrets
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            From our 18-hour cold brining technique in Imadol to Himalayan Timur peppercorn sourcing across Kavre and Chitwan, explore the passion behind Nepal’s premier crunch.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4 bg-[#121214] border border-zinc-800 p-4 sm:p-5 rounded-xs shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, recipes, tips..."
                className="w-full bg-[#18181B] border border-zinc-700 text-zinc-100 text-xs pl-9 pr-3.5 py-2.5 rounded-none focus:outline-hidden focus:border-amber-500 transition-colors placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-1 hidden sm:block" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                    selectedCategory === category
                      ? "bg-amber-500 text-black border-amber-500 shadow-xs font-black"
                      : "bg-[#18181B] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Story Hero Card (Show when category is All and no search) */}
        {selectedCategory === "All" && !searchQuery && featuredArticle && (
          <article className="grid grid-cols-1 lg:grid-cols-12 border border-zinc-800 bg-[#121214] hover:border-zinc-700 transition-colors shadow-lg overflow-hidden group">
            <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-zinc-900">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 shadow-md">
                Featured Story
              </div>
            </div>
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="text-amber-500 font-mono font-bold uppercase tracking-wider text-[11px]">
                    {featuredArticle.category}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{featuredArticle.readTime}</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                  <a
                    href={`/blog/${featuredArticle.slug}`}
                    onClick={(e) => handleArticleClick(e, featuredArticle.slug)}
                  >
                    {featuredArticle.title}
                  </a>
                </h2>

                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-black text-[10px]">
                    {featuredArticle.author.charAt(0)}
                  </div>
                  <span className="font-medium text-zinc-300">{featuredArticle.author}</span>
                </div>

                <a
                  href={`/blog/${featuredArticle.slug}`}
                  onClick={(e) => handleArticleClick(e, featuredArticle.slug)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 group-hover:translate-x-1 transition-transform"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </article>
        )}

        {/* Blog Articles Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {selectedCategory === "All" ? "All Culinary Articles" : `${selectedCategory} Articles`}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({filteredArticles.length})
              </span>
            </h2>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 space-y-3 bg-[#121214]/50">
              <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No articles match your search or filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="border border-zinc-800 bg-[#121214] hover:border-amber-500/50 transition-colors flex flex-col justify-between overflow-hidden group shadow-sm"
                >
                  <div>
                    {/* Thumbnail Link */}
                    <a
                      href={`/blog/${article.slug}`}
                      onClick={(e) => handleArticleClick(e, article.slug)}
                      className="block relative h-48 sm:h-52 overflow-hidden bg-zinc-900"
                    >
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-xs text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/30">
                        {article.category}
                      </div>
                    </a>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{article.date}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{article.readTime}</span>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                        <a
                          href={`/blog/${article.slug}`}
                          onClick={(e) => handleArticleClick(e, article.slug)}
                        >
                          {article.title}
                        </a>
                      </h3>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {article.excerpt}
                      </p>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Action */}
                  <div className="px-5 py-3.5 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      By {article.author}
                    </span>

                    <a
                      href={`/blog/${article.slug}`}
                      onClick={(e) => handleArticleClick(e, article.slug)}
                      className="font-bold text-amber-500 hover:text-amber-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Banner: Order Online or Visit Imadol */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-black border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              Hungry after reading our food stories?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Taste the difference of 18-hour cold brining, mountain Timur spice, and artisan smash burgers with instant online eSewa checkout.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/menu"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/menu");
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs border border-black shadow-md transition-colors"
            >
              Order Online Now
            </a>
            <a
              href="/combos"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/combos");
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-colors"
            >
              View Value Combos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
