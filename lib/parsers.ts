import z from "zod";

export const QUESTION_TYPES_MAP = {
  single: "single",
  multiple: "multiple",
  text: "text",
} as const;

export const QUESTION_TYPES = [
  QUESTION_TYPES_MAP.single,
  QUESTION_TYPES_MAP.multiple,
  QUESTION_TYPES_MAP.text,
] as const;

export const questionOptionsSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string().nullable().optional(),
  productCategories: z.array(z.string()).nullable().optional(),
  productAttributes: z.array(z.number()).nullable().optional(),
  score: z.number().nullable().optional(),
  excludedProductCategories: z.array(z.string()).nullable().optional(),
  excludeProductAttributes: z.array(z.number()).nullable().optional(),
  optionKey: z.string(),
});

export const quizQuestionSchema = z.array(
  z.object({
    id: z.string(),
    type: z.enum(QUESTION_TYPES).default(QUESTION_TYPES_MAP.single),
    name: z.string(),
    image: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    options: z.array(questionOptionsSchema),
  }),
);

export const answerFormStateSchema = z.object({
  answers: z.record(
    z.string(),
    z.object({
      questionId: z.string(),
      selectedOptionIds: z.array(z.string()),
    }),
  ),
});

export const getEmailAnswerFormSchema = (t: (text: string) => string) =>
  z.object({
    email: z.string().email({
      message: t("quiz.answer.errors.invalidEmail"),
    }),
  });

export type EmailAnswerFormType = z.infer<
  ReturnType<typeof getEmailAnswerFormSchema>
>;

export const evaluationSchema = z.object({
  categoryIds: z.array(
    z.object({
      score: z.number(), // NOTE just the number of metions in the answers
      categoryId: z.string(),
    }),
  ),
  attributeIds: z.array(
    z.object({
      score: z.number(), // NOTE just the number of metions in the answers
      attributeId: z.number(),
    }),
  ),
});

export type QuizEvaluationType = z.infer<typeof evaluationSchema>;

export const createEvaluationFromTheAnswerFormState = (
  answerFormState: AnswerFormState,
  questions: z.infer<typeof quizQuestionSchema>,
): z.infer<typeof evaluationSchema> => {
  const excludedCategories: Set<string> = new Set();
  const excludedAttributes: Set<number> = new Set();
  const categoryScores: Record<string, number> = {};
  const attributeScores: Record<number, number> = {};

  Object.values(answerFormState.answers).forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) {
      return;
    }

    const selectedOptions = question.options.filter((o) =>
      Boolean(answer.selectedOptionIds?.includes(o.id)),
    );

    selectedOptions.forEach((selectedOption) => {
      selectedOption.productCategories?.forEach((category) => {
        categoryScores[category] =
          (categoryScores[category] ?? 0) + (selectedOption.score ?? 1);
      });

      selectedOption.productAttributes?.forEach((attribute) => {
        attributeScores[attribute] =
          (attributeScores[attribute] ?? 0) + (selectedOption.score ?? 1);
      });
      selectedOption.excludedProductCategories?.forEach((category) => {
        excludedCategories.add(category);
      });

      selectedOption.excludeProductAttributes?.forEach((attribute) => {
        excludedAttributes.add(attribute);
      });
    });
  });

  return {
    categoryIds: Object.entries(categoryScores)
      .filter(([categoryId]) => !excludedCategories.has(categoryId))
      .map(([categoryId, score]) => ({
        categoryId,
        score,
      })),
    attributeIds: Object.entries(attributeScores)
      .filter(([attributeId]) => !excludedAttributes.has(Number(attributeId)))
      .map(([attributeId, score]) => ({
        attributeId: Number(attributeId),
        score,
      })),
  };
};

export type AnswerFormState = z.infer<typeof answerFormStateSchema>;
