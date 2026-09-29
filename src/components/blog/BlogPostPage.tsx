import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Share2,
  Check,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  getArticleBySlug,
  getRelatedArticles,
  BlogArticle,
} from "../../data/blogs";
import { applyPageSeo } from "../../lib/seo";
import { useApp } from "../../context/AppContext";

interface BlogPostPageProps {
  slug: string;
  onNavigateToBlogIndex: () => void;
  onNavigateToPost: (slug: string) => void;
  onNavigateToMenu: () => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({
  slug,
  onNavigateToBlogIndex,
  onNavigateToPost,
  onNavigateToMenu,
}) => {
  const { addToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);

  const article = getArticleBySlug(slug);
  const relatedArticles = getRelatedArticles(slug, 3);

  useEffect(() => {
    if (article) {
      applyPageSeo({
        title: article.metaTitle,
        description: article.metaDescription,
        keywords: article.keywords,
        canonicalUrl: article.canonicalUrl,
        ogImage: article.featuredImage,
        ogImageAlt: article.title,
        publishedTime: article.isoDate,
        authorName: article.author.name,
        article,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [article]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || "Crunchy Bag Food Story",
          url,
        });
        return;
      } catch (err) {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      addToast({
        title: "Article Link Copied!",
        message: "Share this food guide with your friends.",
        type: "success",
      });
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePostClick = (e: React.MouseEvent, targetSlug: string) => {
    e.preventDefault();
    onNavigateToPost(targetSlug);
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-[#111114] border border-zinc-800">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">
            Article Not Found
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
            The culinary story you are looking for may have been moved or updated.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateToBlogIndex}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Browse All Food Guides
            </button>
            <button
              onClick={onNavigateToMenu}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-800 text-zinc-200 font-bold text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#09090B] text-zinc-100 antialiased pb-24">
      {/* Top Breadcrumb Bar */}
      <section className="border-b border-zinc-800/80 bg-[#111114]/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={onNavigateToMenu}
              className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <button
              onClick={onNavigateToBlogIndex}
              className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Blog
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-500 whitespace-nowrap hidden sm:inline">
              {article.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 hidden sm:inline" />
            <span className="text-amber-400 font-bold truncate max-w-[200px] sm:max-w-xs">
              {article.title}
            </span>
          </nav>

          <button
            onClick={onNavigateToBlogIndex}
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Guides
          </button>
        </div>
      </section>

      {/* Article Header & Main Article Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Category & Read Time */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-4">
          <span className="px-3 py-1 bg-amber-500 text-black font-black uppercase text-[11px] tracking-wider">
            {article.category}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {article.readTime}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            {article.date}
          </span>
        </div>

        {/* H1 Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2] mb-6">
          {article.title}
        </h1>

        {/* Excerpt Lead Paragraph */}
        <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed mb-6 border-l-2 border-amber-500 pl-4 py-1 italic">
          {article.excerpt}
        </p>

        {/* Author Bio Bar & Share Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-zinc-800/80 mb-8 bg-[#121215] px-4">
          <div className="flex items-center gap-3">
            {article.author.avatar && (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-500/50"
              />
            )}
            <div>
              <p className="text-xs font-bold text-white">
                {article.author.name}
              </p>
              <p className="text-[11px] text-amber-400/90 font-mono">
                {article.author.role} • Crunchy Bag Kathmandu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              title="Share this article"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share Story</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-900 border border-zinc-800 mb-10 shadow-2xl relative">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 backdrop-blur-sm text-[10px] font-mono text-zinc-400">
            Durbar Marg Kitchen • Crunchy Bag
          </div>
        </div>

        {/* Executive Summary / Key Takeaways Box (Google Answer Box Target) */}
        {article.summaryPoints && article.summaryPoints.length > 0 && (
          <div className="mb-12 p-6 sm:p-7 bg-[#141419] border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Key Culinary Takeaways</span>
            </div>
            <ul className="space-y-2.5">
              {article.summaryPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formatted Content Sections */}
        <div className="space-y-10 text-zinc-300 leading-relaxed font-normal">
          {article.contentSections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              {section.heading && (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight pt-4 border-t border-zinc-800/60 first:border-0 first:pt-0">
                  {section.heading}
                </h2>
              )}

              {section.subheading && (
                <h3 className="text-base sm:text-lg font-bold text-amber-400">
                  {section.subheading}
                </h3>
              )}

              {section.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base leading-relaxed text-zinc-300">
                  {para}
                </p>
              ))}

              {section.callout && (
                <blockquote className="my-6 p-4 sm:p-5 bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-xs sm:text-sm font-medium leading-relaxed">
                  "{section.callout}"
                </blockquote>
              )}

              {section.list && section.list.length > 0 && (
                <ul className="my-4 space-y-2 pl-2">
                  {section.list.map((item, lIdx) => (
                    <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.image && (
                <figure className="my-6">
                  <img
                    src={section.image.url}
                    alt={section.image.alt}
                    className="w-full aspect-[16/9] object-cover border border-zinc-800"
                    loading="lazy"
                  />
                  {section.image.caption && (
                    <figcaption className="text-center text-xs text-zinc-500 mt-2 font-mono">
                      {section.image.caption}
                    </figcaption>
                  )}
                </figure>
              )}
            </section>
          ))}
        </div>

        {/* Menu Recommendations: Order Now Directly From Blog */}
        {article.menuRecommendations && article.menuRecommendations.length > 0 && (
          <div className="mt-14 pt-10 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Featured On Our Menu
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Taste What You Just Read
                </h2>
              </div>
              <button
                onClick={onNavigateToMenu}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                Full Menu &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {article.menuRecommendations.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#121216] border border-zinc-800 p-4 flex gap-4 hover:border-amber-500/60 transition-all group"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0 border border-zinc-700/60"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-amber-500 text-black inline-block mb-1">
                          {item.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {item.price}
                      </span>
                      <button
                        onClick={onNavigateToMenu}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Section (Google FAQPage Schema Support) */}
        {article.faqs && article.faqs.length > 0 && (
          <div className="mt-14 pt-10 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {article.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#121215] border border-zinc-800/90 p-5 hover:border-zinc-700 transition-colors"
                >
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article Tags */}
        <div className="mt-10 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          <span className="text-xs text-zinc-500 font-mono mr-2">Tags:</span>
          {article.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Related Articles Carousel / Grid */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-800">
            <h2 className="text-xl font-black text-white mb-6">
              Read Next: More Food Stories & Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  onClick={(e) => handlePostClick(e, rel.slug)}
                  className="bg-[#121215] border border-zinc-800/90 hover:border-amber-500/50 p-4 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden mb-3 bg-zinc-900">
                      <img
                        src={rel.featuredImage}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase">
                      {rel.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mt-1">
                      {rel.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-3 inline-flex items-center gap-1 group-hover:text-amber-400">
                    Read Story <ArrowRight className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onNavigateToBlogIndex}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Kathmandu Food Guides</span>
          </button>
        </div>
      </main>
    </article>
  );
};
