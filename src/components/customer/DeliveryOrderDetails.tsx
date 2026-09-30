import React, { useState } from 'react';
import { Order } from '../../types';
import {
  MapPin,
  Navigation,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Bike,
  Smartphone,
  MessageSquare,
  Compass,
  Map,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export function deliveryStatus(order: Order): string {
  return (
    (order as any)._customerOrder?.status ||
    ({ AWAITING_PAYMENT: 'PENDING', CONFIRMED: 'ACCEPTED', PROCESSING: 'PREPARING' } as Record<string, string>)[order.status] ||
    order.status
  );
}

export function deliveryStatusLabel(order: Order): string {
  const delivery = order.fulfillmentType === 'DELIVERY';
  return (
    ({
      PENDING: 'Payment review',
      ACCEPTED: 'Confirmed',
      PREPARING: 'In kitchen',
      READY: delivery ? 'Ready for dispatch' : 'Ready for pickup',
      OUT_FOR_DELIVERY: 'Dispatched',
      COMPLETED: delivery ? 'Delivered' : 'Completed',
      CANCELLED: 'Cancelled',
    } as Record<string, string>)[deliveryStatus(order)] || order.status
  );
}

export function deliveryInfo(order: Order) {
  const raw = (order as any)._customerOrder;
  const saved = raw?.delivery_location || order.deliveryLocation;
  const valid = (value: unknown, max: number) =>
    (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
    Number.isFinite(Number(value)) &&
    Math.abs(Number(value)) <= max;

  let point =
    saved && valid(saved.lat, 90) && valid(saved.lng, 180)
      ? { lat: Number(saved.lat), lng: Number(saved.lng) }
      : undefined;

  // Extract embedded GPS coordinates from deliveryAddress if present
  const address = (order.deliveryAddress || '')
    .replace(/https:\/\/maps\.google\.com\/\?q=([^\s]+)/g, (link, query) => {
      let decoded: string;
      try {
        decoded = decodeURIComponent(query);
      } catch {
        return link;
      }
      const [lat, lng] = decoded.split(',');
      if (valid(lat, 90) && valid(lng, 180)) {
        point ||= { lat: Number(lat), lng: Number(lng) };
        return '';
      }
      return link;
    })
    .trim();

  // If no point yet, check if text has "27.7172, 85.3240" format
  if (!point && address) {
    const coordMatch = address.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
    if (coordMatch && valid(coordMatch[1], 90) && valid(coordMatch[2], 180)) {
      point = { lat: Number(coordMatch[1]), lng: Number(coordMatch[2]) };
    }
  }

  const destination = point ? `${point.lat},${point.lng}` : address;
  const mapUrl = destination
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
    : '';
  const directionsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : '';

  // Android & iOS native Geo URI with auto-location catch
  const geoUri = point
    ? `geo:${point.lat},${point.lng}?q=${encodeURIComponent(address || `${point.lat},${point.lng}`)}`
    : address
    ? `geo:0,0?q=${encodeURIComponent(address)}`
    : '';

  // Apple Maps URL
  const appleMapsUrl = destination ? `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}` : '';

  // Pathao deep link
  const pathaoUrl = point
    ? `pathao://ride?dest_lat=${point.lat}&dest_lng=${point.lng}&dest_address=${encodeURIComponent(address || 'Customer')}`
    : address
    ? `pathao://ride?dest_address=${encodeURIComponent(address)}`
    : 'pathao://';

  // Yango deep link
  const yangoUrl = point
    ? `yandextaxi://route?end-lat=${point.lat}&end-lon=${point.lng}&end-text=${encodeURIComponent(address || 'Customer')}`
    : address
    ? `yandextaxi://route?end-text=${encodeURIComponent(address)}`
    : 'yandextaxi://';

  // OpenStreetMap embed iframe
  const osmEmbedUrl = point
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(point.lng - 0.007).toFixed(6)}%2C${(point.lat - 0.004).toFixed(6)}%2C${(point.lng + 0.007).toFixed(6)}%2C${(point.lat + 0.004).toFixed(6)}&layer=mapnik&marker=${point.lat}%2C${point.lng}`
    : '';

  // Google Maps embed iframe fallback
  const googleEmbedUrl = destination
    ? `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : '';

  const landmark = saved?.landmark || '';

  const summaryLines = [
    `🛵 DELIVERY ORDER #${order.orderNumber}`,
    `Outlet: ${order.outletName}`,
    order.customerName && `Customer: ${order.customerName}`,
    order.customerPhone && `Phone: ${order.customerPhone}`,
    address && `Delivery address: ${address}`,
    landmark && !address.includes(landmark) && `Landmark: ${landmark}`,
    point && `Coordinates: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`,
    order.notes && `Notes: ${order.notes}`,
  ].filter(Boolean);

  const summary = summaryLines.join('\n');
  const text = [
    summary,
    `\n📍 Google Maps: ${directionsUrl || mapUrl}`,
    `📱 Pathao / Yango / InDrive destination ready`,
  ].join('\n');

  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  return {
    address,
    landmark,
    point,
    destination,
    mapUrl,
    directionsUrl,
    geoUri,
    appleMapsUrl,
    pathaoUrl,
    yangoUrl,
    osmEmbedUrl,
    googleEmbedUrl,
    whatsAppUrl,
    summary,
    text,
  };
}

// Deep link app launchers with smart fallback
export function openPathao(point?: { lat: number; lng: number }, address?: string) {
  if (!point && !address) return;
  const lat = point?.lat;
  const lng = point?.lng;
  const addr = encodeURIComponent(address || (lat && lng ? `${lat},${lng}` : ''));
  const deepLink =
    lat && lng
      ? `pathao://ride?dest_lat=${lat}&dest_lng=${lng}&dest_address=${addr}`
      : `pathao://ride?dest_address=${addr}`;

  const start = Date.now();
  window.location.href = deepLink;

  // Fallback to web / Google Maps directions if app doesn't open within 1.6s
  setTimeout(() => {
    if (Date.now() - start < 2200) {
      const fallback =
        lat && lng
          ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
          : `https://pathao.com/`;
      window.open(fallback, '_blank');
    }
  }, 1600);
}

export function openYango(point?: { lat: number; lng: number }, address?: string) {
  if (!point && !address) return;
  const lat = point?.lat;
  const lng = point?.lng;
  const addr = encodeURIComponent(address || (lat && lng ? `${lat},${lng}` : ''));
  const deepLink =
    lat && lng
      ? `yandextaxi://route?end-lat=${lat}&end-lon=${lng}&end-text=${addr}`
      : `yandextaxi://route?end-text=${addr}`;
  const universal =
    lat && lng
      ? `https://3.redirect.appmetrica.yandex.com/route?end-lat=${lat}&end-lon=${lng}&end-text=${addr}`
      : `https://yango.com/`;

  const start = Date.now();
  window.location.href = deepLink;

  setTimeout(() => {
    if (Date.now() - start < 2200) {
      window.open(universal, '_blank');
    }
  }, 1600);
}

export function openNativeGeo(point?: { lat: number; lng: number }, address?: string) {
  if (point) {
    const q = encodeURIComponent(address || `${point.lat},${point.lng}`);
    window.location.href = `geo:${point.lat},${point.lng}?q=${q}`;
  } else if (address) {
    window.location.href = `geo:0,0?q=${encodeURIComponent(address)}`;
  }
}

export function openGoogleMaps(point?: { lat: number; lng: number }, address?: string) {
  const dest = point ? `${point.lat},${point.lng}` : address || '';
  if (!dest) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
}

/**
 * Full Dispatch & Rider Share Modal
 * Supports Pathao, Yango, Google Maps, Apple Maps, Device Geo Intent, WhatsApp & Clipboard.
 */
export const DeliveryDispatchModal: React.FC<{
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!order || !isOpen) return null;

  const info = deliveryInfo(order);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(info.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyCoords = async () => {
    if (!info.point) return;
    try {
      await navigator.clipboard.writeText(`${info.point.lat.toFixed(6)}, ${info.point.lng.toFixed(6)}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Delivery #${order.orderNumber} - ${order.customerName || 'Customer'}`,
          text: info.summary,
          ...(info.directionsUrl ? { url: info.directionsUrl } : {}),
        });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          await handleCopyText();
        }
      }
    } else {
      await handleCopyText();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 text-black flex items-center justify-center font-black rounded-xs">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">
              Dispatch & Location • Order #{order.orderNumber}
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal">
              Open destination in ride apps or send location to rider
            </p>
          </div>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Recipient Card */}
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                Delivery Destination
              </span>
              <p className="text-xs font-bold text-white whitespace-pre-line break-words">
                {info.address || 'No street address provided.'}
              </p>
              {info.landmark && (
                <p className="text-[11px] text-zinc-400">
                  <span className="text-zinc-500">Landmark:</span> {info.landmark}
                </p>
              )}
            </div>

            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xs transition-colors shrink-0"
                title="Call recipient"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* GPS Coordinates Chip */}
          {info.point && (
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px]">
              <span className="font-mono text-zinc-400">
                GPS: {info.point.lat.toFixed(6)}, {info.point.lng.toFixed(6)}
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCoords ? 'GPS Copied!' : 'Copy GPS'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Embedded Map Location Preview */}
        {(info.osmEmbedUrl || info.googleEmbedUrl) && (
          <div className="relative rounded-xs overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="h-44 w-full bg-zinc-900">
              <iframe
                title={`Map for Order ${order.orderNumber}`}
                src={info.osmEmbedUrl || info.googleEmbedUrl}
                width="100%"
                height="100%"
                className="w-full h-full border-0 filter contrast-[1.05]"
                loading="lazy"
              />
            </div>
            <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-500/40 rounded-xs flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>{info.point ? 'Auto GPS Pinpoint' : 'Address Search'}</span>
            </div>
          </div>
        )}

        {/* Launch In Ride / Navigation Apps */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Open in Navigation & Ride Apps (Auto-Catch Location)
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Pathao */}
            <button
              type="button"
              onClick={() => openPathao(info.point, info.address)}
              className="p-2.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-600/40 hover:border-rose-500 text-left rounded-xs transition-all cursor-pointer group flex flex-col justify-between h-16"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-rose-400 group-hover:text-rose-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Pathao App
                </span>
                <Bike className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-[10px] text-zinc-400">Launch ride to customer pin</span>
            </button>

            {/* 2. Yango */}
            <button
              type="button"
              onClick={() => openYango(info.point, info.address)}
              className="p-2.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 hover:border-amber-400 text-left rounded-xs transition-all cursor-pointer group flex flex-col justify-between h-16"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Yango App
                </span>
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] text-zinc-400">Launch ride or delivery courier</span>
            </button>

            {/* 3. Google Maps */}
            <button
              type="button"
              onClick={() => openGoogleMaps(info.point, info.address)}
              className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 hover:border-emerald-500 text-left rounded-xs transition-all cursor-pointer group flex flex-col justify-between h-16"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Google Maps
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-400">Turn-by-turn live navigation</span>
            </button>

            {/* 4. Native Device Map App (Geo URI) */}
            <button
              type="button"
              onClick={() => openNativeGeo(info.point, info.address)}
              className="p-2.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-600/40 hover:border-blue-500 text-left rounded-xs transition-all cursor-pointer group flex flex-col justify-between h-16"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-blue-400 group-hover:text-blue-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Device Map
                </span>
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] text-zinc-400">Android / iOS App Chooser</span>
            </button>
          </div>
        </div>

        {/* Messaging & Sharing Dispatch Actions */}
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Rider Dispatch & Sharing
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {/* Native Share button */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 rounded-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Location Sheet</span>
            </button>

            {/* WhatsApp dispatch */}
            <a
              href={info.whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 rounded-xs transition-colors cursor-pointer"
              title="Send full delivery slip & pin to rider via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Copy full details */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 rounded-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Slip!' : 'Copy Details'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const DeliveryOrderDetails: React.FC<{
  order: Order;
  compact?: boolean;
  adminOnly?: boolean;
}> = ({ order, compact = false, adminOnly = false }) => {
  const info = deliveryInfo(order);
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(!compact);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.text);
      setNotice('Delivery details copied to clipboard.');
      setManual(false);
      setTimeout(() => setNotice(''), 3000);
    } catch {
      setManual(true);
      setNotice('Select and copy the delivery details below.');
    }
  };

  const share = async () => {
    if (navigator.share) {
      setBusy(true);
      setNotice('');
      try {
        await navigator.share({
          title: `Delivery ${order.orderNumber}`,
          text: info.summary,
          ...(info.directionsUrl || info.mapUrl ? { url: info.directionsUrl || info.mapUrl } : {}),
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setIsDispatchModalOpen(true);
        }
      } finally {
        setBusy(false);
      }
    } else {
      setIsDispatchModalOpen(true);
    }
  };

  const actionClass = compact
    ? 'px-2 py-1 text-[11px] font-bold border border-zinc-300 dark:border-zinc-700 rounded-xs hover:border-amber-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1'
    : 'px-3 py-1.5 text-xs font-bold border border-zinc-700 hover:border-amber-400 bg-zinc-900 text-zinc-100 transition-colors flex items-center gap-1.5';

  return (
    <section
      aria-label="Delivery details"
      className={
        compact
          ? 'p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xs space-y-2.5 text-[11px] text-zinc-700 dark:text-zinc-300'
          : 'p-4 bg-amber-500/10 border-2 border-amber-500/40 space-y-3.5 text-xs rounded-xs'
      }
    >
      {/* Header & Map Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
            Delivery Destination & Map
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {(info.osmEmbedUrl || info.googleEmbedUrl) && (
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="text-[10px] font-mono text-zinc-400 hover:text-amber-400 inline-flex items-center gap-1 cursor-pointer px-1 py-0.5"
              title={showMap ? 'Hide map preview' : 'Show map preview'}
            >
              <Map className="w-3 h-3" />
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Recipient & Address Information */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={
              compact
                ? 'font-bold text-zinc-900 dark:text-zinc-100 text-xs'
                : 'font-extrabold text-zinc-900 dark:text-white text-sm'
            }
          >
            {order.customerName || 'Customer'}
          </p>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <Phone className="w-3 h-3" />
              <span>{order.customerPhone}</span>
            </a>
          )}
        </div>

        <p
          className={
            compact
              ? 'whitespace-pre-line break-words text-zinc-700 dark:text-zinc-300 text-[11px]'
              : 'whitespace-pre-line break-words text-zinc-200 text-xs'
          }
        >
          {info.address || 'No street address saved for this order.'}
        </p>

        {info.landmark && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            <span className="text-zinc-400 font-medium">Landmark:</span> {info.landmark}
          </p>
        )}

        {info.point && (
          <p className="text-zinc-400 font-mono text-[10px]">
            GPS: {info.point.lat.toFixed(6)}, {info.point.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Interactive Map Preview Box */}
      {showMap && (info.osmEmbedUrl || info.googleEmbedUrl) && (
        <div className="relative rounded-xs overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
          <div className={compact ? 'h-36 w-full bg-zinc-900' : 'h-48 w-full bg-zinc-900'}>
            <iframe
              title={`Map pin for ${order.orderNumber}`}
              src={info.osmEmbedUrl || info.googleEmbedUrl}
              width="100%"
              height="100%"
              className="w-full h-full border-0 filter contrast-[1.05]"
              loading="lazy"
            />
          </div>
          <div className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono text-amber-400 border border-amber-500/40 rounded-xs flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-500" />
            <span>{info.point ? 'Auto Location Pin' : 'Address Search'}</span>
          </div>
        </div>
      )}

      {/* Navigation & App Dispatch Bar — admin only */}
      {adminOnly && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {/* Share & Open App Chooser */}
          <button
            type="button"
            disabled={busy}
            onClick={() => void share()}
            aria-label="Share delivery details"
            className={
              compact
                ? 'px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50'
                : 'px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
            }
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Share / Dispatch</span>
          </button>

          {/* Google Maps Directions */}
          {info.directionsUrl && (
            <a
              href={info.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClass}
              title="Open turn-by-turn navigation in Google Maps"
            >
              <Navigation className="w-3 h-3 text-emerald-400" />
              <span>Maps</span>
            </a>
          )}

          {/* Pathao Deep Link */}
          <button
            type="button"
            onClick={() => openPathao(info.point, info.address)}
            className={actionClass}
            title="Open in Pathao app with auto destination"
          >
            <Bike className="w-3 h-3 text-rose-500" />
            <span>Pathao</span>
          </button>

          {/* Yango Deep Link */}
          <button
            type="button"
            onClick={() => openYango(info.point, info.address)}
            className={actionClass}
            title="Open in Yango app with auto destination"
          >
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Yango</span>
          </button>

          {/* Native Device Map (Geo URI) */}
          {info.geoUri && (
            <button
              type="button"
              onClick={() => openNativeGeo(info.point, info.address)}
              className={actionClass}
              title="Open in native mobile map app"
            >
              <Smartphone className="w-3 h-3 text-sky-400" />
              <span>Device</span>
            </button>
          )}

          {/* Copy Slip */}
          <button
            type="button"
            onClick={() => void copy()}
            aria-label="Copy delivery details"
            className={actionClass}
            title="Copy delivery details for rider"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>
      )}

      {notice && (
        <p role="status" className="text-amber-500 dark:text-amber-400 font-bold text-[11px] animate-pulse">
          {notice}
        </p>
      )}

      {manual && (
        <textarea
          aria-label="Delivery details to copy"
          readOnly
          value={info.text}
          onFocus={(event) => event.target.select()}
          rows={6}
          className="w-full bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 p-2 text-xs font-mono"
        />
      )}

      {/* Dispatch Modal */}
      <DeliveryDispatchModal
        order={order}
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
      />
    </section>
  );
};
