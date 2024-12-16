"use client";

import { useFormContext } from "react-hook-form";
import { memo } from "react";
import { QuizFormType } from "./quiz-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import { Textarea } from "@/web/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { FileInput } from "@/components/ui/fileinput";

export const QuizBasicInfoSection = memo(function QuizBasicInfoSection() {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name.label")}</FormLabel>
            <FormControl>
              <Input placeholder={t("quizName.placeholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("description.label")}</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter your description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="maxNumberOfProducts"
        render={({ field }) => (
          <FormItem className="max-w-[100px]">
            <FormLabel>{t("maxNumberOfProducts.label")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("maxNumberOfProducts.placeholder")}
                {...field}
                type="number"
                onChange={(event) => {
                  const value = event.target.value;
                  const parsedValue = value === "" ? null : Number(value);
                  if (typeof parsedValue === "number") {
                    field.onChange(parsedValue);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="gatherEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gatherEmail.label")} </FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="backgroundImage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("backgroundImage.label")}</FormLabel>
            <FormControl>
              <FileInput
                placeholder={t("backgroundImage.placeholder")}
                {...field}
                currentImageUrl={field.value ?? ""}
                onFileSelect={(file, base64) => {
                  field.onChange(base64);
                  form.setValue("actualImage", file);
                }}
              >
                <Input
                  placeholder={t("backgroundImage.placeholder")}
                  {...field}
                  value={!form.watch("actualImage") ? (field.value ?? "") : ""}
                  onChange={(e) => {
                    form.setValue("actualImage", null);
                    field.onChange(e.target.value);
                  }}
                />
              </FileInput>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
});
