"use client";

import { useFormContext } from "react-hook-form";
import { QuizFormType } from "./quiz-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import { Button } from "@/web/components/ui/button";
import { useTranslations } from "next-intl";
import Editor from "react-simple-wysiwyg";
import { Icons } from "@/web/components/icons";
import { v4 as uuidv4 } from "uuid";
import { ResultPageSlotsType } from "@/lib/contants";
import { GeneralOptionSelect } from "@/components/GeneralOptionSelect";
import { ProductCategoriesSelect } from "@/components/ProductCategoriesSelect";
import { ProductAttributesSelect } from "@/components/ProductAttributesSelect";
import { If, Then, Else } from "@/components/ui/condition";
import { memo, useCallback } from "react";

const DEFAULT_PRODUCT_COUNT = 4;

const ResultSlot = memo(function ResultSlot({
  slot,
  index,
  userId,
}: {
  slot: any;
  index: number;
  userId: string;
}) {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  const handleRemoveSlot = useCallback(() => {
    form.setValue(
      "resultPageSlots",
      form.watch("resultPageSlots").filter((v, i) => i !== index),
    );
  }, [form, index]);

  return (
    <div key={slot.id} className="space-y-4 border rounded-lg p-4">
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={form.control}
          name={`resultPageSlots.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resultPageSlots.typeTitle")}</FormLabel>
              <FormControl>
                <GeneralOptionSelect
                  defaultValue={ResultPageSlotsType.CATEGORY}
                  options={Object.values(ResultPageSlotsType).map((type) => ({
                    value: type,
                    label: t(`resultPageSlots.type.${type}`),
                  }))}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <If condition={slot.type === ResultPageSlotsType.CATEGORY}>
          <Then>
            <FormField
              control={form.control}
              name={`resultPageSlots.${index}.entityId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resultPageSlots.categoryIdLabel")}</FormLabel>
                  <FormControl>
                    <ProductCategoriesSelect
                      {...field}
                      userId={userId}
                      disabledIds={form
                        .watch("resultPageSlots")
                        .filter(
                          (slot) => slot.type === ResultPageSlotsType.CATEGORY,
                        )
                        .map((slot) => slot.entityId)}
                      onChange={(id: string) => {
                        form.setValue(`resultPageSlots.${index}.entityId`, id);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Then>
          <Else>
            <FormField
              control={form.control}
              name={`resultPageSlots.${index}.entityId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resultPageSlots.attributeIdLabel")}</FormLabel>
                  <FormControl>
                    <ProductAttributesSelect
                      {...field}
                      userId={userId}
                      disabledIds={form
                        .watch("resultPageSlots")
                        .filter(
                          (slot) =>
                            slot.type === ResultPageSlotsType.ATTRIBUTES,
                        )
                        .map((slot) => slot.entityId)}
                      onChange={(id: string) => {
                        form.setValue(`resultPageSlots.${index}.entityId`, id);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Else>
        </If>
        <FormField
          control={form.control}
          name={`resultPageSlots.${index}.productCount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resultPageSlots.productCount")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={Number(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name={`resultPageSlots.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("resultPageSlots.description")}</FormLabel>
            <FormControl>
              <Editor
                {...field}
                className="min-h-[140px]"
                value={slot.description ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="button" variant="destructive" onClick={handleRemoveSlot}>
        {t("resultPageSlots.removeButton")}
      </Button>
    </div>
  );
});

export const QuizResultSection = memo(function QuizResultSection({
  userId,
}: {
  userId: string;
}) {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  const handleAddSlot = useCallback(() => {
    form.setValue("resultPageSlots", [
      ...form.watch("resultPageSlots"),
      {
        id: uuidv4(),
        entityId: "",
        type: ResultPageSlotsType.CATEGORY,
        description: "",
        productCount: DEFAULT_PRODUCT_COUNT,
      },
    ]);
  }, [form]);

  return (
    <>
      <h4>{t("resultPage")}</h4>
      <FormField
        control={form.control}
        name="quizResultHeadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("resultHeadline.label")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("resultHeadline.placeholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="quizResultDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("resultDescription.label")}</FormLabel>
            <FormControl>
              <Editor
                className="min-h-[200px]"
                placeholder={t("resultDescription.placeholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-col gap-2">
        <h4>{t("resultPageSlots.title")}</h4>
        <div className="space-y-4">
          {form.watch("resultPageSlots").map((slot, index) => (
            <ResultSlot
              key={slot.id}
              slot={slot}
              index={index}
              userId={userId}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleAddSlot}
          >
            <Icons.add className="mr-2 h-4 w-4" />{" "}
            {t("resultPageSlots.addButton")}
          </Button>
        </div>
      </div>
    </>
  );
});
