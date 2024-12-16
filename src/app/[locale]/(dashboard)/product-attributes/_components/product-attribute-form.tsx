"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import Image from "next/image";
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
import { Product, User } from "@/web/lib/supabase-server";
import {
  useInsertMutation,
  useUpdateMutation,
} from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { MakeOptional } from "@/lib/ts-helpers";
import { ProductAttribute } from "../../../../../../lib/supabase-server";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Maybe } from "actual-maybe";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

const productAttributeToForm = (
  productAttribute: MakeOptional<ProductAttribute> | null | undefined,
): z.infer<typeof formSchema> => {
  return {
    name: productAttribute?.name ?? "",
    description: productAttribute?.description ?? "",
  };
};

export default function ProductAttributeForm({
  productAttribute,
  user,
}: {
  productAttribute?: ProductAttribute;
  user: User;
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const t = useTranslations("productAttributeForm");

  const insertMutation = useInsertMutation(
    supabase.from("product_attributes"),
    ["id"],
    "*",
    {
      onSuccess: async (addedEntities) => {
        Maybe.fromFirst(addedEntities).map((entity) => {
          toast.success(t("productAttributeCreated"));
          if (entity.id) {
            router.push(`/product-attributes/${entity.id}`);
          }
        });
      },
    },
  );

  const mutation = useUpdateMutation(
    supabase.from("product_attributes"),
    ["id"],
    null,
    {
      onSuccess: async (_, updatedEntity) => {
        toast.success(t("productAttributeUpdated"));
        form.reset(productAttributeToForm(updatedEntity));
      },
    },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: productAttributeToForm(productAttribute),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!productAttribute) {
      insertMutation.mutate([
        {
          name: values.name,
          user: user.id,
          description: values.description,
        },
      ]);
      return;
    }

    mutation.mutate({
      id: productAttribute.id,
      name: values.name,
      description: values.description,
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {t("productAttribute")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("namePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*<FormField
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
