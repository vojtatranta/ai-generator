"use client";

import { useFormContext } from "react-hook-form";
import { QuizFormType } from "./quiz-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/web/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CopyableText } from "@/web/components/CopyableText";
import Link from "next/link";
import { If, Then } from "@/components/ui/condition";
import { Quiz } from "@/web/lib/supabase-server";
import { getDevAnswerLink, getProductionAnswerLink } from "@/lib/public-links";
import { memo, useCallback } from "react";

export const QuizFormHeader = memo(function QuizFormHeader({
  quiz,
}: {
  quiz?: Quiz;
}) {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  const shareLink = form.watch("published")
    ? getProductionAnswerLink(quiz?.uuid ?? "")
    : getDevAnswerLink(quiz?.uuid ?? "");

  const handlePublish = useCallback(
    (checked: boolean) => {
      form.setValue("published", checked);
    },
    [form],
  );

  return (
    <FormField
      control={form.control}
      name="published"
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between rounded-lg bg-primary border-primary p-4 text-primary-foreground",
            field.value && "bg-destructive border-destructive",
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base">{t("published.label")}</FormLabel>
            <If condition={Boolean(quiz)}>
              <Then>
                <div>
                  <If condition={Boolean(shareLink)}>
                    <Then>
                      {t("published.description")}
                      <div className="mt-2">
                        {t("published.shareLink")}
                        <CopyableText copyValue={shareLink}>
                          <Link href={shareLink}>{shareLink}</Link>
                        </CopyableText>
                      </div>
                    </Then>
                  </If>
                </div>
              </Then>
            </If>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={handlePublish} />
          </FormControl>
        </FormItem>
      )}
    />
  );
});
