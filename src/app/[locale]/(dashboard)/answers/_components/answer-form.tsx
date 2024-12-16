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
import { Answer, Question, User } from "@/web/lib/supabase-server";
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
import { MakeOptional } from "@/lib/ts-helpers";
import { useTranslations } from "next-intl";

const formSchema = z.object({});

const answerToForm = (
  answer: MakeOptional<Answer> | null | undefined,
): z.infer<typeof formSchema> => {
  return {
    // text: answer?.text ?? "",
  };
};

export default function AnswerForm({
  answer,
  users,
}: {
  answer?: Answer | null;
  users: User[];
}) {
  const supabase = useSupabase();
  const t = useTranslations("answerDetail");

  const mutation = useUpdateMutation(supabase.from("questions"), ["id"], null, {
    onSuccess: async (_, updatedEntity) => {
      toast.success("Answer updated");
      form.reset(answerToForm(updatedEntity));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: answerToForm(answer),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!answer) {
      return;
    }

    mutation.mutate({
      id: answer.id,
      // text: values.text,
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
          {answer && (
            <>
              <div className="space-y-8">
                Quiz: <Link href={`/quizes/${answer.quiz}`}>View</Link>
              </div>
            </>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <FormLabel>{t("clientEmailLabel")}</FormLabel>
                <div>
                  <CopyableText>{answer?.client_email ?? "N/A"}</CopyableText>
                </div>
              </div>
              <div>
                <FormLabel>{t("createdAtLabel")}</FormLabel>
                <div>
                  <CopyableText>
                    {answer?.created_at
                      ? new Date(answer.created_at).toLocaleString()
                      : "N/A"}
                  </CopyableText>
                </div>
              </div>
              <div>
                <FormLabel>{t("scoringLabel")}</FormLabel>
                <pre>{JSON.stringify(answer?.scoring, null, 2)}</pre>
              </div>
              <div>
                <FormLabel>{t("questionsLabel")}</FormLabel>
                <pre>{JSON.stringify(answer?.questions, null, 2)}</pre>
              </div>
              {/* <FormField
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
              /> */}
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
