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

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestLandmark(
  lat: number,
  lng: number
): { landmark: LandmarkItem; distanceKm: number } | null {
  if (!KATHMANDU_LANDMARKS.length) return null;
  let nearest = KATHMANDU_LANDMARKS[0];
  let minDistance = calculateDistanceKm(lat, lng, nearest.lat, nearest.lng);
  for (let i = 1; i < KATHMANDU_LANDMARKS.length; i++) {
    const d = calculateDistanceKm(lat, lng, KATHMANDU_LANDMARKS[i].lat, KATHMANDU_LANDMARKS[i].lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = KATHMANDU_LANDMARKS[i];
    }
  }
  return { landmark: nearest, distanceKm: minDistance };
}

export interface ResolvedAddressResult {
  address: string;
  landmark?: string;
}

/**
 * Returns an immediate human-readable address from coordinates using nearby landmarks.
 * Guarantees zero latency and offline availability.
 */
export function getLocalLocationAddress(lat: number, lng: number): ResolvedAddressResult {
  const nearest = findNearestLandmark(lat, lng);
  if (nearest) {
    if (nearest.distanceKm <= 0.4) {
      return {
        address: `${nearest.landmark.name}, ${nearest.landmark.area}`,
        landmark: nearest.landmark.name,
      };
    }
    if (nearest.distanceKm <= 3.5) {
      return {
        address: `Near ${nearest.landmark.name}, ${nearest.landmark.area}`,
        landmark: nearest.landmark.name,
      };
    }
    if (nearest.distanceKm <= 10.0) {
      return {
        address: `${nearest.landmark.area}, Kathmandu Valley`,
        landmark: nearest.landmark.name,
      };
    }
  }

  return {
    address: `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    landmark: undefined,
  };
}

/**
 * Attempts reverse geocoding via OpenStreetMap Nominatim with a short timeout.
 */
export async function reverseGeocodeOsm(
  lat: number,
  lng: number,
  timeoutMs = 2500
): Promise<ResolvedAddressResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;

    const addr = data.address || {};
    const road = addr.road || addr.pedestrian || addr.footway || addr.street;
    const neighborhood =
      addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.city_district;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;

    const parts = [road, neighborhood, city].filter(Boolean);
    if (parts.length > 0) {
      return {
        address: parts.join(", "),
        landmark: data.name && data.name !== road ? data.name : road || undefined,
      };
    }

    if (data.display_name) {
      const displayParts = data.display_name
        .split(",")
        .map((s: string) => s.trim())
        .slice(0, 3)
        .join(", ");
      return {
        address: displayParts,
        landmark: data.name || undefined,
      };
    }
  } catch {
    // Fail silently on timeout/network error
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Returns instant local address result and optionally invokes callback if OSM returns a better result.
 */
export function resolveLocationAddress(
  lat: number,
  lng: number,
  onRefined?: (result: ResolvedAddressResult) => void
): ResolvedAddressResult {
  const local = getLocalLocationAddress(lat, lng);

  if (onRefined && typeof window !== "undefined" && typeof fetch === "function") {
    reverseGeocodeOsm(lat, lng).then((better) => {
      if (better && better.address && better.address !== local.address) {
        onRefined(better);
      }
    });
  }

  return local;
}
