"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Form, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { createNextSupabaseClient } from "../../../../../lib/supabase-client";
import GoogleSignInButton from "./google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormField } from "@/components/ui/form";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm({
  shareInvitationId,
}: {
  shareInvitationId?: string;
}) {
  const t = useTranslations();
  const supabase = createNextSupabaseClient();
  const router = useRouter();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, startTransition] = useTransition();
  const defaultValues = {
    email: "demo@gmail.com",
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const loginWithGoogle = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          `${window.location.origin}/api/google-supabase-signin?` +
          new URLSearchParams({
            callbackUrl: callbackUrl ?? `${window.location.origin}/overview`,
          }).toString(),
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      toast.error(t("auth.errors.googleSignIn", { error: error.message }));
      return;
    }

    if (data) {
      return router.push(data.url);
    }
  };

  const onSubmit = async (data: UserFormValue) => {
    startTransition(() => {
      signIn("credentials", {
        email: data.email,
        callbackUrl: callbackUrl ?? "/overview",
      });
      toast.success(t("auth.success.signedIn"));
    });
  };

  return (
    <>
      {/* <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.form.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.form.emailPlaceholder")}
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {t("auth.form.continueWithEmail")}
          </Button>
        </form>
      </Form> */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("auth.form.orContinueWith")}
          </span>
        </div>
      </div>
      <GoogleSignInButton
        onClick={() => {
          void loginWithGoogle();
        }}
      />
    </>
  );
}
