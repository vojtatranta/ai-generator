import { AreaGraph } from "./area-graph";
import { BarGraph } from "./bar-graph";
import { PieGraph } from "./pie-graph";
import {
  CalendarDateRangePicker,
  DateRangePickerProvider,
} from "@/web/components/date-range-picker";
import PageContainer from "@/web/components/layout/page-container";
import { RecentSales } from "./recent-sales";
import { Button } from "@/web/components/ui/button";
import DrawingEinsteinPic from "../../../../../../public/ai-stein-drawinig.webp";
import PostingEinsteinPic from "../../../../../../public/aistein-posting.webp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/web/components/ui/card";
import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/web/components/ui/tabs";
import { getTranslations } from "next-intl/server";
import { getSureUserPlan, getUsedNumberOfAnswers } from "@/lib/stripe";
import { cn, getPlanRange } from "@/lib/utils";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { PROMPTS } from "@/constants/data";
import { getPromptLink } from "@/lib/private-links";

export default async function OverViewPage() {
  const userData = await getSureUserPlan();
  const t = await getTranslations();
  const numberOfAnswers = await getUsedNumberOfAnswers(userData.user.id);
  const planRange = getPlanRange(userData.plan);

  const remainingAnswers = planRange
    ? planRange.to - (numberOfAnswers ?? 0)
    : null;

  const planExhausted = remainingAnswers != null && remainingAnswers <= 0;

  return (
    <PageContainer scrollable>
      <DateRangePickerProvider>
        <div className="space-y-2">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("overview.welcomeBack")} 👋
            </h2>
            {/* <div className="hidden items-center space-x-2 md:flex">
              <CalendarDateRangePicker />
              <Button>{t("overview.download")}</Button>
            </div> */}
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                {t("overview.overview")}
              </TabsTrigger>
              {/* <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger> */}
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("overview.mainHeadingText")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {t("overview.mainDescriptionText")}
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("overview.subscription")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Link href="/subscription">
                        {userData.plan.product.name}
                      </Link>
                    </div>
                    {planRange && (
                      <p className="text-xs text-muted-foreground">
                        {t("overview.from")} {planRange.from} {t("overview.to")}{" "}
                        {planRange.to}
                      </p>
                    )}
                  </CardContent>
                </Card>
                {/* <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card> */}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                  <Link href={getPromptLink(PROMPTS.POST_GENERATOR)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("generateSocialPostContentPromptTitle")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-row items-center justify-between gap-4">
                        <div className="max-w-[180px]">
                          <Image
                            src={PostingEinsteinPic}
                            alt="Aistein posting"
                            className="rounded-lg"
                            height="700"
                          />
                        </div>
                        <div className="text-muted-foreground">
                          {t("generateSocialPostContentPromptDescription")}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
                <Card>
                  <Link href={getPromptLink(PROMPTS.POST_IMAGE_GENERATOR)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("generateSocialPostImageContentPromptTitle")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-row items-center justify-between gap-4">
                        <div className="max-w-[180px]">
                          <Image
                            src={DrawingEinsteinPic}
                            alt="Aistein posting"
                            className="rounded-lg"
                            height="700"
                          />
                        </div>
                        <div className="text-muted-foreground">
                          {t("generateSocialPostImageContentPromptDescription")}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
              {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                  <BarGraph userId={userData.user.id} />
                </div>
                <Card className="col-span-4 md:col-span-3">
                  <CardHeader>
                    <CardTitle>{t("overview.recentAnswers")}</CardTitle>
                    <CardDescription>
                      {t("overview.recentAnswersDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales userId={userData.user.id} />
                  </CardContent>
                </Card>
                <div className="col-span-4">
                <AreaGraph />
              </div>
              <div className="col-span-4 md:col-span-3">
                <PieGraph />
              </div>
              </div> */}
            </TabsContent>
          </Tabs>
        </div>
      </DateRangePickerProvider>
    </PageContainer>
  );
}
