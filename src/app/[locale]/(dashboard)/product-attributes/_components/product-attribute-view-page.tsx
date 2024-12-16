import PageContainer from "@/web/components/layout/page-container";
import { ProductAttribute, User } from "@/web/lib/supabase-server";
import ProductAttributeForm from "./product-attribute-form";

export default async function ProductViewPage({
  productAttribute,
  user,
}: {
  productAttribute?: ProductAttribute;
  user: User;
}) {
  return (
    <PageContainer>
      <ProductAttributeForm productAttribute={productAttribute} user={user} />
    </PageContainer>
  );
}
