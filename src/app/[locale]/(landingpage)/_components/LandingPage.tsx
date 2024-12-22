import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Image,
  FileText,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { CompanyLogoName } from "@/components/CompanyLogoName";
import { FREE_TRIAL_DURATION_IN_DAYS } from "@/constants/plan";
import { GetStartedButton } from "@/components/GetStartedButton";
import { Icons } from "@/components/icons";
import { TranslationValues } from "next-intl";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export default function LandingPage({
  t,
}: {
  t: (key: string, options?: TranslationValues) => string;
}) {
  return (
    <ScrollArea className="h-screen w-screen overflow-auto">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <CompanyLogoName />
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#home"
                className="text-sm font-medium hover:text-primary"
              >
                {t("navigation.home")}
              </Link>
              <Link
                href="#features"
                className="text-sm font-medium hover:text-primary"
              >
                {t("navigation.features")}
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium hover:text-primary"
              >
                {t("navigation.pricing")}
              </Link>
              <Link
                href="#contact"
                className="text-sm font-medium hover:text-primary"
              >
                {t("navigation.contact")}
              </Link>
            </nav>
            <GetStartedButton text={t("navigation.getStarted")} />
          </div>
        </header>

        {/* Hero Section */}
        <section id="home" className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-[600px] mx-auto">
              {t("hero.description")}
            </p>
            <div className="flex gap-4 justify-center">
              <GetStartedButton
                size="lg"
                text={t("hero.getStarted", {
                  days: FREE_TRIAL_DURATION_IN_DAYS,
                })}
              />
              {/* <Button size="lg" variant="outline" asChild>
              <Link href="https://app.aistein.com/demo">
                {t("hero.watchDemo")}
              </Link>
            </Button> */}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("features.title")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                    <Icons.messageCircleMore className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("features.aiPost.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("features.aiPost.description")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                    <Icons.palette className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("features.imageCreation.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("features.imageCreation.description")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                    <Icons.notebookPen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("features.articleWriting.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("features.articleWriting.description")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("howItWorks.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="font-bold mb-2">
                  {t("howItWorks.step1.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("howItWorks.step1.description")}
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="font-bold mb-2">
                  {t("howItWorks.step2.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("howItWorks.step2.description")}
                </p>
              </div>
              <div className="text-center">
                <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="font-bold mb-2">
                  {t("howItWorks.step3.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("howItWorks.step3.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/50">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("pricing.title")}
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold mb-2">
                      {t("pricing.starter.title")}
                    </h3>
                    <div className="text-3xl font-bold mb-2">
                      {t("pricing.starter.price")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("pricing.starter.period")}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.starter.features.generations")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.starter.features.templates")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.starter.features.support")}
                    </li>
                  </ul>
                  <GetStartedButton
                    className="w-full"
                    variant="outline"
                    text={t("pricing.getStarted")}
                  />
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold mb-2">
                      {t("pricing.pro.title")}
                    </h3>
                    <div className="text-3xl font-bold mb-2">
                      {t("pricing.pro.price")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("pricing.pro.period")}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.pro.features.generations")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.pro.features.templates")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.pro.features.support")}
                    </li>
                  </ul>
                  <GetStartedButton
                    className="w-full"
                    text={t("pricing.getStarted")}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold mb-2">
                      {t("pricing.business.title")}
                    </h3>
                    <div className="text-3xl font-bold mb-2">
                      {t("pricing.business.price")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("pricing.business.period")}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.business.features.generations")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.business.features.templates")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.business.features.support")}
                    </li>
                  </ul>
                  <GetStartedButton
                    className="w-full"
                    text={t("pricing.getStarted")}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold mb-2">
                      {t("pricing.enterprise.title")}
                    </h3>
                    <div className="text-3xl font-bold mb-2">
                      {t("pricing.enterprise.price")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("pricing.enterprise.period")}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.enterprise.features.generations")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.enterprise.features.templates")}
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      {t("pricing.enterprise.features.support")}
                    </li>
                  </ul>
                  <Link href="#contact">
                    <Button className="w-full" variant="outline">
                      {t("pricing.contactSales")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("contact.title")}
            </h2>
            <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-bold">{t("contact.email.title")}</h3>
                      <p className="text-muted-foreground">
                        {t("contact.email.value")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-bold">{t("contact.phone.title")}</h3>
                      <p className="text-muted-foreground">
                        {t("contact.phone.value")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* <Card>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      {t("contact.form.name")}
                    </label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t("contact.form.email")}
                    </label>
                    <input
                      type="email"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t("contact.form.message")}
                    </label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      rows={4}
                    ></textarea>
                  </div>
                  <Button className="w-full">{t("contact.form.submit")}</Button>
                </form>
              </CardContent>
            </Card> */}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-xl mb-8 opacity-90">{t("cta.description")}</p>
            <GetStartedButton
              text={t("cta.button")}
              size="lg"
              variant="secondary"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CompanyLogoName />
              <div className="flex gap-6">
                {/* <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.links.terms")}
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.links.privacy")}
                </Link> */}
                <Link
                  href="#contact"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.links.contact")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ScrollArea>
  );
}
