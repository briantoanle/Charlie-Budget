"use client";

import { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { getUpcomingHolidays, type Holiday } from "@/lib/holidays";

interface HolidayBannerProps {
  /** User's country code ('US' or 'CA'). Defaults to 'US'. */
  country?: string;
}

export function HolidayBanner({ country = "US" }: HolidayBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const key = `charlie-holiday-dismissed-${new Date().toISOString().slice(0, 10)}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const key = `charlie-holiday-dismissed-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  const upcoming = getUpcomingHolidays(country, 30);
  if (upcoming.length === 0) return null;

  const holiday: Holiday & { daysUntil: number } = upcoming[0];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-positive/20 bg-positive/5 px-4 py-3">
      <Calendar className="h-4 w-4 shrink-0 text-positive" />
      <p className="flex-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{holiday.name}</span>
        {" "}is in{" "}
        <span className="font-medium text-foreground">
          {holiday.daysUntil} day{holiday.daysUntil !== 1 ? "s" : ""}
        </span>
        {holiday.categories.length > 0 && (
          <>
            {" — expect higher spending on "}
            <span className="font-medium text-foreground">
              {holiday.categories.slice(0, 3).join(", ")}
            </span>
          </>
        )}
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
