"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/web/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/web/components/ui/chart";
import { useSupabase } from "@/lib/supabase-client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useLocale, useTranslations } from "next-intl";
import { useDateRangePicker } from "@/components/date-range-picker";
import { addDays, subDays } from "date-fns";

export const description = "An interactive bar chart";

const getChartConfig = (t: (trans: string) => string) => ({
  answers: {
    label: t("answersLabel"),
    color: "hsl(var(--primary))",
  },
});

export function BarGraph({ userId }: { userId: string }) {
  const { date } = useDateRangePicker();
  const supabase = useSupabase();
  const t = useTranslations("overview.barChart");
  const locale = useLocale();

  const chartConfig = getChartConfig(t);

  const { data } = useQuery(
    supabase
      .from("answers")
      .select("created_at") // Fetch only the created_at column for optimization
      .eq("user", userId)
      .gte("created_at", addDays(date.from ?? new Date(), -1).toISOString())
      .lte("created_at", addDays(date.to ?? new Date(), 1).toISOString()),
  );

  const consolidatedData = React.useMemo(() => {
    return {
      answers:
        data?.reduce<Record<string, { date: string; answers: number }>>(
          (acc, answer) => {
            const key = new Date(answer.created_at).toISOString().slice(0, 10);
            acc[key] = acc[key] ?? {
              date: key,
              answers: 0,
            };
            acc[key].answers += 1;
            return acc;
          },
          {},
        ) ?? {},
    };
  }, [data]);

  const chartData = React.useMemo(() => {
    return Object.entries(consolidatedData["answers"] ?? {}).map(
      ([key, value]) => ({
        date: key,
        answers: value.answers,
      }),
    );
  }, [consolidatedData]);

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("answers");

  const total = React.useMemo(
    () => ({
      answers: Object.values(consolidatedData["answers"] ?? {}).reduce(
        (acc, value) => acc + value.answers,
        0,
      ),
    }),
    [consolidatedData],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <div className="flex">
          {["answers"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="answers"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
