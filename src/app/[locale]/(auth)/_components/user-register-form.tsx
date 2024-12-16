"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  createNextSupabaseClient,
  useSupabase,
} from "../../../../../lib/supabase-client";
import GoogleSignInButton from "./google-auth-button";
import { Button } from "@/web/components/ui/button";
import { User } from "@/web/lib/supabase-server";
import { useSignOut } from "@/web/lib/use-sign-out";

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserRegisterForm({
  user,
  shareInvitationId,
}: {
  user: User | null;
  shareInvitationId: string;
}) {
  const supabase = useSupabase();
  const { signOut } = useSignOut({
    redirectTo: shareInvitationId
      ? `/invitation-accept/${shareInvitationId}`
      : "/overview",
  });

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
        // redirectTo: shareInvitationId
        //   ? `/invitation-accept/${shareInvitationId}`
        //   : callbackUrl ?? "/overview",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      toast.error(`Error signing in with Google: ${error}`);
      return;
    }

    if (data) {
      return redirect(data.url);
    }

    // router.push(callbackUrl ?? "/dashboard");

    // signIn("google", {
    //   callbackUrl: shareInvitationId
    //     ? `/confirm-invitation-acceptance/${shareInvitationId}`
    //     : callbackUrl ?? "/overview",
    // });
  };

  const onSubmit = async (data: UserFormValue) => {
    startTransition(() => {
      signIn("credentials", {
        email: data.email,
        callbackUrl: callbackUrl ?? "/overview",
      });
      toast.success("Signed In Successfully!");
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            Continue With Email
          </Button>
        </form>
      </Form> */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Register with
          </span>
        </div>
      </div>
      {user ? (
        <>
          <div className="flex flex-col gap-2 text-center">
            You are currently signed in. To accept this invitation, please sign
            out first.
          </div>
          <Button onClick={() => signOut()} className="w-full">
            Sign Out
          </Button>
        </>
      ) : (
        <GoogleSignInButton
          onClick={() => {
            void loginWithGoogle();
          }}
        />
      )}
    </>
  );
}
