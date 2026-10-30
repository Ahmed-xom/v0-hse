"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Globe2,
  LockKeyhole,
  Plus,
  Route,
  SunMoon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JourneyPlanner } from "./journey-planner"
import {
  ActivationPanel,
  OverviewPanel,
  RegisterPanel,
} from "./workspace-panels"
import { tabLabels, type Copy, type WorkspaceTab } from "./copy"

export function JourneyWorkspace() {
  const { isArabic, toggleLanguage } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const [tab, setTab] = useState<WorkspaceTab>("overview")
  const [plannerOpen, setPlannerOpen] = useState(false)
  const c: Copy = (en, ar) => (isArabic ? ar : en)
  const openPlanner = () => setPlannerOpen(true)

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      lang={isArabic ? "ar" : "en"}
      className="min-w-0 bg-background font-sans text-foreground"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-7 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Route className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold tracking-wide">AMNKO</span>
              <span aria-hidden="true">/</span>
              {c("Transport operations", "عمليات النقل")}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                aria-label={c("Toggle color theme", "تبديل مظهر الألوان")}
              >
                <SunMoon data-icon="inline-start" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                aria-label={c("Switch to Arabic", "التبديل إلى الإنجليزية")}
              >
                <Globe2 data-icon="inline-start" />
                {isArabic ? "English" : "العربية"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex max-w-2xl flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  {c("Journey Trucker", "إدارة الرحلات والنقل")}
                </h1>
                <Badge variant="outline">
                  {c("Code-phase preview", "معاينة مرحلة الكود")}
                </Badge>
              </div>
              <p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                {c(
                  "From the first request to a safe return. Plan routes, prepare resources and keep every approval in order.",
                  "من الطلب الأول حتى العودة الآمنة. خطط المسارات وجهّز الموارد وحافظ على تسلسل كل موافقة."
                )}
              </p>
            </div>
            <Button onClick={openPlanner}>
              <Plus data-icon="inline-start" />
              {c("Plan a journey", "تخطيط رحلة")}
            </Button>
          </div>
        </header>
        <Alert>
          <LockKeyhole />
          <AlertTitle>
            {c(
              "Planning interface only · operations are not activated",
              "واجهة تخطيط فقط · التشغيل غير مفعّل"
            )}
          </AlertTitle>
          <AlertDescription>
            {c(
              "No live records are loaded and no changes are saved. Database writes, legacy migration, private uploads, notifications and deployment need their separate approval gates.",
              "لا تُحمّل سجلات حية ولا تُحفظ تغييرات. الكتابة في قاعدة البيانات والترحيل ورفع الملفات الخاصة والتنبيهات والنشر تتطلب بوابات موافقة منفصلة."
            )}
          </AlertDescription>
        </Alert>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as WorkspaceTab)}
          dir={isArabic ? "rtl" : "ltr"}
          className="flex min-w-0 flex-col gap-6"
        >
          <div className="min-w-0 overflow-x-auto border-b pb-2">
            <TabsList className="h-auto w-max justify-start">
              {(
                Object.entries(tabLabels) as [
                  WorkspaceTab,
                  { en: string; ar: string },
                ][]
              ).map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="px-4 py-2.5">
                  {c(label.en, label.ar)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="overview">
            <OverviewPanel
              copy={c}
              openPlanner={openPlanner}
              showActivation={() => setTab("readiness")}
            />
          </TabsContent>
          {(Object.keys(tabLabels) as WorkspaceTab[])
            .filter((value) => value !== "overview" && value !== "readiness")
            .map((value) => (
              <TabsContent key={value} value={value}>
                <RegisterPanel
                  tab={value as Exclude<WorkspaceTab, "overview" | "readiness">}
                  copy={c}
                  openPlanner={openPlanner}
                />
              </TabsContent>
            ))}
          <TabsContent value="readiness">
            <ActivationPanel copy={c} />
          </TabsContent>
        </Tabs>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm text-muted-foreground">
          <p>
            {c(
              "Company ownership first. Safety before departure.",
              "ملكية الشركة أولًا. السلامة قبل المغادرة."
            )}
          </p>
          <a
            href="/#journey-tracker"
            className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            {c("HSE workspace", "مساحة الصحة والسلامة")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </footer>
      </div>
      <JourneyPlanner
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        copy={c}
        isArabic={isArabic}
      />
    </div>
  )
}
