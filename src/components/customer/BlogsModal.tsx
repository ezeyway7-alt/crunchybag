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

import { BLOG_ARTICLES, BlogArticle } from "../../data/blogData";

export const INITIAL_BLOG_ARTICLES = BLOG_ARTICLES;

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
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Kitchen secrets, local sourcing guides, and news from Kathmandu</span>
          <a
            href="/blogs"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "/blogs");
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="text-amber-500 hover:underline font-bold text-[11px] ml-2 shrink-0"
          >
            Blogs Portal &rarr;
          </a>
        </div>
      }
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {selectedArticle ? (
          /* Single Article Reader View */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedArticle(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to all articles</span>
              </button>

              <a
                href={`/blog/${selectedArticle.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  if (typeof window !== "undefined") {
                    window.history.pushState(null, "", `/blog/${selectedArticle.slug}`);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-xs transition-colors"
              >
                <span>Full Page View</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

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
                <a
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  onClick={(event) => {
                    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onClose();
                    window.history.pushState(null, '', `/blog/${article.slug}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
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
                </a>
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
