import { getBaseAppLink } from "@/lib/private-links";
import { Button, ButtonProps } from "./ui/button";
import Link from "next/link";
import { memo } from "react";
import { Icons } from "./icons";

export const GetStartedButton = memo(function GetStartedButton({
  className,
  text,
  size,
  variant,
}: {
  className?: string;
  text: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  return (
    <Link href={getBaseAppLink()}>
      <Button className={className} size={size} variant={variant}>
        <Icons.wandSparkles className="h-4 w-4 mr-2" />
        {text}
      </Button>
    </Link>
  );
});
