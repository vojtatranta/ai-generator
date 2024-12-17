"use client";
import { Input } from "@/web/components/ui/input";
import { useKBar } from "kbar";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslations } from "next-intl";

export default function SearchInput() {
  const t = useTranslations();
  const { query } = useKBar();
  return (
    <div className="w-full space-y-2">
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={query.toggle}
      >
        <Search className="mr-2 h-4 w-4" />
        {t("common.search")}
        <kbd className="pointer-events-none text-primary-foreground absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-primary px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    </div>
  );
}
