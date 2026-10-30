"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  createJourneyPlan,
  sections,
  validatePlan,
  type Section,
} from "@/lib/journeys/domain"
import { cn } from "@/lib/utils"
import { sectionLabels, type Copy } from "./copy"
import { PlanSections } from "./plan-sections"

export function JourneyPlanner({
  open,
  onOpenChange,
  copy: c,
  isArabic,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: Copy
  isArabic: boolean
}) {
  const [plan, setPlan] = useState(createJourneyPlan)
  const [section, setSection] = useState<Section>("basics")
  const [showIssues, setShowIssues] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const instance = useId()
  const issues = useMemo(() => validatePlan(plan), [plan])
  const dirty = JSON.stringify(plan) !== JSON.stringify(createJourneyPlan())
  const index = sections.indexOf(section)
  const applicable = sections
    .filter(
      (item) => item !== "passengers" || plan.services.includes("passengers")
    )
    .filter(
      (item) =>
        item !== "cargo" ||
        plan.services.some(
          (service) => service === "goods" || service === "equipment"
        )
    )
  const indexApplicable = applicable.indexOf(section)
  const displayIssues = showIssues ? issues : []

  useEffect(() => {
    if (!open || !dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [open, dirty])

  const changeSection = (next: Section) => {
    setSection(next)
    requestAnimationFrame(() => heading.current?.focus())
  }
  const changeOpen = (next: boolean) => {
    if (
      !next &&
      dirty &&
      !window.confirm(
        c(
          "Discard these unsaved planning inputs? Nothing has been saved to the server.",
          "هل تريد تجاهل مدخلات التخطيط غير المحفوظة؟ لم يُحفظ شيء على الخادم."
        )
      )
    )
      return
    if (!next) {
      setPlan(createJourneyPlan())
      setSection("basics")
      setShowIssues(false)
    }
    onOpenChange(next)
  }
  const review = () => {
    setShowIssues(true)
    changeSection("review")
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        showCloseButton={false}
        dir={isArabic ? "rtl" : "ltr"}
        lang={isArabic ? "ar" : "en"}
        className="flex h-[92dvh] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 text-start md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>{c("Plan a journey", "تخطيط رحلة")}</DialogTitle>
              <Badge variant="secondary">
                {c("Unsaved planning inputs", "مدخلات تخطيط غير محفوظة")}
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => changeOpen(false)}
            >
              {c("Close", "إغلاق")}
            </Button>
          </div>
          <DialogDescription>
            {c(
              "Explore every section. This phase cannot save, submit, approve or start a journey.",
              "استكشف كل قسم. هذه المرحلة لا تحفظ أو ترسل أو تعتمد أو تبدأ رحلة."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
          <nav
            aria-label={c("Journey planning sections", "أقسام تخطيط الرحلة")}
            className="shrink-0 overflow-x-auto border-b bg-muted/30 text-foreground md:overflow-y-auto md:border-e md:border-b-0"
          >
            <ol className="flex w-max gap-1 p-3 md:w-auto md:flex-col">
              {sections.map((item) => {
                const notApplicable = !applicable.includes(item)
                const count = displayIssues.filter(
                  (issue) => issue.section === item
                ).length
                return (
                  <li key={item}>
                    <button
                      type="button"
                      aria-current={section === item ? "step" : undefined}
                      aria-controls={`${instance}-section`}
                      onClick={() => changeSection(item)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        section === item
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span>
                        {c(sectionLabels[item].en, sectionLabels[item].ar)}
                      </span>
                      {count ? (
                        <span
                          className="font-mono"
                          aria-label={c(`${count} issues`, `${count} ملاحظات`)}
                        >
                          {count}
                        </span>
                      ) : notApplicable ? (
                        <span aria-label={c("Not selected", "غير محدد")}>
                          —
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
          <div
            id={`${instance}-section`}
            className="min-h-0 min-w-0 overflow-y-auto px-5 py-6 md:px-8"
          >
            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-2">
                <p className="font-mono text-sm text-muted-foreground">
                  {c("Section", "القسم")} {index + 1} / {sections.length}
                </p>
                <h2
                  ref={heading}
                  tabIndex={-1}
                  className="text-xl font-semibold tracking-tight outline-none"
                >
                  {c(sectionLabels[section].en, sectionLabels[section].ar)}
                </h2>
              </header>
              {section === "review" && showIssues && (
                <Alert variant={issues.length ? "destructive" : "default"}>
                  <AlertCircle />
                  <AlertTitle>
                    {issues.length
                      ? c(
                          `${issues.length} validation items need attention`,
                          `${issues.length} ملاحظات تحتاج مراجعة`
                        )
                      : c(
                          "Local fields checked — server gates remain closed",
                          "فُحصت الحقول محليًا — بوابات الخادم ما زالت مغلقة"
                        )}
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                      {issues.map((issue, issueIndex) => (
                        <li key={`${issue.field}-${issue.code}-${issueIndex}`}>
                          <button
                            type="button"
                            className="text-start underline underline-offset-4"
                            onClick={() => changeSection(issue.section)}
                          >
                            {c(
                              sectionLabels[issue.section].en,
                              sectionLabels[issue.section].ar
                            )}
                            : {c(issue.message.en, issue.message.ar)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <PlanSections
                section={section}
                plan={plan}
                setPlan={setPlan}
                context={{ issues: displayIssues, copy: c }}
              />
            </div>
          </div>
        </div>
        <footer className="flex shrink-0 flex-col border-t bg-card px-5 py-4 text-card-foreground md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  changeSection(
                    applicable[Math.max(0, indexApplicable - 1)] ?? "basics"
                  )
                }
                disabled={section === "basics"}
              >
                <ArrowLeft
                  data-icon="inline-start"
                  className="rtl:rotate-180"
                />
                {c("Back", "السابق")}
              </Button>
              {section !== "review" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    changeSection(
                      applicable[
                        indexApplicable < 0
                          ? 0
                          : Math.min(applicable.length - 1, indexApplicable + 1)
                      ]
                    )
                  }
                >
                  {c("Next", "التالي")}
                  <ArrowRight
                    data-icon="inline-end"
                    className="rtl:rotate-180"
                  />
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={review}>
                  {c("Check again", "إعادة الفحص")}
                </Button>
              )}
            </div>
            <Button type="button" onClick={review}>
              {c("Review inputs", "مراجعة المدخلات")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <p className="flex items-center gap-2 text-sm leading-6 text-muted-foreground">
              <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
              {c(
                "Nothing is stored. Closing discards these inputs.",
                "لا تُخزن المدخلات. إغلاق النموذج يلغيها."
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled>
                {c("Save draft", "حفظ المسودة")}
              </Button>
              <Button type="button" size="sm" disabled>
                {c("Submit for HSE review", "إرسال لمراجعة السلامة")}
              </Button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
