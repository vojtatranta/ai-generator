"use client";

import { Button } from "../../../../../components/ui/button";
import { Icons } from "../../../../../components/icons";
import { useTranslations } from "next-intl";

export default function GoogleSignInButton({
  onClick,
}: {
  onClick: () => void;
}) {
  const t = useTranslations();
  return (
    <Button
      className="w-full"
      variant="outline"
      type="button"
      onClick={onClick}
    >
      <Icons.google className="mr-2 h-4 w-4" />
      {t("auth.continueWithGoogle")}
    </Button>
  );
}
