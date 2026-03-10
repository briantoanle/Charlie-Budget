"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

type DateRangePreset = {
  label: string;
  getRange: () => DateRangeValue;
};

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  placeholder?: string;
  closeOnSelect?: boolean;
  presets?: DateRangePreset[];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toCalendarDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function parseDateString(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return toCalendarDate(next);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function endOfWeek(date: Date) {
  return addDays(date, 6 - date.getDay());
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const time = date.getTime();
  return time > start.getTime() && time < end.getTime();
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function normalizeRange(range: DateRangeValue) {
  const start = parseDateString(range.startDate);
  const end = parseDateString(range.endDate);

  if (!start || !end) return range;
  if (start.getTime() <= end.getTime()) return range;

  return {
    startDate: formatDateString(end),
    endDate: formatDateString(start),
  };
}

function isSameRange(a: DateRangeValue, b: DateRangeValue) {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

function defaultPresets(): DateRangePreset[] {
  return [
    {
      label: "Last 7 Days",
      getRange: () => {
        const today = toCalendarDate(new Date());
        return {
          startDate: formatDateString(addDays(today, -6)),
          endDate: formatDateString(today),
        };
      },
    },
    {
      label: "Last 30 Days",
      getRange: () => {
        const today = toCalendarDate(new Date());
        return {
          startDate: formatDateString(addDays(today, -29)),
          endDate: formatDateString(today),
        };
      },
    },
    {
      label: "This Month",
      getRange: () => {
        const today = toCalendarDate(new Date());
        return {
          startDate: formatDateString(new Date(today.getFullYear(), today.getMonth(), 1, 12)),
          endDate: formatDateString(today),
        };
      },
    },
    {
      label: "Year to Date",
      getRange: () => {
        const today = toCalendarDate(new Date());
        return {
          startDate: formatDateString(new Date(today.getFullYear(), 0, 1, 12)),
          endDate: formatDateString(today),
        };
      },
    },
  ];
}

function buildCalendarWeeks(month: Date) {
  const firstVisibleDay = startOfWeek(startOfMonth(month));
  const lastVisibleDay = endOfWeek(endOfMonth(month));
  const weeks: Date[][] = [];

  let cursor = firstVisibleDay;
  while (cursor.getTime() <= lastVisibleDay.getTime()) {
    const week: Date[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getRangeLabel(value: DateRangeValue, placeholder: string) {
  const start = parseDateString(value.startDate);
  const end = parseDateString(value.endDate);

  if (start && end) {
    return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
  }

  if (start) {
    return `${formatDisplayDate(start)} - Select end date`;
  }

  return placeholder;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
  closeOnSelect = true,
  presets = defaultPresets(),
}: DateRangePickerProps) {
  const isMobile = useIsMobile();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const dayRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRangeValue>(value);
  const [visibleMonth, setVisibleMonth] = React.useState(() => {
    const start = parseDateString(value.startDate);
    const end = parseDateString(value.endDate);
    return startOfMonth(start ?? end ?? new Date());
  });
  const [desktopPosition, setDesktopPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const start = parseDateString(draft.startDate);
  const end = parseDateString(draft.endDate);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      if (!isSameRange(draft, value)) {
        setDraft(value);
      }

      const nextAnchor = startOfMonth(
        parseDateString(value.startDate) ??
          parseDateString(value.endDate) ??
          new Date(),
      );

      if (!isSameMonth(visibleMonth, nextAnchor)) {
        setVisibleMonth(nextAnchor);
      }
    }
  }, [draft, open, value, visibleMonth]);

  React.useEffect(() => {
    if (!open || isMobile) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDesktopPosition({
        top: rect.bottom + 12,
        left: Math.max(16, rect.left),
        width: rect.width,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);

      if (!clickedTrigger && !clickedPanel) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    updatePosition();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isMobile, open]);

  const syncAndClose = React.useCallback(
    (next: DateRangeValue) => {
      const normalized = normalizeRange(next);
      setDraft(normalized);
      onChange(normalized);
      setOpen(false);
    },
    [onChange],
  );

  const updateDraft = React.useCallback((next: DateRangeValue) => {
    const normalized = normalizeRange(next);
    setDraft(normalized);
  }, []);

  const selectDate = React.useCallback(
    (date: Date) => {
      const isoDate = formatDateString(date);

      if (!start || (start && end)) {
        updateDraft({ startDate: isoDate, endDate: "" });
        return;
      }

      const next =
        date.getTime() < start.getTime()
          ? { startDate: isoDate, endDate: formatDateString(start) }
          : { startDate: draft.startDate, endDate: isoDate };

      if (isMobile || !closeOnSelect) {
        updateDraft(next);
        return;
      }

      syncAndClose(next);
    },
    [closeOnSelect, draft.startDate, end, isMobile, start, syncAndClose, updateDraft],
  );

  const applyPreset = React.useCallback(
    (preset: DateRangePreset) => {
      const next = normalizeRange(preset.getRange());
      setVisibleMonth(startOfMonth(parseDateString(next.startDate) ?? new Date()));

      if (isMobile) {
        setDraft(next);
        return;
      }

      syncAndClose(next);
    },
    [isMobile, syncAndClose],
  );

  const clearSelection = React.useCallback(() => {
    const empty = { startDate: "", endDate: "" };

    if (isMobile) {
      setDraft(empty);
      return;
    }

    syncAndClose(empty);
  }, [isMobile, syncAndClose]);

  const handleApply = React.useCallback(() => {
    syncAndClose(draft);
  }, [draft, syncAndClose]);

  const moveFocus = React.useCallback((date: Date) => {
    const next = formatDateString(date);
    requestAnimationFrame(() => {
      dayRefs.current[next]?.focus();
    });
  }, []);

  const handleDayKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, date: Date) => {
      const key = event.key;
      if (
        key !== "ArrowLeft" &&
        key !== "ArrowRight" &&
        key !== "ArrowUp" &&
        key !== "ArrowDown" &&
        key !== "Home" &&
        key !== "End" &&
        key !== "PageUp" &&
        key !== "PageDown"
      ) {
        return;
      }

      event.preventDefault();

      if (key === "ArrowLeft") moveFocus(addDays(date, -1));
      if (key === "ArrowRight") moveFocus(addDays(date, 1));
      if (key === "ArrowUp") moveFocus(addDays(date, -7));
      if (key === "ArrowDown") moveFocus(addDays(date, 7));
      if (key === "Home") moveFocus(addDays(date, -date.getDay()));
      if (key === "End") moveFocus(addDays(date, 6 - date.getDay()));
      if (key === "PageUp") {
        const previousMonthDate = new Date(
          date.getFullYear(),
          date.getMonth() - 1,
          Math.min(date.getDate(), endOfMonth(addMonths(date, -1)).getDate()),
          12,
        );
        setVisibleMonth(startOfMonth(previousMonthDate));
        moveFocus(previousMonthDate);
      }
      if (key === "PageDown") {
        const nextMonthDate = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          Math.min(date.getDate(), endOfMonth(addMonths(date, 1)).getDate()),
          12,
        );
        setVisibleMonth(startOfMonth(nextMonthDate));
        moveFocus(nextMonthDate);
      }
    },
    [moveFocus],
  );

  const months = isMobile ? [visibleMonth] : [visibleMonth, addMonths(visibleMonth, 1)];
  const hasValue = !!value.startDate || !!value.endDate;

  const fromLabel = value.startDate
    ? formatDisplayDate(parseDateString(value.startDate) ?? new Date())
    : "Start date";
  const toLabel = value.endDate
    ? formatDisplayDate(parseDateString(value.endDate) ?? new Date())
    : "End date";

  const content = (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--card)/0.94)_100%)] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_38%)] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
              Range
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {getRangeLabel(draft, placeholder)}
            </p>
          </div>
          {(draft.startDate || draft.endDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
              onClick={clearSelection}
            >
              <RotateCcw className="size-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:flex-row sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:w-44 sm:flex-col sm:overflow-visible">
          {presets.map((preset) => {
            const presetValue = normalizeRange(preset.getRange());
            const active =
              presetValue.startDate === draft.startDate &&
              presetValue.endDate === draft.endDate;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex min-w-fit items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                  "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] focus-visible:outline-none",
                  active
                    ? "border-primary/40 bg-primary/8 text-foreground shadow-sm"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:border-primary/25 hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <span>{preset.label}</span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-2">
          {months.map((month) => {
            const weeks = buildCalendarWeeks(month);

            return (
              <div
                key={month.toISOString()}
                className="rounded-[1.5rem] border border-border/60 bg-secondary/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label={`Show ${formatMonthLabel(addMonths(month, -1))}`}
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition hover:text-foreground",
                      !isSameMonth(months[0], month) && "invisible",
                    )}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="text-sm font-semibold text-foreground">
                    {formatMonthLabel(month)}
                  </div>
                  <button
                    type="button"
                    aria-label={`Show ${formatMonthLabel(addMonths(month, 1))}`}
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition hover:text-foreground",
                      !isSameMonth(months[months.length - 1], month) && "invisible",
                    )}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1 px-1">
                  {WEEKDAY_LABELS.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid gap-1" role="grid" aria-label={formatMonthLabel(month)}>
                  {weeks.map((week, weekIndex) => (
                    <div key={`${month.toISOString()}-${weekIndex}`} className="grid grid-cols-7 gap-1" role="row">
                      {week.map((day) => {
                        const iso = formatDateString(day);
                        const inCurrentMonth = day.getMonth() === month.getMonth();
                        const isStart = isSameDay(day, start);
                        const isEnd = isSameDay(day, end);
                        const inRange = isBetween(day, start, end);
                        const isToday = isSameDay(day, toCalendarDate(new Date()));

                        return (
                          <button
                            key={iso}
                            ref={(node) => {
                              dayRefs.current[iso] = node;
                            }}
                            type="button"
                            role="gridcell"
                            aria-label={formatDisplayDate(day)}
                            aria-pressed={isStart || isEnd}
                            onClick={() => selectDate(day)}
                            onKeyDown={(event) => handleDayKeyDown(event, day)}
                            className={cn(
                              "relative h-11 rounded-xl text-sm font-medium transition-all outline-none",
                              "focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                              !inCurrentMonth && "text-muted-foreground/45",
                              inCurrentMonth && "text-foreground",
                              inRange &&
                                "rounded-none bg-primary/[0.10] text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]",
                              (isStart || isEnd) &&
                                "bg-primary text-primary-foreground shadow-[0_14px_32px_-18px_hsl(var(--primary)/0.9)]",
                              isStart && "rounded-r-none",
                              isEnd && "rounded-l-none",
                              isStart && !end && "rounded-xl",
                              isEnd && !start && "rounded-xl",
                              isToday &&
                                !isStart &&
                                !isEnd &&
                                "border border-primary/30 bg-card text-foreground",
                              !inRange &&
                                !isStart &&
                                !isEnd &&
                                "hover:bg-card hover:shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)]",
                            )}
                          >
                            <span className="relative z-10">{day.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isMobile && (
        <SheetFooter className="border-t border-border/60 bg-card/95">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!draft.startDate || !draft.endDate}
            >
              Apply range
            </Button>
          </div>
        </SheetFooter>
      )}

      {!isMobile && (
        <div className="border-t border-border/60 bg-card/95 p-4">
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!draft.startDate || !draft.endDate}
            >
              Apply range
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={wrapperRef} className={cn("relative min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "group flex min-h-14 w-full min-w-[280px] items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 text-left shadow-[0_1px_0_rgba(255,255,255,0.4),0_14px_36px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-all sm:min-w-[340px]",
          "hover:border-primary/25 hover:bg-card focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] focus-visible:outline-none",
          open && "border-primary/35 shadow-[0_0_0_1px_hsl(var(--primary)/0.1),0_24px_60px_-36px_rgba(15,23,42,0.65)]",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:flex-nowrap">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
            <CalendarRange className="size-4.5" />
          </div>
          <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0 rounded-xl border border-border/60 bg-background/70 px-3 py-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                From
              </div>
              <div className="truncate whitespace-nowrap text-sm font-medium text-foreground">
                {fromLabel}
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-border/60 bg-background/70 px-3 py-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                To
              </div>
              <div className="truncate whitespace-nowrap text-sm font-medium text-foreground">
                {toLabel}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-border/60 bg-card/90 px-2 py-1 text-[11px] font-medium text-muted-foreground transition group-hover:text-foreground">
          {hasValue ? "Edit" : "Select"}
        </div>
      </button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[92dvh] rounded-t-[2rem] border-x-0 border-b-0 p-0"
          >
            <SheetHeader className="border-b border-border/60 pb-4 pt-5">
              <SheetTitle>Choose range</SheetTitle>
              <SheetDescription>
                Select a start and end date, or use a quick preset.
              </SheetDescription>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            className="fixed z-[70] w-[min(calc(100vw-2rem),860px)]"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{
              top: desktopPosition.top,
              left: Math.min(
                desktopPosition.left,
                window.innerWidth - Math.min(window.innerWidth - 32, 860) - 16,
              ),
              minWidth: Math.max(desktopPosition.width, 320),
            }}
          >
            {content}
          </div>,
          document.body,
        )
      )}
    </div>
  );
}
