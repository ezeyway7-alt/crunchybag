import React, { useState } from "react";
import { Clock, Calendar, Percent, Plus, Check, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";

export const StaffTimePricing: React.FC = () => {
  const { timePricingSchedules, toggleTimePricing, currentOutlet, addToast } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("19:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: "Promotional Pricing Schedule Created",
      description: `Rule "${newTitle || "Happy Hour"}" scheduled for ${currentOutlet.name}.`,
      type: "success",
    });
    setIsCreateModalOpen(false);
    setNewTitle("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-800">
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Time-Window Dynamic Pricing ({currentOutlet.name})</span>
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automate afternoon rush discounts, late-night combos, and weekend surcharges without manual menu republishing.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          className="font-bold text-xs"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Schedule Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timePricingSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`p-5 rounded-3xl border transition-all ${
              schedule.isActive
                ? "bg-white dark:bg-[#121214] border-amber-500/40 shadow-lg ring-1 ring-amber-500/20"
                : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-extrabold text-base text-zinc-900 dark:text-white">
                  {schedule.title}
                </span>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {schedule.discountPercentage}% Discount Active
                </p>
              </div>
              <Badge variant={schedule.isActive ? "success" : "neutral"} size="sm" dot>
                {schedule.isActive ? "Active Rule" : "Paused"}
              </Badge>
            </div>

            {/* Time window & Days */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="font-mono font-semibold">
                  {schedule.startTime} – {schedule.endTime} (NPT Local)
                </span>
              </div>

              {/* Day Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {allDays.map((day) => {
                  const isScheduled = schedule.daysOfWeek.includes(day as any);
                  return (
                    <span
                      key={day}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        isScheduled
                          ? "bg-amber-500 text-black font-extrabold"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>

              {/* Targeted Products */}
              <div className="pt-2 text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Target Items: </span>
                <span>{schedule.productNames.join(", ")}</span>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button
                size="sm"
                variant={schedule.isActive ? "secondary" : "primary"}
                onClick={() => toggleTimePricing(schedule.id)}
              >
                {schedule.isActive ? "Pause Schedule" : "Activate Schedule"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Dynamic Time-Pricing Schedule"
        description="Configure automated time windows and discount percentages"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRule} className="space-y-4 py-2">
          <Input
            label="Schedule Title"
            placeholder="e.g. Kathmandu Afternoon Crunch"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Start Window (24h)"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Window (24h)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
            <Input
              label="Discount Percentage"
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              rightIcon={<Percent className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Select Operating Weekdays
            </label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-black"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
