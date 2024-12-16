import { getUser } from "@/lib/supabase-server";
import ProductAttributeViewPage from "../_components/product-attribute-view-page";

export const metadata = {
  title: "Dashboard : New product attribute",
};

export default async function Page({
  params,
}: {
  params: { productAttributeId: string };
}) {
  const user = await getUser();
  return <ProductAttributeViewPage user={user} />;
}
