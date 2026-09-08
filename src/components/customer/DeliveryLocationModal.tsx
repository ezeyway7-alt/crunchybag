import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Search,
  Check,
  Building,
  Compass,
  AlertCircle,
  Crosshair,
  Sparkles,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

// Pre-indexed landmark hubs familiar from ride-sharing apps (Pathao, Yango, InDrive)
export interface LandmarkItem {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  type: "commercial" | "residential" | "heritage" | "transit";
}

export const KATHMANDU_LANDMARKS: LandmarkItem[] = [
  { id: "lm-1", name: "Durbar Marg (Kings Way)", area: "Central Kathmandu", lat: 27.7125, lng: 85.3175, type: "commercial" },
  { id: "lm-2", name: "Lazimpat / Radisson", area: "North Central", lat: 27.7212, lng: 85.3196, type: "residential" },
  { id: "lm-3", name: "Thamel Tourism Hub", area: "Thamel", lat: 27.7154, lng: 85.3123, type: "commercial" },
  { id: "lm-4", name: "New Baneshwor (Parliament Area)", area: "Baneshwor", lat: 27.6934, lng: 85.3387, type: "transit" },
  { id: "lm-5", name: "Jhamsikhel Food Street", area: "Lalitpur", lat: 27.6749, lng: 85.3094, type: "commercial" },
  { id: "lm-6", name: "Pulchowk Engineering Campus", area: "Lalitpur", lat: 27.6792, lng: 85.3179, type: "transit" },
  { id: "lm-7", name: "Jawalakhel Roundabout (Zoo)", area: "Lalitpur", lat: 27.6698, lng: 85.3142, type: "commercial" },
  { id: "lm-8", name: "Patan Durbar Square", area: "Mangal Bazaar", lat: 27.6727, lng: 85.3255, type: "heritage" },
  { id: "lm-9", name: "Boudha Stupa Ring Road", area: "Boudhanath", lat: 27.7215, lng: 85.3620, type: "heritage" },
  { id: "lm-10", name: "Baluwatar (PM Residence)", area: "Baluwatar", lat: 27.7289, lng: 85.3298, type: "residential" },
  { id: "lm-11", name: "Maharajgunj / Teaching Hospital", area: "Ring Road North", lat: 27.7371, lng: 85.3315, type: "transit" },
  { id: "lm-12", name: "New Road / Bishal Bazaar", area: "Old City Center", lat: 27.7032, lng: 85.3117, type: "commercial" },
  { id: "lm-13", name: "Maitighar Mandala", area: "Maitighar", lat: 27.6942, lng: 85.3211, type: "transit" },
  { id: "lm-14", name: "Koteshwor Chowk", area: "East Gateway", lat: 27.6775, lng: 85.3496, type: "transit" },
  { id: "lm-15", name: "Chabahil Chowk / KL Tower", area: "Chabahil", lat: 27.7172, lng: 85.3468, type: "commercial" },
  { id: "lm-16", name: "Tripureshwor / Dasharath Stadium", area: "Tripureshwor", lat: 27.6958, lng: 85.3148, type: "commercial" },
  { id: "lm-17", name: "Kalanki Chowk", area: "West Gateway", lat: 27.6938, lng: 85.2818, type: "transit" },
  { id: "lm-18", name: "Sinamangal / TIA Airport Gate", area: "Sinamangal", lat: 27.6961, lng: 85.3572, type: "transit" },
];

interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onSaveAddress: (newAddress: string, location?: { lat: number; lng: number; landmark?: string }) => void;
}

export const DeliveryLocationModal: React.FC<DeliveryLocationModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Active pin coordinates (default: Kathmandu Durbar Marg hub)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 27.7125,
    lng: 85.3175,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [streetAddress, setStreetAddress] = useState(currentAddress || "House #14, Lazimpat, Kathmandu");
  const [landmarkNote, setLandmarkNote] = useState("Near Standard Chartered Bank");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Sync streetAddress when opening modal with prop
  useEffect(() => {
    if (isOpen && currentAddress) {
      setStreetAddress(currentAddress);
    }
  }, [isOpen, currentAddress]);

  // Filter landmarks based on search query
  const filteredLandmarks = KATHMANDU_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create custom vector HTML divIcon for pin
  const createPinIcon = () => {
    return L.divIcon({
      className: "crunchy-custom-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <div style="background-color: #F59E0B; color: #000; font-weight: 900; font-size: 11px; padding: 3px 6px; border: 2px solid #000; display: flex; align-items: center; gap: 4px; box-shadow: 2px 2px 0px #000; white-space: nowrap;">
            <span>DELIVER HERE</span>
          </div>
          <div style="width: 14px; height: 14px; background: #000; border: 2px solid #F59E0B; transform: rotate(45deg); margin-top: -7px;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; margin-top: -4px;"></div>
        </div>
      `,
      iconSize: [110, 48],
      iconAnchor: [55, 48],
    });
  };

  // Initialize or re-invalidate Leaflet map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if needed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [selectedCoords.lat, selectedCoords.lng],
        zoom: 15,
        zoomControl: false,
      });

      // Add zoom control in top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap Tiles (the exact source used by Pathao/Yango in Nepal)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add draggable pin marker
      const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e) => {
        const markerPos = e.target.getLatLng();
        setSelectedCoords({ lat: markerPos.lat, lng: markerPos.lng });
        reverseApproximateLandmark(markerPos.lat, markerPos.lng);
      });

      // Click anywhere on map to reposition pin
      map.on("click", (e) => {
        const clickedLatLng = e.latlng;
        marker.setLatLng(clickedLatLng);
        setSelectedCoords({ lat: clickedLatLng.lat, lng: clickedLatLng.lng });
        reverseApproximateLandmark(clickedLatLng.lat, clickedLatLng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force layout re-calculation for Leaflet canvas inside modal
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Approximate closest landmark name from coordinates
  const reverseApproximateLandmark = (lat: number, lng: number) => {
    let closest = KATHMANDU_LANDMARKS[0];
    let minDistance = Infinity;

    KATHMANDU_LANDMARKS.forEach((lm) => {
      const dist = Math.hypot(lm.lat - lat, lm.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = lm;
      }
    });

    setLandmarkNote(`Near ${closest.name} (${closest.area})`);
    if (!streetAddress || streetAddress.includes("Kathmandu")) {
      setStreetAddress(`${closest.name}, ${closest.area}, Kathmandu`);
    }
  };

  // Pan map and place pin on landmark selection
  const handleSelectLandmark = (lm: LandmarkItem) => {
    setSelectedCoords({ lat: lm.lat, lng: lm.lng });
    setLandmarkNote(`Near ${lm.name} (${lm.area})`);
    setStreetAddress(`${lm.name}, ${lm.area}, Kathmandu`);
    setSearchQuery("");

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lm.lat, lm.lng], 16, { animate: true });
      markerRef.current.setLatLng([lm.lat, lm.lng]);
    }
  };

  // Detect live GPS location
  const handleUseCurrentLocation = () => {
    setIsDetectingLocation(true);
    setGeoNotice(null);

    if (!navigator.geolocation) {
      setIsDetectingLocation(false);
      setGeoNotice("Geolocation is not supported by your browser. Please select on the map.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false);
        const { latitude, longitude } = position.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });
        reverseApproximateLandmark(latitude, longitude);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          markerRef.current.setLatLng([latitude, longitude]);
        }
        setGeoNotice("Location detected! You can drag the pin to fine-tune your doorstep.");
      },
      (err) => {
        setIsDetectingLocation(false);
        // Fallback gracefully without breaking
        setGeoNotice("GPS permission denied or unavailable in sandbox. Defaulted to Kathmandu central hub.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    const fullAddress = landmarkNote
      ? `${streetAddress.trim()} (${landmarkNote.trim()})`
      : streetAddress.trim();

    onSaveAddress(fullAddress, {
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      landmark: landmarkNote,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Delivery Location"
      description="Pin your exact location on the map or search landmarks (Pathao & Yango ready)"
      maxWidth="xl"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="flex flex-col h-[82vh] max-h-[640px]">
        {/* Top Control Bar: Search & Quick GPS */}
        <div className="p-3 bg-zinc-50 dark:bg-[#141416] border-b border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmark, area or junction (e.g. Durbar Marg, Baneshwor, Thamel)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* GPS Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs border border-black dark:border-zinc-700 whitespace-nowrap cursor-pointer shrink-0"
              title="Detect current GPS location"
            >
              <Crosshair className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Current Location</span>
              <span className="sm:hidden">GPS</span>
            </button>
          </div>

          {/* Autocomplete Dropdown if typing in search */}
          {searchQuery.trim() !== "" && (
            <div className="max-h-40 overflow-y-auto bg-white dark:bg-[#1E1E22] border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-lg">
              {filteredLandmarks.length === 0 ? (
                <div className="p-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  No landmark matches found. Drag or click on the map to place pin manually.
                </div>
              ) : (
                filteredLandmarks.map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => handleSelectLandmark(lm)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-amber-500/10 text-xs text-zinc-900 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold">{lm.name}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1.5">
                          ({lm.area})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold">
                      Select
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Quick Kathmandu Zone Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 shrink-0 flex items-center gap-1">
              <Compass className="h-3 w-3" /> Quick Hubs:
            </span>
            {["Durbar Marg", "Lazimpat", "Thamel", "Baneshwor", "Jhamsikhel", "Pulchowk", "Boudha"].map((name) => {
              const matched = KATHMANDU_LANDMARKS.find((l) => l.name.includes(name));
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => matched && handleSelectLandmark(matched)}
                  className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-[#18181B] hover:bg-amber-500/20 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {name}
                </button>
              );
            })}
          </div>

          {geoNotice && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{geoNotice}</span>
            </div>
          )}
        </div>

        {/* Middle: Interactive Leaflet Map Canvas */}
        <div className="flex-1 relative min-h-[220px] bg-zinc-200 dark:bg-zinc-800">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Instruction overlay pill */}
          <div className="absolute top-2 left-2 z-[400] bg-black/85 text-white px-2.5 py-1 text-[11px] font-medium border border-white/20 flex items-center gap-1.5 backdrop-blur-xs">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span>Click or drag pin to your exact delivery location</span>
          </div>

          {/* GPS Coordinates readout */}
          <div className="absolute bottom-2 right-2 z-[400] bg-black/85 text-white px-2 py-0.5 text-[10px] font-mono border border-white/20">
            {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
          </div>
        </div>

        {/* Bottom Form: Address & Landmark Confirmation */}
        <div className="p-3.5 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                House / Street / Tole Address
              </label>
              <div className="relative">
                <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. House #14, Lane 2, Lazimpat"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Nearest Landmark (For Rider / Pathao)
              </label>
              <div className="relative">
                <Navigation className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                <input
                  type="text"
                  value={landmarkNote}
                  onChange={(e) => setLandmarkNote(e.target.value)}
                  placeholder="e.g. Opposite Standard Chartered Bank, beside Red Gate"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Rider will navigate to this exact coordinate</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                className="text-xs font-bold rounded-none flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black border border-black"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Confirm Delivery Spot</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
