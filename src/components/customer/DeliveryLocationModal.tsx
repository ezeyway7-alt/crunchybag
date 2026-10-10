import React, {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Modal} from '../common/Modal';
import {Button} from '../common/Button';
import {DeliveryPoint} from '../../lib/customerAddresses';
import {trackEvent} from '../../lib/journeyTracking';
import {
  KATHMANDU_LANDMARKS,
  LandmarkItem,
  resolveLocationAddress,
} from '../../lib/locationGeocode';

export { KATHMANDU_LANDMARKS, type LandmarkItem };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  currentLocation?: DeliveryPoint;
  onSaveAddress: (address: string, location?: DeliveryPoint) => void;
}
export function DeliveryLocationModal({isOpen, onClose, currentAddress, currentLocation, onSaveAddress}: Props) {
  const container = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), marker = useRef<L.Marker | null>(null);
  const [point, setPoint] = useState<DeliveryPoint | undefined>();
  const [street, setStreet] = useState(''), [landmark, setLandmark] = useState(''), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const requestId = useRef(0);
  const pin = (location: DeliveryPoint, zoom = false) => {
    setPoint(location);setError('');
    if (!map.current) return;
    const coords: L.LatLngExpression = [location.lat, location.lng];
    if (!marker.current) {
      marker.current = L.marker(coords, {draggable: true, icon: L.divIcon({className:'',html:'<span style="display:block;width:22px;height:22px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px #0008"></span>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(map.current);
      marker.current.on('dragend', () => {
        requestId.current++;setBusy(false);setAccuracy(null);
        const position = marker.current!.getLatLng();setPoint({lat:position.lat,lng:position.lng});
        trackEvent('map_pin_selected',{method:'drag'});
        setStreet(curr => {
          if (!curr.trim()) {
            const resolved = resolveLocationAddress(position.lat, position.lng, refined => {
              setStreet(c => (!c || c === resolved.address ? refined.address : c));
              if (refined.landmark) setLandmark(l => (!l || l === resolved.landmark ? refined.landmark! : l));
            });
            if (resolved.landmark) setLandmark(l => l || resolved.landmark!);
            return resolved.address;
          }
          return curr;
        });
      });
    } else marker.current.setLatLng(coords);
    if (zoom) map.current.setView(coords, 17);
  };
  useEffect(() => {
    if (!isOpen) return;
    trackEvent('map_opened');
    setStreet(currentAddress || '');setLandmark(currentLocation?.landmark || '');setSearch('');
    setPoint(currentLocation);setAccuracy(null);setError('');setBusy(false);
    const timer = setTimeout(() => {
      if (!container.current) return;
      // This is only a map viewport. It is never selected as the delivery location.
      const center: L.LatLngExpression = currentLocation ? [currentLocation.lat,currentLocation.lng] : [27.7172,85.3240];
      map.current = L.map(container.current, {center, zoom:currentLocation ? 17 : 12});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(map.current);
      map.current.on('click', (event:L.LeafletMouseEvent) => {
        requestId.current++;setBusy(false);setAccuracy(null);
        pin({lat:event.latlng.lat,lng:event.latlng.lng});
        trackEvent('map_pin_selected',{method:'map'});
        setStreet(curr => {
          if (!curr.trim()) {
            const resolved = resolveLocationAddress(event.latlng.lat, event.latlng.lng, refined => {
              setStreet(c => (!c || c === resolved.address ? refined.address : c));
              if (refined.landmark) setLandmark(l => (!l || l === resolved.landmark ? refined.landmark! : l));
            });
            if (resolved.landmark) setLandmark(l => l || resolved.landmark!);
            return resolved.address;
          }
          return curr;
        });
      });
      if (currentLocation) pin(currentLocation);
      map.current.invalidateSize();
    }, 200);
    return () => {requestId.current++;clearTimeout(timer);map.current?.remove();map.current=null;marker.current=null;};
  }, [isOpen]);
  const locate = () => {
    const id = ++requestId.current;
    setError('');setBusy(true);
    if (!navigator.geolocation) {setError('Location is unavailable. Choose a point on the map.');setBusy(false);trackEvent('delivery_location_error',{error_category:'location_unavailable'});return;}
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== requestId.current) return;
      setBusy(false);
      const {latitude,longitude,accuracy} = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {setError('Could not locate you. Choose a point on the map.');trackEvent('delivery_location_error',{error_category:'location_invalid'});return;}
      pin({lat:latitude,lng:longitude}, true);setAccuracy(accuracy);
      trackEvent('map_pin_selected',{method:'gps'});
      const resolved = resolveLocationAddress(latitude, longitude, refined => {
        setStreet(curr => (!curr || curr === resolved.address ? refined.address : curr));
        if (refined.landmark) setLandmark(curr => (!curr || curr === resolved.landmark ? refined.landmark! : curr));
      });
      setStreet(resolved.address);
      if (resolved.landmark) setLandmark(resolved.landmark);
    }, failure => {
      if (id !== requestId.current) return;
      setBusy(false);setError(failure.code === 1 ? 'Allow location access or choose a point on the map.' : 'Could not get your location. Try again or choose a point on the map.');
      trackEvent('delivery_location_error',{error_category:failure.code === 1 ? 'location_permission' : failure.code === 3 ? 'location_timeout' : 'location_unavailable'});
    }, {enableHighAccuracy:true,maximumAge:0,timeout:15000});
  };
  const matches = search.trim() ? KATHMANDU_LANDMARKS.filter(row => `${row.name} ${row.area}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <Modal isOpen={isOpen} onClose={onClose} title="Delivery location" maxWidth="xl" contentClassName="p-0">
    <div className="p-3 space-y-3">
      <div className="flex gap-2"><input aria-label="Search landmarks" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search landmarks" className="min-w-0 flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs" />
        <Button type="button" size="sm" onClick={locate} disabled={busy}>{busy ? 'Locating…' : 'Current location'}</Button></div>
      {search.trim() &&       <div className="max-h-28 overflow-auto text-xs">{matches.length ? matches.map(row=><button type="button" key={row.id} className="block w-full text-left p-2 hover:bg-zinc-800" onClick={()=>{requestId.current++;setBusy(false);pin({lat:row.lat,lng:row.lng},true);setStreet(`${row.name}, ${row.area}`);setLandmark(row.name);setSearch('');setAccuracy(null);trackEvent('map_pin_selected',{method:'landmark'});}}>{row.name}</button>) : <p className="text-zinc-400">No matching landmark. Select a point on the map.</p>}</div>}
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      <div ref={container} className="h-[min(40vh,320px)] min-h-48 bg-zinc-800" aria-label="Delivery map" />
      <div className="text-[11px] text-zinc-400" role="status">{point ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : 'Select a point on the map.'}{accuracy !== null && ` · Accuracy ±${Math.round(accuracy)} m`}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-[10px] font-medium text-zinc-400 space-y-1 block">House / Street / Tole Address<input aria-label="House / Street / Tole Address" value={street} onChange={e=>setStreet(e.target.value)} maxLength={800} className="block w-full px-2 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white" /></label>
        <label className="text-[10px] font-medium text-zinc-400 space-y-1 block">Nearest Landmark<input aria-label="Nearest Landmark" value={landmark} onChange={e=>setLandmark(e.target.value)} maxLength={150} placeholder="Optional" className="block w-full px-2 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white" /></label>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="button" size="sm" disabled={!point || !street.trim() || busy} onClick={()=>{onSaveAddress(street.trim(),{...point!,landmark:landmark.trim()});onClose();}}>Save location</Button></div>
    </div>
  </Modal>;
}
