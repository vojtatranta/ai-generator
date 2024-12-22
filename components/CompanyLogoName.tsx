import { CompanyInfo } from "@/constants/data";
import { memo } from "react";

export const CompanyLogoName = memo(function CompanyLogoName({
  iconClassName,
}: {
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <CompanyInfo.logo className={iconClassName} />
      <span className="text-xl font-bold">{CompanyInfo.name}</span>
    </div>
  );
});
