"use client"

import {
  ArrowRight,
  CheckCheck,
  FileCheck2,
  LockKeyhole,
  Route,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activationGates, type Copy, type WorkspaceTab } from "./copy"

export function ApprovalFlow({ copy: c }: { copy: Copy }) {
  const stages = [
    {
      icon: FileCheck2,
      title: c("Request & revision", "الطلب والإصدار"),
      detail: c("Validated, company-scoped", "متحقق ومعزول بالشركة"),
    },
    {
      icon: ShieldCheck,
      title: c("HSE review", "مراجعة السلامة"),
      detail: c("Safety delegate first", "مفوض السلامة أولًا"),
    },
    {
      icon: Users,
      title: c("Management approval", "موافقة الإدارة"),
      detail: c("A different approver", "معتمد مختلف"),
    },
    {
      icon: CheckCheck,
      title: c("Departure clearance", "تصريح المغادرة"),
      detail: c("Recheck every safety gate", "إعادة فحص كل بوابات السلامة"),
    },
  ]
  return (
    <ol
      aria-label={c("Required approval sequence", "تسلسل الموافقات المطلوب")}
      className="grid gap-3 md:grid-cols-4"
    >
      {stages.map(({ icon: Icon, title, detail }, index) => (
        <li
          key={title}
          className="flex items-start gap-3 rounded-lg border bg-background p-4 text-foreground"
        >
          <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
          </div>
          {index < stages.length - 1 && (
            <ArrowRight
              className="hidden size-4 shrink-0 text-muted-foreground md:block rtl:rotate-180"
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  )
}

export function OverviewPanel({
  copy: c,
  openPlanner,
  showActivation,
}: {
  copy: Copy
  openPlanner: () => void
  showActivation: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            c("Planned journeys", "الرحلات المخططة"),
            c("Verified scheduling", "جدولة متحقق منها"),
          ],
          [
            c("Awaiting approval", "بانتظار الموافقة"),
            c("HSE → management", "السلامة ثم الإدارة"),
          ],
          [
            c("On the road", "على الطريق"),
            c("Execution & check-ins", "التنفيذ والتواصل"),
          ],
          [
            c("Attention required", "تتطلب الانتباه"),
            c("Overdue & safety alerts", "التأخر وتنبيهات السلامة"),
          ],
        ].map(([label, detail]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>
                <span
                  aria-label={c(
                    "Unavailable until connected",
                    "غير متاح حتى الربط"
                  )}
                  className="font-mono text-3xl"
                >
                  —
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              {c(
                "One journey. A complete safety chain.",
                "رحلة واحدة. سلسلة سلامة متكاملة."
              )}
            </CardTitle>
            <Badge variant="outline">
              {c("Required sequence", "تسلسل إلزامي")}
            </Badge>
          </div>
          <CardDescription>
            {c(
              "Approval and execution are separate. A changed route, time, driver or vehicle invalidates the previous clearance.",
              "الموافقة منفصلة عن التنفيذ. تغيير المسار أو الوقت أو السائق أو المركبة يلغي صلاحية التصريح السابق."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalFlow copy={c} />
        </CardContent>
        <CardFooter>
          <p className="text-sm leading-6 text-muted-foreground">
            {c(
              "No requests, approvals, alerts or resource counts have been loaded. The figures above are unavailable, not zero.",
              "لم تُحمّل طلبات أو موافقات أو تنبيهات أو أعداد موارد. الأرقام أعلاه غير متاحة وليست صفرًا."
            )}
          </p>
        </CardFooter>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Route className="size-5 text-primary" aria-hidden="true" />
            <CardTitle>
              {c("Plan the whole journey", "خطط للرحلة كاملة")}
            </CardTitle>
            <CardDescription>
              {c(
                "Passengers, goods or equipment. Local or intercity. Combine return legs, stops and emergency characteristics without losing control of the route.",
                "ركاب أو بضائع أو معدات. داخلي أو بين المدن. اجمع العودة والمحطات وخصائص الطوارئ مع الحفاظ على التحكم في المسار."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                c("Sectional planner", "نموذج مقسّم"),
                c("Manual routes", "مسارات يدوية"),
                c("Optional manifests", "كشوف اختيارية"),
              ].map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={openPlanner}>
              {c("Open planner", "فتح مخطط الرحلة")}
              <ArrowRight data-icon="inline-end" className="rtl:rotate-180" />
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
            <CardTitle>
              {c(
                "Safe by staging, not by assumption",
                "تفعيل مرحلي بلا افتراضات"
              )}
            </CardTitle>
            <CardDescription>
              {c(
                "No production writes, migrations, uploads or outgoing messages. Real operations start only after ownership, policy and server authorization are verified.",
                "لا كتابة إنتاجية أو ترحيل أو رفع ملفات أو رسائل صادرة. يبدأ التشغيل بعد التحقق من الملكية والسياسات وصلاحيات الخادم."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {c(
                "Existing unscoped driver and vehicle queries are not used by this workspace.",
                "لا تستخدم هذه المساحة استعلامات السائقين والمركبات القديمة غير المعزولة."
              )}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={showActivation}>
              {c("View activation gates", "عرض بوابات التفعيل")}
              <ArrowRight data-icon="inline-end" className="rtl:rotate-180" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export function ActivationPanel({ copy: c }: { copy: Copy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {c("Activation checkpoints", "نقاط اعتماد التفعيل")}
        </CardTitle>
        <CardDescription>
          {c(
            "The approved code phase does not authorize these operations. Each checkpoint requires a separate, scoped decision.",
            "اعتماد مرحلة الكود لا يصرح بهذه العمليات. كل نقطة تحتاج قرارًا منفصلًا محدد النطاق."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col divide-y">
          {activationGates.map((gate) => (
            <li
              key={gate.id}
              className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">
                  <span className="font-mono">{gate.id}</span>
                </Badge>
                <h3 className="font-medium">
                  {c(gate.title.en, gate.title.ar)}
                </h3>
                <Badge variant="secondary">
                  {c("Awaiting authorization", "بانتظار التصريح")}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {c(gate.description.en, gate.description.ar)}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

const panelCopy = {
  journeys: {
    title: ["Journey register", "سجل الرحلات"],
    description: [
      "Company-owned journeys will appear here after verified data access is approved. No historical records have been migrated or hidden in the database.",
      "ستظهر رحلات الشركة بعد اعتماد الوصول المتحقق للبيانات. لم تُرحّل أو تُخفَ أي سجلات تاريخية في قاعدة البيانات.",
    ],
    columns: [
      ["Reference", "المرجع"],
      ["Route", "المسار"],
      ["Departure", "المغادرة"],
      ["Approval", "الموافقة"],
      ["Execution", "التنفيذ"],
    ],
  },
  approvals: {
    title: ["Review queue", "قائمة المراجعة"],
    description: [
      "Queues require a verified company and business-unit delegation. A global role or the same person in two roles is not an approval chain.",
      "تتطلب القوائم شركة متحققًا منها وتفويضًا لوحدة الأعمال. الدور العام أو الشخص نفسه بدورين لا يشكل سلسلة موافقات.",
    ],
    columns: [
      ["Request", "الطلب"],
      ["Revision", "الإصدار"],
      ["HSE delegate", "مفوض السلامة"],
      ["Management delegate", "مفوض الإدارة"],
    ],
  },
  resources: {
    title: ["Driver & vehicle readiness", "جاهزية السائقين والمركبات"],
    description: [
      "Ownership must be reconciled before any resource is shown or assigned. Unknown ownership, capacity or expiry cannot be treated as valid.",
      "تجب مطابقة الملكية قبل عرض أو إسناد أي مورد. الملكية والسعة والصلاحية المجهولة لا تُعد صالحة.",
    ],
    columns: [
      ["Resource", "المورد"],
      ["Company", "الشركة"],
      ["Documents", "المستندات"],
      ["Availability", "التوفر"],
    ],
  },
  locations: {
    title: ["Sites & branches", "المواقع والفروع"],
    description: [
      "Sites will be scoped to verified companies and branches. Manual stop planning is available without activating a map service.",
      "ستُعزل المواقع حسب الشركات والفروع المتحقق منها. تخطيط المحطات اليدوي متاح دون تفعيل خدمة خرائط.",
    ],
    columns: [
      ["Site", "الموقع"],
      ["Branch", "الفرع"],
      ["Company", "الشركة"],
      ["Status", "الحالة"],
    ],
  },
  costs: {
    title: ["Journey costs", "تكاليف الرحلات"],
    description: [
      "Estimates, actual expenses, fuel and receipts remain optional. Totals will be separated by company and currency; missing values are not zero.",
      "التقديرات والمصاريف الفعلية والوقود والإيصالات اختيارية. تُفصل المجاميع حسب الشركة والعملة؛ المفقود ليس صفرًا.",
    ],
    columns: [
      ["Journey", "الرحلة"],
      ["Estimated", "التقديري"],
      ["Actual", "الفعلي"],
      ["Currency", "العملة"],
    ],
  },
  reports: {
    title: ["Company-scoped reporting", "تقارير معزولة بالشركة"],
    description: [
      "No report is generated before authorized data access. Spreadsheet safety and export permissions must be checked server-side; no PDF or XLSX is represented as complete.",
      "لا يُنتج تقرير قبل اعتماد الوصول. يلزم فحص أمان الجداول وصلاحيات التصدير على الخادم؛ لا يُعرض PDF أو XLSX كميزة مكتملة.",
    ],
    columns: [
      ["Report", "التقرير"],
      ["Company / unit", "الشركة / الوحدة"],
      ["Period", "الفترة"],
      ["Availability", "الإتاحة"],
    ],
  },
} as const

export function RegisterPanel({
  tab,
  copy: c,
  openPlanner,
}: {
  tab: Exclude<WorkspaceTab, "overview" | "readiness">
  copy: Copy
  openPlanner: () => void
}) {
  const panel = panelCopy[tab]
  const Icon =
    tab === "resources" ? Truck : tab === "approvals" ? ShieldCheck : Route
  return (
    <Card>
      <CardHeader>
        <CardTitle>{c(panel.title[0], panel.title[1])}</CardTitle>
        <CardDescription>
          {c(panel.description[0], panel.description[1])}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tab === "approvals" && (
          <div className="pb-6">
            <ApprovalFlow copy={c} />
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-96 text-start text-sm">
            <caption className="sr-only">
              {c(panel.title[0], panel.title[1])}
            </caption>
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {panel.columns.map(([en, ar]) => (
                  <th
                    key={en}
                    scope="col"
                    className="px-4 py-3 text-start font-medium"
                  >
                    {c(en, ar)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={panel.columns.length}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Icon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {c(
                          "Verified data is not connected",
                          "لم تُربط البيانات المتحقق منها"
                        )}
                      </EmptyTitle>
                      <EmptyDescription>
                        {c(
                          "No sample records. No unscoped legacy queries. This register is not operational yet.",
                          "لا سجلات تجريبية ولا استعلامات قديمة غير معزولة. هذا السجل غير تشغيلي بعد."
                        )}
                      </EmptyDescription>
                    </EmptyHeader>
                    {tab === "journeys" && (
                      <Button variant="outline" onClick={openPlanner}>
                        {c("Explore the planner", "استكشاف مخطط الرحلة")}
                      </Button>
                    )}
                  </Empty>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter>
        <Badge variant="outline">
          {c(
            "Read-only staging · writes disabled",
            "مرحلة معاينة · الكتابة معطلة"
          )}
        </Badge>
      </CardFooter>
    </Card>
  )
}
