"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/web/components/ui/card";
import Link from "next/link";
import { Question, User } from "@/web/lib/supabase-server";
import { CopyableText } from "@/web/components/CopyableText";
import { Icons } from "@/web/components/icons";
import { UsersSelect } from "@/web/components/UsersSelect";
import { useMemo } from "react";
import { useUpdateMutation } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "@/web/components/ui/textarea";
import { CustomMap, Place } from "@/components/map/CustomMap";

const formSchema = z.object({
  text: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

function Marker({
  children,
  lat,
  lng,
}: {
  children: React.ReactNode;
  lat: number | string;
  lng: number | string;
}) {
  return <div>{children}</div>;
}
type MakeOptional<T> = {
  [K in keyof T]?: T[K];
};

const questionToForm = (
  question: MakeOptional<Question> | null | undefined,
): z.infer<typeof formSchema> => {
  return {
    text: question?.text ?? "",
  };
};

export default function QuestionForm({
  question,
  users,
}: {
  question?: Question | null;
  users: User[];
}) {
  const supabase = useSupabase();

  const mutation = useUpdateMutation(supabase.from("questions"), ["id"], "*", {
    onSuccess: async (_, updatedEntity) => {
      toast.success("Question updated");
      form.reset(questionToForm(updatedEntity));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: questionToForm(question),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!question) {
      return;
    }

    mutation.mutate({
      id: question.id,
      text: values.text,
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Socket Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {question && (
            <>
              <div className="space-y-8">
                Socket chargings:{" "}
                <Link href={`/chargings?socketId=${question.id}`}>
                  View all
                </Link>
              </div>
              <div>
                Device name:{" "}
                <CopyableText className="inline-block">
                  {question.text}
                </CopyableText>
              </div>
            </>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Short name (bluetooth SSID - must be set on socket
                      firmware)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your short name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceUUID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Service UUID (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your service UUID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characteristicRX"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Characteristic RX (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your characteristic RX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characteristicTX"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Characteristic TX (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your characteristic TX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <UsersSelect
                      value={field.value}
                      users={users}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
              {/* <div>
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your longitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your latitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
            </div>
            <Button disabled={mutation.isLoading} type="submit">
              {mutation.isLoading ? "Updating..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
