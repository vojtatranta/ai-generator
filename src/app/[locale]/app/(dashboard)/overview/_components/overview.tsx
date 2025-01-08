import { AreaGraph } from "./area-graph";
import { BarGraph } from "./bar-graph";
import { PieGraph } from "./pie-graph";
import {
  CalendarDateRangePicker,
  DateRangePickerProvider,
} from "@/web/components/date-range-picker";
import PageContainer from "@/web/components/layout/page-container";
import { RecentGenerations } from "./recent-generations";
import { Button } from "@/web/components/ui/button";
import DrawingEinsteinPic from "../../../../../../../public/ai-stein-drawinig.webp";
import PostingEinsteinPic from "../../../../../../../public/aistein-posting.webp";
import DrawingEinsteinWritingArticle from "../../../../../../../public/esintein-writing.jpg";
import DrawingEinsteinChatting from "../../../../../../../public/aisteinchat.jpg";
import EinsteinDocReading from "../../../../../../../public/docchateinstein.jpg";
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
import { getSureUserPlan, getUsedNumberOfGenerations } from "@/lib/stripe";
import Link from "next/link";
import { AI_CHAT_PROMPT_SLUG, DOCUMENT_CHAT, PROMPTS } from "@/constants/data";
import { getPromptLink, getSubscriptionLink } from "@/lib/private-links";
import { getPlanQuota } from "@/constants/plan";
import { Icons } from "@/components/icons";

export default async function OverViewPage() {
  const userData = await getSureUserPlan();
  const t = await getTranslations();
  const numberOfGenerations = await getUsedNumberOfGenerations(
    userData.user.id,
  );

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
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-2">
                <Card>
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

                    <div className="mt-4 flex flex-row justify-end">
                      <Link href={getPromptLink(PROMPTS.POST_GENERATOR)}>
                        <Button type="button">
                          <Icons.messageCircleMore className="mr-2 h-4 w-4" />
                          {t("overview.generatePostCTA")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("generateSocialPostImageContentPromptTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center justify-between gap-2">
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

                    <div className="mt-4 flex flex-row justify-end">
                      <Link href={getPromptLink(PROMPTS.POST_IMAGE_GENERATOR)}>
                        <Button type="button">
                          <Icons.palette className="mr-2 h-4 w-4" />
                          {t("overview.generateImagePostCTA")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("overview.chatWithTheDocument")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="max-w-[180px]">
                        <Image
                          src={EinsteinDocReading}
                          alt="Aistein document chatting"
                          className="rounded-lg"
                          height="700"
                        />
                      </div>
                      <div className="text-muted-foreground">
                        {t("overview.chatWithTheDocumentDescription")}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-row justify-end">
                      <Link href={getPromptLink(DOCUMENT_CHAT)}>
                        <Button type="button">
                          <Icons.notebookPen className="mr-2 h-4 w-4" />
                          {t("overview.chatWithDocumentCtaCTA")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("overview.chatWithAISocialAssistant")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="max-w-[180px]">
                        <Image
                          src={DrawingEinsteinChatting}
                          alt="Aistein writing"
                          className="rounded-lg"
                          height="700"
                        />
                      </div>
                      <div className="text-muted-foreground">
                        {t("overview.chatWithAISocialAssistantDescription")}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-row justify-end">
                      <Link href={getPromptLink(AI_CHAT_PROMPT_SLUG)}>
                        <Button type="button">
                          <Icons.notebookPen className="mr-2 h-4 w-4" />
                          {t("overview.chatWithAISocialAssistantCTA")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("generateArticleSummaryPromptTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="max-w-[180px]">
                        <Image
                          src={DrawingEinsteinWritingArticle}
                          alt="Aistein writing"
                          className="rounded-lg"
                          height="700"
                        />
                      </div>
                      <div className="text-muted-foreground">
                        {t("summarizeArticlePromptDescription")}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-row justify-end">
                      <Link href={getPromptLink(PROMPTS.ARTICLE_SUMMARIZER)}>
                        <Button type="button">
                          <Icons.notebookPen className="mr-2 h-4 w-4" />
                          {t("overview.summarizeArticleCTA")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-2">
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
                    <CardContent className="flex flex-col">
                      <div className="text-2xl font-bold">
                        <Link href={getSubscriptionLink()}>
                          {userData.plan.product.name}
                        </Link>
                      </div>
                      <div className="mt-10">
                        {getPlanQuota(userData.plan.nickname)
                          .andThen((quota) => (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-bold">{quota}</span>{" "}
                              {t("subscription.quotaLabel")}
                            </div>
                          ))
                          .orNull()}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-bold">
                            {numberOfGenerations}
                          </span>{" "}
                          {t("subscription.numberOfGenerations")}
                        </div>
                      </div>
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
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                  <BarGraph userId={userData.user.id} />
                </div>
                <Card className="col-span-4 md:col-span-3">
                  <CardHeader>
                    <CardTitle>{t("overview.recentGenerations")}</CardTitle>
                    <CardDescription>
                      {t("overview.recentGenerationsDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentGenerations userId={userData.user.id} />
                  </CardContent>
                </Card>
                {/* <div className="col-span-4">
                  <AreaGraph />
                </div>
                <div className="col-span-4 md:col-span-3">
                  <PieGraph />
                </div> */}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DateRangePickerProvider>
    </PageContainer>
  );
}
