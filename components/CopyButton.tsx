import { memo, useState } from "react";
import { Icons } from "./icons";
import { Button, ButtonProps } from "./ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export const CopyButton = memo(function CopyButton({
  value,
  ...rest
}: {
  value: string | null | undefined;
} & ButtonProps) {
  const t = useTranslations("copyButton");
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success(t("copied"));
  };

  return (
    <Button
      disabled={!value}
      {...rest}
      onClick={handleCopy}
      type="button"
      title={value ? t("copy") : t("copyDisabled")}
    >
      <Icons.copy className="h-4 w-4" />
      <span className="sr-only">{isCopied ? t("copied") : t("copy")}</span>
    </Button>
  );
});
