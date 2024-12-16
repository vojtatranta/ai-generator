import { cn } from "@/web/lib/utils";
import { memo, ReactNode } from "react";
import { toast } from "sonner";

type CopyableTextProps = (
  | {
      children: string | null;
    }
  | {
      copyValue: string;
      children: ReactNode;
    }
) & {
  className?: string;
};

export const CopyableText = memo(function CopyableText(
  props: CopyableTextProps,
) {
  const handleCopyRequest = async () => {
    try {
      await navigator.clipboard.writeText(
        ("copyValue" in props && props.copyValue) || String(props.children),
      );
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className={cn(
        "cursor-pointer hover:bg-primary/10 px-1 rounded-md",
        props.className,
      )}
      onClick={handleCopyRequest}
    >
      {props.children}
    </div>
  );
});
