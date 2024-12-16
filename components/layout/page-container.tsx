import React from "react";
import { ScrollArea } from "@/web/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function PageContainer({
  children,
  scrollable = true,
  stretch = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  stretch?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-52px)]">
          <div className={cn("h-full p-2 md:px-6", stretch && "h-full")}>
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className={cn("h-full p-2 md:px-6", stretch && "h-full")}>
          {children}
        </div>
      )}
    </>
  );
}
