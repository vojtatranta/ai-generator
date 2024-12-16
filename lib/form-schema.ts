import * as z from "zod";

export const getProfileFormSchema = <T extends (text: string) => string>(
  t: T,
) =>
  z.object({
    name: z
      .string()
      .min(3, { message: t("form.validation.minChars").replace("{0}", "3") }),
    email: z.string().email({ message: t("form.validation.invalidEmail") }),
    contactno: z.coerce
      .number()
      .min(1, { message: t("form.validation.invalidPhone") }),
  });

export type ProfileFormValues = z.infer<
  ReturnType<typeof getProfileFormSchema>
> &
  z.infer<ReturnType<typeof getProfileFormSchema>>;
