"use client";

import { useFormContext } from "react-hook-form";
import { memo, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { Icons } from "@/web/components/icons";
import { v4 as uuidv4 } from "uuid";
import { ProductCategoriesMultiSelect } from "@/components/ProductCategoriesMultiSelect";
import { ProductAttributesMultiSelect } from "@/components/ProductAttributesMultiSelect";
import { QUESTION_TYPES_MAP } from "@/lib/parsers";
import { User } from "@/web/lib/supabase-server";

const QuestionOption = memo(function QuestionOption({
  option,
  questionIndex,
  optionIndex,
  userId,
}: {
  option: any;
  questionIndex: number;
  optionIndex: number;
  userId: string;
}) {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  const handleRemoveOption = useCallback(() => {
    const questions = form.getValues("questions");
    questions[questionIndex].options.splice(optionIndex, 1);
    form.setValue("questions", questions);
  }, [form, questionIndex, optionIndex]);

  return (
    <div key={option.id} className="flex flex-col">
      <div className="text-sm">
        {t("optionHeadline")} {option.optionKey}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center">
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.options.${optionIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-sm">
                  {t("optionText.label")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("optionText.placeholder", {
                      optionKey: option.optionKey,
                    })}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            className="mt-8"
            size="sm"
            onClick={handleRemoveOption}
          >
            <Icons.trash className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col">
          <div>
            <h3>{t("productScoringAttributes.title")}</h3>
            <div className="flex flex-row items-center gap-2">
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.options.${optionIndex}.productCategories`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm">
                      {t("productCategories.label")}
                    </FormLabel>
                    <FormControl>
                      <ProductCategoriesMultiSelect
                        userId={userId}
                        values={field.value ?? []}
                        placeholder={t("productCategories.placeholder")}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.options.${optionIndex}.productAttributes`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm">
                      {t("productAttributes.label")}
                    </FormLabel>
                    <FormControl>
                      <ProductAttributesMultiSelect
                        userId={userId}
                        values={field.value ?? []}
                        placeholder={t("productAttributes.placeholder")}
                        onValueChange={(nextValues: string[]) => {
                          field.onChange(nextValues.map(Number));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col mt-8">
          <div>
            <h3>{t("excludeProductScoringAttributes.title")}</h3>
            <div className="flex flex-row items-center gap-2">
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.options.${optionIndex}.excludedProductCategories`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm">
                      {t("excludedProductCategories.label")}
                    </FormLabel>
                    <FormControl>
                      <ProductCategoriesMultiSelect
                        userId={userId}
                        values={field.value ?? []}
                        placeholder={t("excludedProductCategories.placeholder")}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.options.${optionIndex}.excludeProductAttributes`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm">
                      {t("excludeProductAttributes.label")}
                    </FormLabel>
                    <FormControl>
                      <ProductAttributesMultiSelect
                        userId={userId}
                        values={field.value ?? []}
                        placeholder={t("excludeProductAttributes.placeholder")}
                        onValueChange={(nextValues: string[]) => {
                          field.onChange(nextValues.map(Number));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const QuizQuestionsSection = memo(function QuizQuestionsSection({
  userId,
}: {
  userId: string;
}) {
  const form = useFormContext<QuizFormType>();
  const t = useTranslations("quiz.create");

  const handleAddQuestion = useCallback(() => {
    const questions = form.getValues("questions") ?? [];
    form.setValue("questions", [
      ...questions,
      {
        id: uuidv4(),
        name: "",
        type: QUESTION_TYPES_MAP.single,
        description: "",
        options: [
          {
            id: uuidv4(),
            text: "",
            score: 1,
            productCategories: [],
            excludedProductCategories: [],
            excludeProductAttributes: [],
            productAttributes: [],
            optionKey: String.fromCharCode(65 + questions.length),
          },
        ],
      },
    ]);
  }, [form]);

  const handleAddOption = useCallback(
    (questionIndex: number) => {
      const questions = form.getValues("questions");
      const options = questions[questionIndex].options || [];

      options.push({
        id: uuidv4(),
        text: "",
        score: 1,
        productCategories: [],
        excludedProductCategories: [],
        excludeProductAttributes: [],
        productAttributes: [],
        optionKey: String.fromCharCode(65 + options.length),
      });
      questions[questionIndex].options = options;
      form.setValue("questions", questions);
    },
    [form],
  );

  return (
    <div>
      <div className="space-y-4">
        <div>
          <FormLabel>{t("questions.label")}</FormLabel>
        </div>
        {form.watch("questions")?.map((question, questionIndex) => (
          <div key={questionIndex} className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {form.watch(`questions.${questionIndex}.name`) ||
                  t(`questions.Question`)}
                {"  "}({questionIndex + 1})
              </h3>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  const questions = form.getValues("questions");
                  questions.splice(questionIndex, 1);
                  form.setValue("questions", questions);
                }}
              >
                {t("questions.removeQuestion")}
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("questions.isMultiChoice")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value === QUESTION_TYPES_MAP.multiple}
                      onCheckedChange={(value) => {
                        field.onChange(
                          value
                            ? QUESTION_TYPES_MAP.multiple
                            : QUESTION_TYPES_MAP.single,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("questionName.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("questionName.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("questionDescription.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("questionDescription.placeholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="space-y-2 flex flex-col gap-8">
                {question.options?.map((option, optionIndex) => (
                  <QuestionOption
                    key={option.id}
                    option={option}
                    questionIndex={questionIndex}
                    optionIndex={optionIndex}
                    userId={userId}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <FormLabel>{t("options.label")}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleAddOption(questionIndex)}
                >
                  <Icons.add className="mr-2 h-4 w-4" />{" "}
                  {t("options.addOption")}
                </Button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleAddQuestion}>
            <Icons.add className="mr-2 h-4 w-4" />
            {t("questions.addQuestion")}
          </Button>
        </div>
      </div>
    </div>
  );
});
