import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  Facebook,
  Twitter,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  ShoppingBag,
  MapPin,
  Utensils,
} from "lucide-react";
import { getBlogBySlug, getRelatedBlogs, BlogArticle } from "../../data/blogData";
import { updatePageSEO } from "../../lib/seo";

interface BlogDetailPageProps {
  slug?: string;
  onNavigate?: (path: string) => void;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ slug: propSlug, onNavigate }) => {
  // Extract slug from prop or current pathname
  const activeSlug = React.useMemo(() => {
    if (propSlug) return propSlug;
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
      const match = path.match(/^\/(?:blogs?)\/([^\/]+)/);
      if (match && match[1]) return match[1];
    }
    return "";
  }, [propSlug]);

  const article = React.useMemo(() => {
    return activeSlug ? getBlogBySlug(activeSlug) : undefined;
  }, [activeSlug]);

  const relatedArticles = React.useMemo(() => {
    return article ? getRelatedBlogs(article.slug, 3) : [];
  }, [article]);

  const [copied, setCopied] = useState(false);

  // SEO Synchronization on Mount & Slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (article) {
      const fullUrl = `https://crunchybag.com/blog/${article.slug}`;

      updatePageSEO({
        title: article.metaTitle,
        description: article.metaDescription,
        canonical: fullUrl,
        image: article.image,
        type: "article",
        author: article.author,
        publishedTime: article.isoDate,
        section: article.category,
        tags: article.tags,
        schema: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${fullUrl}#article`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": fullUrl,
          },
          headline: article.title,
          description: article.excerpt,
          image: [article.image],
          datePublished: article.isoDate,
          dateModified: article.isoDate,
          author: {
            "@type": "Person",
            name: article.author,
            jobTitle: article.authorRole,
          },
          publisher: {
            "@type": "Organization",
            name: "Crunchy Bag",
            logo: {
              "@type": "ImageObject",
              url: "https://crunchybag.com/crunchy_logo.png",
            },
          },
          keywords: article.tags.join(", "),
        },
      });
    } else {
      updatePageSEO({
        title: "Article Not Found | Crunchy Bag Culinary Blog",
        description: "The requested culinary article could not be found. Browse our latest food stories.",
        canonical: "https://crunchybag.com/blogs",
      });
    }
  }, [article]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const navigateTo = (e: React.MouseEvent, path: string) => {
    if (e.ctrlKey || e.metaKey || e.button === 1) return;
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (onNavigate) {
      onNavigate(path);
    }
  };

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-4 bg-[#09090b]">
        <BookOpen className="w-12 h-12 text-zinc-600" />
        <h1 className="text-2xl font-black text-white">Article Not Found</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          The culinary story you are looking for may have moved or been updated.
        </p>
        <a
          href="/blogs"
          onClick={(e) => navigateTo(e, "/blogs")}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
        >
          &larr; Return to Culinary Journal
        </a>
      </div>
    );
  }

  const shareText = encodeURIComponent(`${article.title} - Crunchy Bag`);
  const shareUrl = encodeURIComponent(`https://crunchybag.com/blog/${article.slug}`);

  return (
    <article className="min-h-screen bg-[#09090b] text-zinc-100 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <a
            href="/"
            onClick={(e) => navigateTo(e, "/")}
            className="hover:text-amber-500 transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <a
            href="/blogs"
            onClick={(e) => navigateTo(e, "/blogs")}
            className="hover:text-amber-500 transition-colors"
          >
            Culinary Blogs
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className="text-zinc-300 font-medium truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </nav>

        {/* Back Link Button */}
        <div>
          <a
            href="/blogs"
            onClick={(e) => navigateTo(e, "/blogs")}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </a>
        </div>

        {/* Article Header & Meta */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[11px] font-mono font-black uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{article.readTime}</span>
            </div>
            <span className="text-xs text-zinc-500">•</span>
            <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <time dateTime={article.isoDate}>{article.date}</time>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Author Byline & Social Sharing Strip */}
          <div className="pt-4 border-t border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-500 font-black text-sm">
                {article.author.charAt(0)}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">{article.author}</p>
                <p className="text-[11px] text-zinc-400">{article.authorRole} • Crunchy Bag</p>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                title="Copy article link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#18181B] hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 border border-zinc-700 transition-colors"
                title="Share on WhatsApp"
              >
                <span className="text-xs font-bold font-mono">WA</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#18181B] hover:bg-sky-500/20 text-zinc-300 hover:text-sky-400 border border-zinc-700 transition-colors"
                title="Share on X"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#18181B] hover:bg-blue-500/20 text-zinc-300 hover:text-blue-400 border border-zinc-700 transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* Hero Featured Image */}
        <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-72 sm:h-96 md:h-[420px] object-cover"
            loading="eager"
          />
          <div className="p-2 bg-black/80 text-[10px] font-mono text-zinc-400 text-right">
            Photo: Crunchy Bag Kitchen Archives &amp; Culinary Lab
          </div>
        </div>

        {/* Lead Excerpt Callout */}
        <div className="p-4 sm:p-5 bg-amber-500/10 border-l-4 border-amber-500 text-zinc-200 text-sm sm:text-base font-medium leading-relaxed italic">
          "{article.excerpt}"
        </div>

        {/* Article Body Paragraphs */}
        <div className="space-y-5 text-sm sm:text-base leading-relaxed text-zinc-300">
          {article.content.map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Featured Dish Pairing Callout (Direct Order CTA) */}
        {article.relatedDish && (
          <div className="p-5 sm:p-6 bg-[#121214] border border-amber-500/40 rounded-xs shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Taste The Story
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={article.relatedDish.image}
                  alt={article.relatedDish.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-zinc-700 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">{article.relatedDish.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{article.relatedDish.description}</p>
                  <p className="text-xs font-mono font-bold text-amber-400">
                    NPR {article.relatedDish.price}
                  </p>
                </div>
              </div>

              <a
                href="/menu"
                onClick={(e) => navigateTo(e, "/menu")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs border border-black shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{article.relatedDish.actionLabel}</span>
              </a>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-1">Topics:</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Location & Kitchen Dispatch Guarantee */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Prepared fresh daily at <strong>Crunchy Bag – Imadol, Lalitpur</strong>. Express delivery across Kathmandu Valley.
            </span>
          </div>
          <a
            href="https://share.google/wJPKlrcMJueR0EmvX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:underline font-mono text-[11px] shrink-0"
          >
            Google Maps &rarr;
          </a>
        </div>

        {/* Related Stories Grid */}
        {relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>More Culinary Stories</span>
              </h2>
              <a
                href="/blogs"
                onClick={(e) => navigateTo(e, "/blogs")}
                className="text-xs text-amber-500 hover:underline font-bold"
              >
                View All &rarr;
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  onClick={(e) => navigateTo(e, `/blog/${rel.slug}`)}
                  className="border border-zinc-800 bg-[#121214] hover:border-amber-500/50 transition-colors p-3.5 space-y-2.5 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-32 overflow-hidden bg-zinc-900">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-bold">
                      {rel.category}
                    </span>
                    <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {rel.readTime}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};
