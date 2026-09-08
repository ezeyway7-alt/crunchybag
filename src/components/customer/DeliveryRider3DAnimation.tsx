import React from "react";
import { motion } from "motion/react";
import { Bike, Navigation, Sparkles, MapPin, Compass, ShieldCheck } from "lucide-react";
import { Button } from "../common/Button";

interface DeliveryRider3DAnimationProps {
  onExploreMenu: () => void;
  hasOrders: boolean;
}

export const DeliveryRider3DAnimation: React.FC<DeliveryRider3DAnimationProps> = ({
  onExploreMenu,
  hasOrders,
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[580px]">
      {/* Background isometric grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Decorative top badges */}
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-amber-500 text-black border border-black shadow-xs">
          <Navigation className="h-3 w-3" />
          <span>Real-Time Fleet Radar</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <Compass className="h-3 w-3 text-amber-500" />
          <span>Kathmandu Valley Hubs</span>
        </span>
      </div>

      {/* 3D Isometric Animated Road & Delivery Bike Scene */}
      <div className="relative w-full max-w-[480px] h-[240px] sm:h-[270px] flex items-center justify-center my-2 [perspective:1000px]">
        {/* Isometric 3D Stage Platform */}
        <div
          className="relative w-[340px] sm:w-[420px] h-[190px] [transform-style:preserve-3d] flex items-center justify-center"
          style={{
            transform: "rotateX(58deg) rotateZ(-24deg)",
          }}
        >
          {/* Ground Platform Shadow */}
          <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/5 blur-xl -translate-z-10 rounded-full" />

          {/* 3D Asphalt Highway Road Slab */}
          <div className="absolute w-[360px] sm:w-[440px] h-[95px] bg-zinc-900 border-y-2 border-amber-500 shadow-2xl shadow-black/80 flex items-center justify-center overflow-hidden [transform:translateZ(0px)]">
            {/* Animated Dashed Lane Road Lines */}
            <motion.div
              className="w-full flex items-center gap-4 px-2"
              animate={{ x: [-60, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.7,
                ease: "linear",
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="w-8 h-1.5 bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                />
              ))}
            </motion.div>

            {/* Road curbs & lane edge guides */}
            <div className="absolute top-1 left-0 right-0 h-[1px] bg-white/20" />
            <div className="absolute bottom-1 left-0 right-0 h-[1px] bg-white/20" />
          </div>

          {/* Kathmandu Landmark Beacons along the highway */}
          <div className="absolute -top-6 left-6 [transform:translateZ(25px)] flex items-center gap-1 text-[9px] font-mono font-black text-amber-400 bg-black/90 px-1.5 py-0.5 border border-amber-500/60 shadow-md">
            <MapPin className="h-2.5 w-2.5 text-amber-500 animate-bounce" />
            <span>Durbar Marg Hub</span>
          </div>
          <div className="absolute -bottom-6 right-8 [transform:translateZ(25px)] flex items-center gap-1 text-[9px] font-mono font-black text-zinc-300 bg-black/90 px-1.5 py-0.5 border border-zinc-700 shadow-md">
            <MapPin className="h-2.5 w-2.5 text-amber-400" />
            <span>Patan / Jhamsikhel</span>
          </div>

          {/* 3D Delivery Motorcycle & Rider Avatar */}
          <motion.div
            className="relative z-20 flex flex-col items-center [transform:translateZ(30px)]"
            animate={{
              y: [-3, 3, -3],
              rotateZ: [-1, 1, -1],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
            }}
          >
            {/* Speed trails & particle waves behind bike */}
            <div className="absolute -left-12 top-6 flex flex-col gap-1.5 opacity-60">
              <motion.span
                className="w-10 h-0.5 bg-amber-400"
                animate={{ opacity: [0.2, 1, 0.2], x: [-10, 0, -10] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white"
                animate={{ opacity: [0.1, 0.8, 0.1], x: [-6, 0, -6] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
              />
              <motion.span
                className="w-8 h-0.5 bg-amber-400"
                animate={{ opacity: [0.3, 0.9, 0.3], x: [-8, 0, -8] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
              />
            </div>

            {/* Custom 3D SVG Delivery Rider & Bike */}
            <svg
              width="150"
              height="110"
              viewBox="0 0 150 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_12px_10px_rgba(0,0,0,0.6)]"
            >
              {/* Bike Shadow on Asphalt */}
              <ellipse cx="75" cy="100" rx="45" ry="8" fill="rgba(0,0,0,0.7)" />

              {/* Rear Wheel */}
              <circle cx="35" cy="82" r="16" fill="#18181B" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="35" cy="82" r="8" fill="#27272A" />
              <line x1="35" y1="66" x2="35" y2="98" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="19" y1="82" x2="51" y2="82" stroke="#F59E0B" strokeWidth="1.5" />

              {/* Front Wheel */}
              <circle cx="115" cy="82" r="16" fill="#18181B" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="115" cy="82" r="8" fill="#27272A" />
              <line x1="115" y1="66" x2="115" y2="98" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="99" y1="82" x2="131" y2="82" stroke="#F59E0B" strokeWidth="1.5" />

              {/* Bike Chassis / Engine Body */}
              <path
                d="M35 82 L65 72 L95 72 L115 82 L85 58 L55 58 Z"
                fill="#09090B"
                stroke="#F59E0B"
                strokeWidth="2"
              />

              {/* Exhaust Pipe with Steam */}
              <path d="M40 85 L20 87" stroke="#71717A" strokeWidth="4" strokeLinecap="round" />
              <circle cx="15" cy="87" r="2.5" fill="#E4E4E7" opacity="0.8" />

              {/* Crunchy Insulated Thermal Delivery Box on Rack */}
              <g>
                <rect
                  x="24"
                  y="38"
                  width="28"
                  height="26"
                  fill="#F59E0B"
                  stroke="#000000"
                  strokeWidth="2"
                />
                <rect x="27" y="41" width="22" height="6" fill="#000000" />
                <text
                  x="38"
                  y="46"
                  fill="#F59E0B"
                  fontSize="5"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  CRUNCHY
                </text>
                {/* Straps */}
                <line x1="24" y1="52" x2="52" y2="52" stroke="#000000" strokeWidth="1.5" />
                {/* Hot food steam rising */}
                <path
                  d="M34 34 Q36 30 34 26"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <path
                  d="M42 33 Q44 29 42 25"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>

              {/* Rider Body & Torso */}
              <path
                d="M56 62 L66 42 L80 44 L78 68 Z"
                fill="#18181B"
                stroke="#000"
                strokeWidth="1.5"
              />

              {/* Rider Arms gripping handlebar */}
              <path
                d="M68 46 L92 50 L98 56"
                stroke="#27272A"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Handlebar & Windshield */}
              <path d="M96 52 L102 46 L108 58" stroke="#F59E0B" strokeWidth="2.5" />
              <path d="M102 46 L106 38" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

              {/* Headlight Beam cast forward */}
              <polygon
                points="118,60 148,50 148,78 118,66"
                fill="url(#headlightGradient)"
                opacity="0.65"
              />

              {/* Rider Helmet */}
              <circle cx="72" cy="30" r="10" fill="#F59E0B" stroke="#000000" strokeWidth="2" />
              {/* Visor */}
              <path
                d="M74 27 Q82 30 76 35"
                stroke="#000000"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="headlightGradient" x1="118" y1="63" x2="148" y2="63" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Narrative & Call-to-action */}
      <div className="max-w-md space-y-2.5 mt-2 z-10">
        <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
          {hasOrders ? "Select an Order to Track" : "No Active Orders Found"}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {hasOrders
            ? "Choose an order from the list on the left to monitor live kitchen frying, rider dispatch coordinates, and your immutable receipt."
            : "Craving hot, crispy fried chicken, burgers, or momos? Place your first delivery or takeaway order now."}
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onExploreMenu}
            className="text-xs font-black rounded-none bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-md"
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
          >
            Explore Crunchy Menu
          </Button>
        </div>
      </div>

      {/* Fleet compliance footer */}
      <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-[10px] text-zinc-400 uppercase font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Pathao & Yango GPS Ready
        </span>
        <span>•</span>
        <span>Zero Contact Delivery</span>
        <span>•</span>
        <span>Hot Bag Guarantee</span>
      </div>
    </div>
  );
};
