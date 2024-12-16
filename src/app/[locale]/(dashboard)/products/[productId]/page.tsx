import { notFound } from "next/navigation";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import ProductViewPage from "../_components/product-view-page";

export const metadata = {
  title: "Dashboard : Product View",
};

export default async function Page({
  params,
}: {
  params: { productId: string };
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  const product = await supabase
    .from("products")
    .select("*")
    .eq("id", params.productId)
    .single();

  if (!product.data) {
    notFound();
  }

  return <ProductViewPage product={product.data} />;
}
