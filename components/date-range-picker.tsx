"use client";
import { Button } from "@/web/components/ui/button";
import { Calendar } from "@/web/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/web/components/ui/popover";
import { cn } from "@/web/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, addMonths, format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import LocaleProvider from "./providers/date-fns";
import { DateRange } from "react-day-picker";

export const DateRangePickerContext = React.createContext<{
  date: SureRange;
  setDate: (date: SureRange) => void;
}>({
  date: {
    from: new Date(),
    to: new Date(),
  },
  setDate: () => {},
});

export type SureRange = {
  from: Date;
  to: Date;
};

export const DateRangePickerProvider: React.FC<{
  initialValue?: SureRange;
  children: React.ReactNode;
}> = ({ children, initialValue }) => {
  const [date, setDate] = React.useState<SureRange>(
    initialValue ?? {
      from: addMonths(new Date(), -1),
      to: new Date(),
    },
  );

  return (
    <DateRangePickerContext.Provider value={{ date, setDate }}>
      {children}
    </DateRangePickerContext.Provider>
  );
};

export const useDateRangePicker = () => {
  const context = React.useContext(DateRangePickerContext);

  if (context === undefined) {
    throw new Error(
      "useDateRangePicker must be used within a DateRangePickerContext",
    );
  }

  return context;
};

export function CalendarDateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { date, setDate } = useDateRangePicker();
  const [localDate, setLocalDate] = React.useState<DateRange | undefined>(date);
  const t = useTranslations();
  const locale = useLocale();

  React.useEffect(() => {
    if (!localDate) {
      return;
    }

    const { from, to } = localDate;
    if (from && to) {
      setDate({
        from,
        to,
      });
    }
  }, [localDate, setDate]);

  return (
    <LocaleProvider localeString={locale}>
      {(locale) => (
        <div className={cn("grid gap-2", className)}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t("dateRangePicker.placeholder")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                locale={locale}
                defaultMonth={localDate?.from}
                selected={localDate}
                onSelect={setLocalDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </LocaleProvider>
  );
}
