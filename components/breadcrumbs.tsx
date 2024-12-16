"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/web/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Slash } from "lucide-react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  const t = useTranslations("breadCrumbs");
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.title}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={item.link}>{item.title}</BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className="hidden md:block">
                <Slash />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage>
                {t(item.title.toLocaleLowerCase())}
              </BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
