import * as z from "zod";

export const getProfileFormSchema = <T extends (text: string) => string>(
  t: T,
) =>
  z.object({
    name: z.string().min(3, { message: t("minCharProduct") }),
    email: z.string().email({ message: t("minCharProduct") }),
    contactno: z.coerce.number(),
  });

export type ProfileFormValues = z.infer<
  ReturnType<typeof getProfileFormSchema>
> &
  z.infer<ReturnType<typeof getProfileFormSchema>>;
