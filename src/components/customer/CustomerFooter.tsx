import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Compass,
  Utensils,
  BookOpen,
  ShieldCheck,
  Trash2,
  Info,
  HelpCircle,
  Instagram,
  Share2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { ReserveTableModal } from "./ReserveTableModal";
import { AboutUsModal } from "./AboutUsModal";
import { BlogsModal } from "./BlogsModal";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { AccountDeletionModal } from "./AccountDeletionModal";
import { FaqModal } from "./FaqModal";

interface OutletLocation {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  status: "Open Now" | "Late Night Open";
}

const SINGLE_OUTLET: OutletLocation = {
  id: "imadol",
  name: "Crunchy Bag - Imadol Outlet & Kitchen",
  area: "Imadol, Lalitpur",
  address: "Imadol, Lalitpur, Nepal",
  phone: "9761503339",
  hours: "10:00 AM – 11:30 PM",
  lat: 27.6620,
  lng: 85.3410,
  status: "Open Now",
};

export const GOOGLE_MAPS_LOCATION_URL = "https://share.google/wJPKlrcMJueR0EmvX";

export const INSTAGRAM_VIRAL_TAGS = [
  { name: "#CrunchyBag", url: "https://www.instagram.com/explore/tags/crunchybag/" },
  { name: "#DidYouSeeThat", url: "https://www.instagram.com/explore/tags/didyouseethat/" },
  { name: "#StreetPrankNepal", url: "https://www.instagram.com/explore/tags/streetpranknepal/" },
  { name: "#ImadolDiaries", url: "https://www.instagram.com/explore/tags/imadoldiaries/" },
  { name: "#LalitpurVibes", url: "https://www.instagram.com/explore/tags/lalitpurvibes/" },
  { name: "#ComingSoonNepal", url: "https://www.instagram.com/explore/tags/comingsoonnepal/" },
  { name: "#PlotTwistReel", url: "https://www.instagram.com/explore/tags/plottwistreel/" },
  { name: "#NepalViralReels", url: "https://www.instagram.com/explore/tags/nepalviralreels/" },
  { name: "#FoodHypeNepal", url: "https://www.instagram.com/explore/tags/foodhypenepal/" },
  { name: "#EnjoyEachBiteWithCrunch", url: "https://www.instagram.com/explore/tags/enjoyeachbitewithcrunch/" },
];

export const CustomerFooter: React.FC = () => {
  const { openLoginModal } = useAuth();
  const {
    setCustomerActiveTab,
    setIsSearchModalOpen,
    setIsFavoritesModalOpen,
    setIsProfileModalOpen,
    setIsLoginModalOpen,
    loginAsRole,
    setActivePortal,
    setIsTableOrderMode,
  } = useApp();

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isBlogsModalOpen, setIsBlogsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize Leaflet Map with Single Location
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [SINGLE_OUTLET.lat, SINGLE_OUTLET.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      const customIcon = L.divIcon({
        className: "custom-outlet-pin",
        html: `
          <div style="
            width: 34px;
            height: 34px;
            background-color: #F59E0B;
            color: #000000;
            border: 2px solid #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px -1px rgba(0,0,0,0.35);
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
          ">
            CR
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([SINGLE_OUTLET.lat, SINGLE_OUTLET.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="padding: 4px; font-family: sans-serif;">
          <div style="font-weight: 900; font-size: 12px; margin-bottom: 2px;">${SINGLE_OUTLET.name}</div>
          <div style="font-size: 10px; color: #71717A;">${SINGLE_OUTLET.address}</div>
          <div style="font-size: 10px; color: #D97706; font-weight: bold; margin-top: 4px;">${SINGLE_OUTLET.hours}</div>
        </div>
      `).openPopup();

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <hr className="border-t border-zinc-200 dark:border-zinc-800" />
      <footer className="relative w-full pt-10 pb-8 bg-zinc-100/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Top Section: Single Location & Interactive Location Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  Our Location & Kitchen
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                {SINGLE_OUTLET.area}
              </span>
            </div>

            {/* Map + Single Outlet Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-sm overflow-hidden">
              {/* Interactive Leaflet Map (Left / Top: 7 cols) */}
              <div className="lg:col-span-7 h-64 sm:h-72 lg:h-80 relative bg-zinc-200 dark:bg-zinc-900">
                <div ref={mapContainerRef} className="w-full h-full z-10" />

                {/* Map Floating Guide Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 bg-zinc-900/90 text-white text-[11px] font-mono border border-zinc-800 backdrop-blur-xs flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-500" />
                  <span>Imadol, Lalitpur</span>
                </div>
              </div>

              {/* Outlet Quick Intel (Right: 5 cols) */}
              <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                        {SINGLE_OUTLET.status}
                      </span>
                      <h4 className="text-base font-black text-zinc-950 dark:text-white mt-1.5">
                        {SINGLE_OUTLET.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {SINGLE_OUTLET.area}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                      <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{SINGLE_OUTLET.address}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Open Daily: {SINGLE_OUTLET.hours}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                      <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                      <a
                        href={`tel:${SINGLE_OUTLET.phone}`}
                        className="font-mono font-bold hover:text-amber-500 transition-colors"
                      >
                        {SINGLE_OUTLET.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <a
                    href={GOOGLE_MAPS_LOCATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-center text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsReserveModalOpen(true)}
                    className="flex-1 py-2 px-3 text-center text-xs font-black bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Utensils className="h-3.5 w-3.5" />
                    <span>Reserve Table</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Social Viral Reel & Spot Us Callout Card */}
          <div className="p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-900/40 to-black text-zinc-900 dark:text-zinc-100 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                    <Instagram className="w-3 h-3" />
                    <span>Viral Reel &amp; Street Pranks</span>
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Nepal Street Vibes
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-zinc-950 dark:text-white">
                  Share this with a friend who always falls for pranks! 😂👇
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <a
                    href={GOOGLE_MAPS_LOCATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>📍 Spot Us: Imadol, Lalitpur</span>
                  </a>
                  <a
                    href={`tel:${SINGLE_OUTLET.phone}`}
                    className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>📞 Call / Order: {SINGLE_OUTLET.phone}</span>
                  </a>
                  <span className="text-zinc-500 text-[11px]">
                    Location: Imadol, Lalitpur
                  </span>
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={GOOGLE_MAPS_LOCATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`tel:${SINGLE_OUTLET.phone}`}
                  className="px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{SINGLE_OUTLET.phone}</span>
                </a>
              </div>
            </div>

            {/* Viral Hashtags */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Trending:</span>
              {INSTAGRAM_VIRAL_TAGS.map((tag) => (
                <a
                  key={tag.name}
                  href={tag.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono px-2 py-0.5 bg-zinc-200/70 dark:bg-zinc-800/80 hover:bg-amber-500/20 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 border border-zinc-300/80 dark:border-zinc-700 transition-colors"
                >
                  {tag.name}
                </a>
              ))}
            </div>
          </div>

          {/* Middle Section: Easy Navigation & Links Grid (5-column responsive layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-xs pt-4">
            {/* Col 1: Brand & Identity */}
            <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-1 space-y-3">
              <div
                className="cursor-pointer inline-block"
                onClick={() => {
                  setCustomerActiveTab("menu");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="Home"
              >
                <CrunchyLogo size="md" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                Handcrafted crispy fried chicken, smash burgers, and shakes in Kathmandu with eSewa instant checkout and live dispatch tracking.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#60BB46]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>eSewa Verified Gateway</span>
              </div>
            </div>

            {/* Col 2: Company & Stories (About Us & Blogs) */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider text-[11px]">
                About & Stories
              </h5>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left font-medium"
                  >
                    About Crunchy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsBlogsModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left font-medium flex items-center gap-1"
                  >
                    <span>Culinary Blog</span>
                    <span className="text-[9px] px-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold">
                      NEW
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left"
                  >
                    Himalayan Sourcing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left"
                  >
                    Food Hygiene Standard
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsFaqModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left font-medium flex items-center gap-1 text-zinc-900 dark:text-zinc-200"
                  >
                    <HelpCircle className="w-3 h-3 text-amber-500" />
                    <span>Frequently Asked Questions</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Menu & Online Ordering */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider text-[11px]">
                Menu & Orders
              </h5>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerActiveTab("menu");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Full Food Menu
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerActiveTab("orders");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Track Live Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Search Dishes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsFavoritesModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Saved Favorites
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsReserveModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-amber-600 dark:text-amber-400 font-bold"
                  >
                    Reserve Table &rarr;
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePortal("table-qr");
                      setIsTableOrderMode(true);
                    }}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left text-zinc-500 dark:text-zinc-400"
                  >
                    Table QR Order
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust, Legal & Privacy (Privacy Policy + User Account Deletion) */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider text-[11px]">
                Privacy & Data
              </h5>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left font-medium"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDeletionModalOpen(true)}
                    className="hover:text-rose-500 transition-colors cursor-pointer text-left font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Account</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left"
                  >
                    Customer Profile
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="hover:text-amber-500 transition-colors cursor-pointer text-left"
                  >
                    Nepal Privacy Act (2075)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Operations & Contact */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider text-[11px]">
                Contact & Location
              </h5>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li className="font-mono text-zinc-900 dark:text-zinc-200 font-bold">
                  <a href={`tel:${SINGLE_OUTLET.phone}`} className="hover:text-amber-500 transition-colors">
                    {SINGLE_OUTLET.phone}
                  </a>
                </li>
                <li className="text-zinc-500">
                  Email: hello@crunchybag.com
                </li>
                <li className="text-[11px]">
                  <a
                    href={GOOGLE_MAPS_LOCATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-500 transition-colors inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    <span>Imadol, Lalitpur</span>
                    <ExternalLink className="w-2.5 h-2.5 text-amber-500" />
                  </a>
                </li>
                <li className="pt-2">
                  <button
                    type="button"
                    id="footer-admin-login-btn"
                    onClick={() => {
                      openLoginModal();
                      setIsLoginModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    <span>Admin Login</span>
                    <span className="text-zinc-600">&rarr;</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Directory: Clean, 100% visible navigation */}
          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Quick Delivery Hubs:</span>
              <a href="/delivery/imadol" className="hover:text-amber-500 transition-colors font-medium">Imadol Hub</a> •
              <a href="/delivery/balkumari" className="hover:text-amber-500 transition-colors">Balkumari</a> •
              <a href="/delivery/gwarko" className="hover:text-amber-500 transition-colors">Gwarko</a> •
              <a href="/delivery/koteshwor" className="hover:text-amber-500 transition-colors">Koteshwor</a> •
              <a href="/delivery/baneshwor" className="hover:text-amber-500 transition-colors">Baneshwor</a> •
              <a href="/delivery/jhamsikhel" className="hover:text-amber-500 transition-colors">Jhamsikhel</a> •
              <a href="/delivery/thamel" className="hover:text-amber-500 transition-colors">Thamel</a> •
              <a href="/delivery" className="text-amber-600 dark:text-amber-400 hover:underline font-bold">View All 19+ Hubs &rarr;</a>
            </div>
          </div>

          {/* Bottom Bar: Legal & Policy Direct Quick Links */}
          <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>© {new Date().getFullYear()} Crunchy Bag Restaurant. All rights reserved.</p>

            <nav aria-label="Footer Legal and Policy Links" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(true)}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                About Us
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsBlogsModalOpen(true)}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                Blogs
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-500 transition-colors cursor-pointer"
                title="Google XML Sitemap"
              >
                Sitemap
              </a>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsDeletionModalOpen(true)}
                className="text-rose-600 dark:text-rose-400 hover:underline transition-colors cursor-pointer font-bold"
              >
                User Account Deletion
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setActivePortal("table-qr");
                  setIsTableOrderMode(true);
                }}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                Table QR
              </button>
              <span>•</span>
              <button
                type="button"
                id="footer-tv-board-btn"
                onClick={() => setActivePortal("tv")}
                className="hover:text-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer"
              >
                Live TV Screen
              </button>
              <span>•</span>
              <button
                type="button"
                id="footer-bottom-admin-login-btn"
                onClick={() => {
                  openLoginModal();
                  setIsLoginModalOpen(true);
                }}
                className="hover:text-amber-500 transition-colors cursor-pointer font-medium"
              >
                Admin Login
              </button>
              <span>•</span>
              <a
                href={GOOGLE_MAPS_LOCATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-500 transition-colors"
              >
                Imadol, Lalitpur
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Table Reservation Modal */}
      <ReserveTableModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        outletName={SINGLE_OUTLET.name}
        outletAddress={SINGLE_OUTLET.address}
      />

      {/* About Us Modal */}
      <AboutUsModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onExploreMenu={() => {
          setCustomerActiveTab("menu");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Blogs Modal */}
      <BlogsModal
        isOpen={isBlogsModalOpen}
        onClose={() => setIsBlogsModalOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onRequestDeletion={() => setIsDeletionModalOpen(true)}
      />

      {/* User Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
      />

      {/* Frequently Asked Questions Modal */}
      <FaqModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
      />
    </>
  );
};
