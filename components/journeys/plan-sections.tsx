"use client"

import type { Dispatch, SetStateAction } from "react"
import {
  Plus,
  Trash2,
  ShieldCheck,
  LockKeyhole,
  Paperclip,
  CircleHelp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  costSubtotals,
  type JourneyPlan,
  type Section,
  type Service,
} from "@/lib/journeys/domain"
import { PlanChoice, PlanField, type FieldContext } from "./plan-fields"
import { ApprovalFlow } from "./workspace-panels"

export function PlanSections({
  section,
  plan,
  setPlan,
  context,
}: {
  section: Section
  plan: JourneyPlan
  setPlan: Dispatch<SetStateAction<JourneyPlan>>
  context: FieldContext
}) {
  const c = context.copy
  const patch = <K extends keyof JourneyPlan>(key: K, value: JourneyPlan[K]) =>
    setPlan((current) => ({ ...current, [key]: value }))
  const field = (
    id: keyof JourneyPlan,
    label: string,
    hint?: string,
    type?: string
  ) => (
    <PlanField
      id={id}
      label={label}
      value={String(plan[id])}
      onChange={(value) => patch(id, value as never)}
      hint={hint}
      type={type}
      context={context}
    />
  )
  const lock = c(
    "Available after verified company data is connected",
    "متاح بعد ربط بيانات الشركة المتحقق منها"
  )
  const optional = <Badge variant="secondary">{c("Optional", "اختياري")}</Badge>
  const removeButton = (label: string, remove: () => void) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={remove}
      aria-label={label}
    >
      <Trash2 data-icon="inline-start" />
    </Button>
  )

  if (section === "basics")
    return (
      <FieldGroup>
        <FieldGroup className="md:grid md:grid-cols-2">
          <PlanField
            id="companyId"
            label={c("Company", "الشركة")}
            value=""
            placeholder={lock}
            disabled
            context={context}
            hint={c(
              "No default company. Client-side workspace selection is not proof of membership.",
              "لا توجد شركة افتراضية. اختيار مساحة العمل في المتصفح لا يثبت العضوية."
            )}
          />
          <PlanField
            id="businessUnitId"
            label={c("Business unit / branch", "وحدة الأعمال / الفرع")}
            value=""
            placeholder={lock}
            disabled
            context={context}
          />
        </FieldGroup>
        <FieldSet>
          <FieldLegend>{c("Transport service", "خدمة النقل")}</FieldLegend>
          <FieldDescription>
            {c(
              "Combine services when needed. Journey characteristics are independent.",
              "يمكن دمج الخدمات. خصائص الرحلة مستقلة عن نوع الخدمة."
            )}
          </FieldDescription>
          <FieldGroup className="md:grid md:grid-cols-3">
            {(
              [
                ["passengers", c("Passengers", "نقل ركاب")],
                ["goods", c("Goods", "نقل بضائع")],
                ["equipment", c("Equipment", "نقل معدات")],
              ] as [Service, string][]
            ).map(([value, label]) => (
              <Field key={value} orientation="horizontal">
                <Checkbox
                  id={`jt-service-${value}`}
                  checked={plan.services.includes(value)}
                  onCheckedChange={(checked) =>
                    patch(
                      "services",
                      checked
                        ? [...plan.services, value]
                        : plan.services.filter((item) => item !== value)
                    )
                  }
                />
                <FieldLabel htmlFor={`jt-service-${value}`}>{label}</FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        <PlanChoice
          id="scope"
          label={c("Operating area", "نطاق التشغيل")}
          value={plan.scope}
          onChange={(value) => patch("scope", value as JourneyPlan["scope"])}
          options={[
            { value: "internal", label: c("Internal / local", "داخلي / محلي") },
            { value: "intercity", label: c("Intercity", "بين المدن") },
          ]}
          placeholder={c("Choose an operating area", "اختر نطاق التشغيل")}
          context={context}
        />
        <FieldSet>
          <FieldLegend>
            {c("Journey characteristics", "خصائص الرحلة")}
          </FieldLegend>
          <FieldGroup>
            {(
              [
                ["roundTrip", c("Round trip", "ذهاب وعودة")],
                ["multiStop", c("Multiple stops", "متعدد المحطات")],
                ["emergency", c("Emergency request", "طلب طارئ")],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} orientation="horizontal">
                <Checkbox
                  id={`jt-${key}`}
                  checked={plan[key]}
                  onCheckedChange={(checked) =>
                    setPlan((current) => {
                      let stops = current.stops
                      if (key === "roundTrip")
                        stops = checked
                          ? [
                              ...stops,
                              {
                                id: "return",
                                name: stops[0]?.name ?? "",
                                kind: "return",
                              },
                            ]
                          : stops.filter((stop) => stop.kind !== "return")
                      return { ...current, [key]: Boolean(checked), stops }
                    })
                  }
                />
                <FieldLabel htmlFor={`jt-${key}`}>{label}</FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        {field("purpose", c("Journey purpose", "الغرض من الرحلة"))}
        {plan.emergency &&
          field(
            "emergencyReason",
            c("Emergency reason", "سبب الطوارئ"),
            c(
              "Emergency status never bypasses either approval stage.",
              "حالة الطوارئ لا تتجاوز أي مرحلة من مرحلتي الموافقة."
            )
          )}
        <PlanField
          id="notes"
          label={c("Additional context", "ملاحظات إضافية")}
          value={plan.notes}
          multiline
          onChange={(value) => patch("notes", value)}
          context={context}
        />
      </FieldGroup>
    )

  if (section === "schedule")
    return (
      <FieldGroup>
        <Alert>
          <CircleHelp />
          <AlertTitle>
            {c(
              "No assumed time zone or night cutoff",
              "لا منطقة زمنية أو حد ليلي مفترض"
            )}
          </AlertTitle>
          <AlertDescription>
            {c(
              "The company must approve its time zone and night-driving window. This preview cannot determine a final night-driving classification.",
              "يلزم اعتماد المنطقة الزمنية وفترة القيادة الليلية للشركة. لا تحدد المعاينة تصنيفًا ليليًا نهائيًا."
            )}
          </AlertDescription>
        </Alert>
        {field(
          "timezone",
          c("IANA time zone", "المنطقة الزمنية بصيغة IANA"),
          c(
            "Enter a proposed zone for local validation only. Company policy is not configured.",
            "أدخل منطقة مقترحة لفحص المدخلات فقط. سياسة الشركة لم تُضبط بعد."
          )
        )}
        <FieldGroup className="md:grid md:grid-cols-2">
          {field(
            "startLocal",
            c("Planned departure", "المغادرة المخططة"),
            undefined,
            "datetime-local"
          )}
          {field(
            "endLocal",
            c("Planned end / return", "النهاية / العودة المخططة"),
            undefined,
            "datetime-local"
          )}
        </FieldGroup>
        <p className="text-sm leading-6 text-muted-foreground">
          {c(
            "The full window includes stops, rest periods and the return leg. Reservation conflicts and document expiry will be checked again before departure.",
            "تشمل الفترة المحطات والراحة ومقطع العودة. سيعاد فحص تعارض الحجز وصلاحية الوثائق قبل المغادرة."
          )}
        </p>
      </FieldGroup>
    )

  if (section === "route")
    return (
      <FieldGroup>
        <p className="text-sm leading-6 text-muted-foreground">
          {c(
            "Plan the route manually. No map, geocoding or live tracking service is enabled.",
            "خطط المسار يدويًا. لا توجد خرائط أو خدمة ترميز جغرافي أو تتبع مباشر مفعلة."
          )}
        </p>
        {plan.stops.map((stop, index) => (
          <FieldGroup key={stop.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {stop.kind === "origin"
                  ? c("Origin", "الانطلاق")
                  : stop.kind === "return"
                    ? c("Return", "العودة")
                    : stop.kind === "destination"
                      ? c("Destination", "الوجهة")
                      : `${c("Stop", "محطة")} ${index}`}
              </Badge>
              {stop.kind === "stop" &&
                removeButton(c("Remove stop", "حذف المحطة"), () =>
                  patch(
                    "stops",
                    plan.stops.filter((item) => item.id !== stop.id)
                  )
                )}
            </div>
            <PlanField
              id={`stop-${stop.id}`}
              label={c("Site / location", "الموقع / المكان")}
              value={stop.name}
              disabled={stop.kind === "return"}
              onChange={(value) =>
                patch(
                  "stops",
                  plan.stops.map((item) =>
                    item.id === stop.id ||
                    (stop.kind === "origin" && item.kind === "return")
                      ? { ...item, name: value }
                      : item
                  )
                )
              }
              context={context}
            />
          </FieldGroup>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={!plan.multiStop || plan.stops.length >= 30}
          onClick={() => {
            const stops = [...plan.stops]
            const destination = stops.findIndex(
              (stop) => stop.kind === "destination"
            )
            stops.splice(destination < 0 ? stops.length : destination, 0, {
              id: crypto.randomUUID(),
              name: "",
              kind: "stop",
            })
            patch("stops", stops)
          }}
        >
          <Plus data-icon="inline-start" />
          {c("Add intermediate stop", "إضافة محطة وسيطة")}
        </Button>
        {!plan.multiStop && (
          <FieldDescription>
            {c(
              "Enable Multiple stops in Journey details to add stops.",
              "فعّل متعدد المحطات في تفاصيل الرحلة لإضافة محطات."
            )}
          </FieldDescription>
        )}
        {context.issues
          .filter((issue) => issue.field === "stops")
          .map((issue) => (
            <p
              role="alert"
              key={issue.code}
              className="text-sm text-destructive"
            >
              {c(issue.message.en, issue.message.ar)}
            </p>
          ))}
      </FieldGroup>
    )

  if (section === "resources")
    return (
      <FieldGroup>
        <Alert>
          <LockKeyhole />
          <AlertTitle>
            {c(
              "Unverified resources stay unassignable",
              "الموارد غير المتحقق منها غير قابلة للإسناد"
            )}
          </AlertTitle>
          <AlertDescription>
            {c(
              "Driver and vehicle lists are intentionally not read from unscoped legacy queries. Ownership, eligibility, full-window documents and conflicts must be verified server-side first.",
              "لا تُقرأ قوائم الموارد من الاستعلامات القديمة غير المعزولة. يجب التحقق من الملكية والأهلية والوثائق طوال الرحلة والتعارضات على الخادم أولًا."
            )}
          </AlertDescription>
        </Alert>
        <PlanField
          id="driverId"
          label={c("Primary driver", "السائق الأساسي")}
          value=""
          placeholder={lock}
          disabled
          context={context}
        />
        <PlanField
          id="secondDriverId"
          label={c("Second driver · optional", "السائق الثاني · اختياري")}
          value=""
          placeholder={lock}
          disabled
          context={context}
        />
        <PlanField
          id="vehicleId"
          label={c("Vehicle", "المركبة")}
          value=""
          placeholder={lock}
          disabled
          context={context}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          {c(
            "Required readiness checks: driving licence, registration, insurance, technical inspection and company ownership. Missing capacity or weight limits remain unknown, never zero.",
            "فحوص الجاهزية: رخصة القيادة والتسجيل والتأمين والفحص الفني وملكية الشركة. السعات وحدود الأوزان المفقودة تظل غير معروفة وليست صفرًا."
          )}
        </p>
      </FieldGroup>
    )

  if (section === "passengers")
    return (
      <FieldGroup>
        <div className="flex items-center justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            {c(
              "Optional manifest; names entered here are unsaved.",
              "كشف اختياري؛ الأسماء المدخلة هنا غير محفوظة."
            )}
          </p>
          {optional}
        </div>
        {plan.passengers.map((passenger, index) => (
          <FieldGroup key={passenger.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {c("Passenger", "راكب")} {index + 1}
              </p>
              {removeButton(c("Remove passenger", "حذف الراكب"), () =>
                patch(
                  "passengers",
                  plan.passengers.filter((item) => item.id !== passenger.id)
                )
              )}
            </div>
            <PlanField
              id={`passenger-${passenger.id}-name`}
              label={c("Full name", "الاسم الكامل")}
              value={passenger.name}
              onChange={(value) =>
                patch(
                  "passengers",
                  plan.passengers.map((item) =>
                    item.id === passenger.id ? { ...item, name: value } : item
                  )
                )
              }
              context={context}
            />
            <PlanField
              id={`passenger-${passenger.id}-reference`}
              label={c(
                "Passenger reference · optional",
                "مرجع الراكب · اختياري"
              )}
              value={passenger.reference}
              onChange={(value) =>
                patch(
                  "passengers",
                  plan.passengers.map((item) =>
                    item.id === passenger.id
                      ? { ...item, reference: value }
                      : item
                  )
                )
              }
              context={context}
            />
          </FieldGroup>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={
            !plan.services.includes("passengers") ||
            plan.passengers.length >= 100
          }
          onClick={() =>
            patch("passengers", [
              ...plan.passengers,
              { id: crypto.randomUUID(), name: "", reference: "" },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          {c("Add passenger", "إضافة راكب")}
        </Button>
        {!plan.services.includes("passengers") && (
          <FieldDescription>
            {c(
              "Select the Passengers service to add a manifest.",
              "اختر خدمة نقل الركاب لإضافة كشف الركاب."
            )}
          </FieldDescription>
        )}
      </FieldGroup>
    )

  if (section === "cargo")
    return (
      <FieldGroup>
        <div className="flex items-center justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            {c(
              "Cargo details are optional. Unknown weight remains blank.",
              "تفاصيل الحمولة اختيارية. اترك الوزن غير المعروف فارغًا."
            )}
          </p>
          {optional}
        </div>
        {plan.cargo.map((item, index) => (
          <FieldGroup key={item.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {c("Load item", "عنصر حمولة")} {index + 1}
              </p>
              {removeButton(c("Remove load item", "حذف عنصر الحمولة"), () =>
                patch(
                  "cargo",
                  plan.cargo.filter((row) => row.id !== item.id)
                )
              )}
            </div>
            {(
              [
                ["description", c("Description", "الوصف")],
                ["quantity", c("Quantity", "الكمية")],
                ["unit", c("Unit", "الوحدة")],
                [
                  "weightKg",
                  c("Weight (kg) · optional", "الوزن (كجم) · اختياري"),
                ],
              ] as const
            ).map(([key, label]) => (
              <PlanField
                key={key}
                id={`cargo-${item.id}-${key}`}
                label={label}
                value={item[key]}
                onChange={(value) =>
                  patch(
                    "cargo",
                    plan.cargo.map((row) =>
                      row.id === item.id ? { ...row, [key]: value } : row
                    )
                  )
                }
                inputMode={
                  key === "quantity" || key === "weightKg" ? "decimal" : "text"
                }
                context={context}
              />
            ))}
          </FieldGroup>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={
            !plan.services.some(
              (service) => service === "goods" || service === "equipment"
            ) || plan.cargo.length >= 100
          }
          onClick={() =>
            patch("cargo", [
              ...plan.cargo,
              {
                id: crypto.randomUUID(),
                description: "",
                quantity: "",
                unit: "",
                weightKg: "",
              },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          {c("Add load item", "إضافة عنصر حمولة")}
        </Button>
        <FieldDescription>
          {c(
            "Select Goods or Equipment to add items. Any material load-safety change after approval will require reapproval.",
            "اختر البضائع أو المعدات لإضافة عناصر. تغيير سلامة الحمولة بعد الاعتماد يستلزم إعادة الموافقة."
          )}
        </FieldDescription>
      </FieldGroup>
    )

  if (section === "safety")
    return (
      <FieldGroup>
        <Alert>
          <ShieldCheck />
          <AlertTitle>
            {c(
              "Safety clearance is not yet configured",
              "تصريح السلامة غير مضبوط بعد"
            )}
          </AlertTitle>
          <AlertDescription>
            {c(
              "Inspection templates, fatigue limits, risk scoring and check-in policies require company approval. Entering notes does not mark the journey safe or approved.",
              "نماذج الفحص وحدود الإرهاق وتقييم المخاطر وسياسات التواصل تتطلب اعتماد الشركة. إدخال الملاحظات لا يجعل الرحلة آمنة أو معتمدة."
            )}
          </AlertDescription>
        </Alert>
        <PlanField
          id="hazards"
          label={c(
            "Weather, road and route hazards",
            "مخاطر الطقس والطريق والمسار"
          )}
          value={plan.hazards}
          onChange={(value) => patch("hazards", value)}
          multiline
          context={context}
        />
        <PlanField
          id="controls"
          label={c(
            "Proposed controls & rest plan",
            "الضوابط المقترحة وخطة الراحة"
          )}
          value={plan.controls}
          onChange={(value) => patch("controls", value)}
          multiline
          context={context}
        />
        {field(
          "nightReason",
          c(
            "Night-driving justification · if applicable",
            "مبرر القيادة الليلية · إن انطبق"
          )
        )}
        {field(
          "emergencyContact",
          c("Emergency contact · optional", "جهة اتصال الطوارئ · اختياري")
        )}
        <p className="text-sm leading-6 text-muted-foreground">
          {c(
            "Planned execution: check-in, safe-stop suspension, incident reporting and controlled closure. No active monitoring or emergency dispatch is provided by this preview.",
            "التشغيل المخطط: تسجيل التواصل والتعليق بعد التوقف الآمن والإبلاغ عن الحوادث والإغلاق المنضبط. المعاينة لا توفر مراقبة نشطة أو إرسال طوارئ."
          )}
        </p>
      </FieldGroup>
    )

  if (section === "attachments")
    return (
      <FieldGroup>
        <Alert>
          <Paperclip />
          <AlertTitle>
            {c(
              "Private storage awaits activation",
              "التخزين الخاص بانتظار التفعيل"
            )}
          </AlertTitle>
          <AlertDescription>
            {c(
              "No file can be uploaded or shared in this code-only phase. Operational uploads will require a verified company, access-checked downloads, MIME validation and explicit storage approval.",
              "لا يُرفع أو يُشارك أي ملف في مرحلة الكود فقط. الرفع التشغيلي يتطلب شركة متحققًا منها وتنزيلًا محميًا وفحص نوع الملف وموافقة التخزين."
            )}
          </AlertDescription>
        </Alert>
        <PlanField
          id="attachment"
          label={c("Journey documents · optional", "مستندات الرحلة · اختيارية")}
          value=""
          placeholder={c(
            "Uploads disabled — no storage writes",
            "الرفع معطّل — لا كتابة في التخزين"
          )}
          disabled
          context={context}
        />
      </FieldGroup>
    )

  if (section === "costs")
    return (
      <FieldGroup>
        <div className="flex items-center justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            {c(
              "Optional estimates and actual entries, grouped by currency. No invoice or payment is created.",
              "تقديرات ومصاريف فعلية اختيارية مجمعة حسب العملة. لا تُنشأ فاتورة أو عملية دفع."
            )}
          </p>
          {optional}
        </div>
        {plan.expenses.map((expense, index) => (
          <FieldGroup key={expense.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {c("Cost / fuel entry", "مصروف / وقود")} {index + 1}
              </p>
              {removeButton(c("Remove cost entry", "حذف المصروف"), () =>
                patch(
                  "expenses",
                  plan.expenses.filter((item) => item.id !== expense.id)
                )
              )}
            </div>
            <PlanField
              id={`expense-${expense.id}-description`}
              label={c("Description", "الوصف")}
              value={expense.description}
              onChange={(value) =>
                patch(
                  "expenses",
                  plan.expenses.map((item) =>
                    item.id === expense.id
                      ? { ...item, description: value }
                      : item
                  )
                )
              }
              context={context}
            />
            <PlanChoice
              id={`expense-${expense.id}-kind`}
              label={c("Entry type", "نوع القيد")}
              value={expense.kind}
              onChange={(value) =>
                patch(
                  "expenses",
                  plan.expenses.map((item) =>
                    item.id === expense.id
                      ? { ...item, kind: value as typeof expense.kind }
                      : item
                  )
                )
              }
              placeholder={c("Choose type", "اختر النوع")}
              options={[
                { value: "estimated", label: c("Estimated", "تقديري") },
                { value: "actual", label: c("Actual", "فعلي") },
              ]}
              context={context}
            />
            <FieldGroup className="md:grid md:grid-cols-2">
              <PlanField
                id={`expense-${expense.id}-amount`}
                label={c("Amount", "المبلغ")}
                value={expense.amount}
                onChange={(value) =>
                  patch(
                    "expenses",
                    plan.expenses.map((item) =>
                      item.id === expense.id ? { ...item, amount: value } : item
                    )
                  )
                }
                inputMode="decimal"
                context={context}
              />
              <PlanField
                id={`expense-${expense.id}-currency`}
                label={c(
                  "Currency code · unverified",
                  "رمز العملة · غير معتمد"
                )}
                value={expense.currency}
                maxLength={3}
                onChange={(value) =>
                  patch(
                    "expenses",
                    plan.expenses.map((item) =>
                      item.id === expense.id
                        ? { ...item, currency: value.toUpperCase() }
                        : item
                    )
                  )
                }
                context={context}
              />
            </FieldGroup>
          </FieldGroup>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={plan.expenses.length >= 100}
          onClick={() =>
            patch("expenses", [
              ...plan.expenses,
              {
                id: crypto.randomUUID(),
                description: "",
                amount: "",
                currency: "",
                kind: "estimated",
              },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          {c("Add cost or fuel entry", "إضافة مصروف أو وقود")}
        </Button>
        <div className="flex flex-col gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
          <p className="font-medium">
            {c(
              "Entered subtotals · not reviewed",
              "المجاميع المدخلة · غير مراجعة"
            )}
          </p>
          {costSubtotals(plan.expenses).length ? (
            costSubtotals(plan.expenses).map((total) => (
              <p key={`${total.kind}-${total.currency}`} className="text-sm">
                <bdi className="font-mono">
                  {total.amount} {total.currency}
                </bdi>{" "}
                ·{" "}
                {total.kind === "estimated"
                  ? c("Estimated", "تقديري")
                  : c("Actual", "فعلي")}
              </p>
            ))
          ) : (
            <p className="text-sm">
              {c("Not entered — not zero", "لم يُدخل — ليس صفرًا")}
            </p>
          )}
          <p className="text-sm leading-6">
            {c(
              "Invalid rows are excluded. Currency codes and allowed precision require policy verification before saving. Currencies are never combined.",
              "تُستبعد الصفوف غير الصالحة. اعتماد رموز العملات والدقة المسموح بها يسبق الحفظ. لا تُجمع العملات المختلفة."
            )}
          </p>
        </div>
      </FieldGroup>
    )

  return (
    <div className="flex flex-col gap-6">
      <ApprovalFlow copy={c} />
      <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        {[
          [c("Purpose", "الغرض"), plan.purpose],
          [
            c("Operating area", "نطاق التشغيل"),
            plan.scope === "internal"
              ? c("Internal", "داخلي")
              : plan.scope === "intercity"
                ? c("Intercity", "بين المدن")
                : "",
          ],
          [c("Departure", "المغادرة"), plan.startLocal],
          [
            c("Time zone · proposed", "المنطقة الزمنية · مقترحة"),
            plan.timezone,
          ],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="break-words text-sm font-medium">
              {value || c("Not entered", "لم يُدخل")}
            </dd>
          </div>
        ))}
      </dl>
      <Alert>
        <LockKeyhole />
        <AlertTitle>
          {c("Review only — no submission", "مراجعة فقط — دون إرسال")}
        </AlertTitle>
        <AlertDescription>
          {c(
            "HSE review must precede a separate management approval, on the same revision. Emergency status and optional data do not bypass the approval chain. Saving, sending and departure remain disabled until server-side gates are implemented and approved.",
            "تسبق مراجعة السلامة موافقة إدارية منفصلة على الإصدار نفسه. لا تتجاوز الطوارئ أو البيانات الاختيارية سلسلة الموافقات. يظل الحفظ والإرسال والانطلاق معطلًا حتى تنفيذ واعتماد بوابات الخادم."
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
