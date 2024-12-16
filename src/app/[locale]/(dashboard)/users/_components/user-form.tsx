"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/web/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/web/components/ui/card";
import { User } from "@/web/lib/supabase-server";
import { Database } from "@/web/database.types";
import { trpcApi } from "@/web/components/providers/TRPCProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const allRoles = [
  "admin" as const,
  "provider" as const,
  "technician" as const,
  "tester" as const,
] as const;

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const userToForm = (user: User): z.infer<typeof formSchema> => {
  return {
    name: user?.user_metadata?.name ?? "",
    email: user?.email ?? "",
  };
};

export default function UserForm({ user }: { user: User }) {
  const router = useRouter();
  const selectOptions = React.useMemo(() => {
    return Array.from(new Set([...allRoles]));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: userToForm(user),
  });

  // const { mutate, isLoading } = trpcApi.users.update.useMutation({
  //   onSuccess: () => {
  //     toast.success("User updated successfully");
  //     router.refresh();
  //     form.reset(userToForm(user));
  //   },
  //   onError: (error) => {
  //     toast.error(error.message);
  //   },
  // });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // if (isLoading) {
    //   return;
    // }
    // mutate({
    //   id: user?.id,
    //   ...values,
    // });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">User</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        disabled
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
