import { getTranslations } from "next-intl/server";
import LandingPage from "./_components/LandingPage";

export default async function LandingPageContainer() {
  const t = await getTranslations("landingPage");

  return <LandingPage t={t} />;
}
