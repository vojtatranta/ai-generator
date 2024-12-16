import { notFound } from "next/navigation";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import ProductViewPage from "../_components/product-attribute-view-page";

export const metadata = {
  title: "Dashboard : Product View",
};

export default async function Page({
  params,
}: {
  params: { productAttributeId: string };
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  const product = await supabase
    .from("product_attributes")
    .select("*")
    .eq("id", params.productAttributeId)
    .eq("user", user.id)
    .single();

  if (!product.data) {
    notFound();
  }

  return <ProductViewPage productAttribute={product.data} user={user} />;
}
