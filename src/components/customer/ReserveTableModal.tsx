import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import {
  Utensils,
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface ReserveTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletName?: string;
  outletAddress?: string;
}

export const ReserveTableModal: React.FC<ReserveTableModalProps> = ({
  isOpen,
  onClose,
  outletName = "Durbar Marg Flagship",
  outletAddress = "Kings Way, Opposite Narayanhiti Palace, Kathmandu",
}) => {
  const { customerProfile } = useApp();

  const [name, setName] = useState(customerProfile.name || "Aayush Shrestha");
  const [phone, setPhone] = useState(customerProfile.phone || "+977 9841-882299");
  const [guests, setGuests] = useState<number>(2);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState<string>("19:00");
  const [seating, setSeating] = useState<string>("Indoor AC");
  const [notes, setNotes] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const id = "TBL-" + Math.floor(1000 + Math.random() * 9000);
    setBookingId(id);
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsConfirmed(false);
        onClose();
      }}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm sm:text-base">Reserve a Table</span>
        </div>
      }
      description={`Dine-in experience at ${outletName}`}
    >
      {isConfirmed ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
              Reservation Confirmed
            </span>
            <h4 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white pt-1">
              Table Reserved for {guests} {guests === 1 ? "Guest" : "Guests"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Booking Ref: <span className="font-mono font-bold text-amber-500">{bookingId}</span>
            </p>
          </div>

          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-left space-y-2 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Location:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{outletName}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Date & Time:</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {date} at {time}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Seating:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{seating}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Guest Name:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{name}</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
            We will hold your table for 15 minutes past your reservation time. An SMS confirmation has been sent to {phone}.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleReset}
              className="w-full sm:w-auto rounded-none text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black"
            >
              Done & Return
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReserve} className="space-y-4 pt-1">
          {/* Outlet Info Banner */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs">
            <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-zinc-900 dark:text-white truncate block">
                {outletName}
              </span>
              <span className="text-[11px] text-zinc-500 truncate block">
                {outletAddress}
              </span>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Date
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Time
              </label>
              <div className="relative flex items-center">
                <Clock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="12:00">12:00 PM (Lunch)</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="17:30">05:30 PM (Snacks)</option>
                  <option value="18:30">06:30 PM</option>
                  <option value="19:00">07:00 PM (Dinner)</option>
                  <option value="19:30">07:30 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Number of Guests & Seating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Party Size
              </label>
              <div className="relative flex items-center">
                <Users className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Seating Area
              </label>
              <select
                value={seating}
                onChange={(e) => setSeating(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Indoor AC">Indoor AC Dining</option>
                <option value="Balcony Patio">Balcony / Outdoor</option>
                <option value="High-Top Counter">High-Top Counter</option>
                <option value="Quiet Booth">Quiet Booth</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Your Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aayush Shrestha"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Contact Phone
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              Special Requests (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Anniversary, baby high-chair, quiet corner"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="rounded-none text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-xs"
            >
              Confirm Reservation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
