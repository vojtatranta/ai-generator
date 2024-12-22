import OverViewPage from "./_components/overview";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("overview"),
  };
}

export default function Page() {
  return <OverViewPage />;
}
