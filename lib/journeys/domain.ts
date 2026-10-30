export const services = ["passengers", "goods", "equipment"] as const
export type Service = (typeof services)[number]
export const sections = [
  "basics",
  "schedule",
  "route",
  "resources",
  "passengers",
  "cargo",
  "safety",
  "attachments",
  "costs",
  "review",
] as const
export type Section = (typeof sections)[number]
export type Localized = { en: string; ar: string }
export type Stop = {
  id: string
  name: string
  kind: "origin" | "destination" | "stop" | "return"
}
export type Passenger = { id: string; name: string; reference: string }
export type CargoItem = {
  id: string
  description: string
  quantity: string
  unit: string
  weightKg: string
}
export type Expense = {
  id: string
  description: string
  amount: string
  currency: string
  kind: "estimated" | "actual"
}
export type JourneyPlan = {
  companyId: string
  businessUnitId: string
  services: Service[]
  scope: "internal" | "intercity" | ""
  roundTrip: boolean
  multiStop: boolean
  emergency: boolean
  purpose: string
  emergencyReason: string
  startLocal: string
  endLocal: string
  timezone: string
  driverId: string
  secondDriverId: string
  vehicleId: string
  stops: Stop[]
  passengers: Passenger[]
  cargo: CargoItem[]
  expenses: Expense[]
  hazards: string
  controls: string
  nightReason: string
  emergencyContact: string
  notes: string
}
export type PlanIssue = {
  section: Section
  field: string
  message: Localized
  code: string
}

export function createJourneyPlan(): JourneyPlan {
  return {
    companyId: "",
    businessUnitId: "",
    services: [],
    scope: "",
    roundTrip: false,
    multiStop: false,
    emergency: false,
    purpose: "",
    emergencyReason: "",
    startLocal: "",
    endLocal: "",
    timezone: "",
    driverId: "",
    secondDriverId: "",
    vehicleId: "",
    stops: [
      { id: "origin", name: "", kind: "origin" },
      { id: "destination", name: "", kind: "destination" },
    ],
    passengers: [],
    cargo: [],
    expenses: [],
    hazards: "",
    controls: "",
    nightReason: "",
    emergencyContact: "",
    notes: "",
  }
}

export function isTimezone(value: string): boolean {
  if (!value.trim()) return false
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0)
    return true
  } catch {
    return false
  }
}

export type WallTime =
  | { state: "valid"; instant: number }
  | { state: "invalid" | "ambiguous" | "missing-zone" }

export function resolveWallTime(value: string, timezone: string): WallTime {
  if (!isTimezone(timezone)) return { state: "missing-zone" }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return { state: "invalid" }
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  )
    return { state: "invalid" }
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const date = new Date(wall)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return { state: "invalid" }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const localEpoch = (instant: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((part) => [part.type, part.value])
    )
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute)
    )
  }
  // Both sides of a clock change are checked; gaps and repeated wall times are never silently resolved.
  const offsets = new Set<number>()
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = wall + hours * 3_600_000
    offsets.add(localEpoch(sample) - sample)
  }
  const candidates = [...offsets]
    .map((offset) => wall - offset)
    .filter((instant) => localEpoch(instant) === wall)
  if (candidates.length !== 1)
    return { state: candidates.length ? "ambiguous" : "invalid" }
  return { state: "valid", instant: candidates[0] }
}

export function validatePlan(
  plan: JourneyPlan,
  stage: "draft" | "submission" = "submission"
): PlanIssue[] {
  const issues: PlanIssue[] = []
  const issue = (
    section: Section,
    field: string,
    code: string,
    en: string,
    ar: string
  ) => issues.push({ section, field, code, message: { en, ar } })
  if (stage === "submission") {
    if (!plan.companyId)
      issue(
        "basics",
        "companyId",
        "company",
        "A server-verified company scope is required.",
        "يلزم نطاق شركة متحقق منه على الخادم."
      )
    if (!plan.businessUnitId)
      issue(
        "basics",
        "businessUnitId",
        "unit",
        "Select an authorized business unit.",
        "اختر وحدة أعمال مصرحًا بها."
      )
    if (!plan.services.length)
      issue(
        "basics",
        "services",
        "service",
        "Choose at least one service.",
        "اختر خدمة واحدة على الأقل."
      )
    if (!plan.scope)
      issue(
        "basics",
        "scope",
        "scope",
        "Select the operating area.",
        "اختر نطاق التشغيل."
      )
    if (!plan.purpose.trim())
      issue(
        "basics",
        "purpose",
        "purpose",
        "Describe the purpose of this journey.",
        "أدخل الغرض من الرحلة."
      )
    if (!plan.startLocal)
      issue(
        "schedule",
        "startLocal",
        "start",
        "Enter the planned departure.",
        "أدخل موعد المغادرة المخطط."
      )
    if (!plan.endLocal)
      issue(
        "schedule",
        "endLocal",
        "end",
        "Enter the planned end, including the return leg.",
        "أدخل النهاية المخططة بما يشمل مقطع العودة."
      )
    if (!isTimezone(plan.timezone))
      issue(
        "schedule",
        "timezone",
        "timezone",
        "A verified company time zone is required; none is assumed.",
        "تلزم منطقة زمنية معتمدة للشركة؛ لا توجد قيمة مفترضة."
      )
    if (!plan.driverId)
      issue(
        "resources",
        "driverId",
        "driver",
        "A verified, company-owned driver must be assigned.",
        "يلزم إسناد سائق متحقق من أهليته وملكيته للشركة."
      )
    if (!plan.vehicleId)
      issue(
        "resources",
        "vehicleId",
        "vehicle",
        "A verified, company-owned vehicle must be assigned.",
        "يلزم إسناد مركبة متحقق من أهليتها وملكيتها للشركة."
      )
    if (
      plan.stops.length < 2 ||
      !plan.stops[0]?.name.trim() ||
      !plan.stops.at(-1)?.name.trim()
    )
      issue(
        "route",
        "stops",
        "route",
        "Enter the origin and final destination.",
        "أدخل نقطة الانطلاق والوجهة النهائية."
      )
    if (
      plan.multiStop &&
      plan.stops.filter((stop) => stop.kind === "stop").length === 0
    )
      issue(
        "route",
        "stops",
        "multi-stop",
        "Add at least one intermediate stop.",
        "أضف محطة وسيطة واحدة على الأقل."
      )
    if (
      plan.roundTrip &&
      (plan.stops.at(-1)?.kind !== "return" ||
        plan.stops.at(-1)?.name.trim() !== plan.stops[0]?.name.trim())
    )
      issue(
        "route",
        "stops",
        "return",
        "The final return stop must match the origin.",
        "يجب أن تطابق محطة العودة الأخيرة نقطة الانطلاق."
      )
    if (plan.stops.some((stop) => !stop.name.trim()))
      issue(
        "route",
        "stops",
        "stop-name",
        "Name every planned stop or remove unused stops.",
        "سمِّ كل محطة مخططة أو احذف المحطات غير المستخدمة."
      )
    if (plan.emergency && !plan.emergencyReason.trim())
      issue(
        "basics",
        "emergencyReason",
        "emergency",
        "An emergency needs a reason, not an approval bypass.",
        "الطوارئ تتطلب سببًا ولا تتجاوز الموافقات."
      )
  }
  if (
    plan.services.some((service) => !services.includes(service)) ||
    new Set(plan.services).size !== plan.services.length
  )
    issue(
      "basics",
      "services",
      "invalid-service",
      "Invalid or duplicate service selection.",
      "اختيار خدمة غير صالح أو مكرر."
    )
  if (!["", "internal", "intercity"].includes(plan.scope))
    issue(
      "basics",
      "scope",
      "invalid-scope",
      "Invalid operating area.",
      "نطاق التشغيل غير صالح."
    )
  if (plan.secondDriverId && plan.secondDriverId === plan.driverId)
    issue(
      "resources",
      "secondDriverId",
      "same-driver",
      "The second driver must be a different person.",
      "يجب أن يكون السائق الثاني شخصًا مختلفًا."
    )
  for (const [field, value] of [
    ["startLocal", plan.startLocal],
    ["endLocal", plan.endLocal],
  ] as const) {
    if (value && isTimezone(plan.timezone)) {
      const resolved = resolveWallTime(value, plan.timezone)
      if (resolved.state !== "valid")
        issue(
          "schedule",
          field,
          "wall-time",
          resolved.state === "ambiguous"
            ? "This clock time occurs twice. Choose an unambiguous time."
            : "This date or clock time does not exist in the selected zone.",
          resolved.state === "ambiguous"
            ? "يتكرر هذا التوقيت بسبب تغيير الساعة. اختر توقيتًا غير ملتبس."
            : "هذا التاريخ أو التوقيت غير موجود في المنطقة المختارة."
        )
    }
  }
  if (plan.startLocal && plan.endLocal && isTimezone(plan.timezone)) {
    const start = resolveWallTime(plan.startLocal, plan.timezone)
    const end = resolveWallTime(plan.endLocal, plan.timezone)
    if (
      start.state === "valid" &&
      end.state === "valid" &&
      end.instant <= start.instant
    )
      issue(
        "schedule",
        "endLocal",
        "end-before-start",
        "The planned end must be after departure.",
        "يجب أن تكون النهاية المخططة بعد المغادرة."
      )
  }
  if (plan.passengers.length && !plan.services.includes("passengers"))
    issue(
      "passengers",
      "passengers",
      "passenger-service",
      "Passenger rows require the Passengers service.",
      "صفوف الركاب تتطلب خدمة نقل الركاب."
    )
  for (const passenger of plan.passengers)
    if (!passenger.name.trim())
      issue(
        "passengers",
        `passenger-${passenger.id}-name`,
        "passenger-name",
        "Name this passenger or remove the optional row.",
        "أدخل اسم الراكب أو احذف الصف الاختياري."
      )
  if (
    plan.cargo.length &&
    !plan.services.some(
      (service) => service === "goods" || service === "equipment"
    )
  )
    issue(
      "cargo",
      "cargo",
      "cargo-service",
      "Load rows require Goods or Equipment service.",
      "صفوف الحمولة تتطلب خدمة نقل البضائع أو المعدات."
    )
  for (const item of plan.cargo) {
    if (!item.description.trim())
      issue(
        "cargo",
        `cargo-${item.id}-description`,
        "cargo-description",
        "Describe this load item or remove the optional row.",
        "صف عنصر الحمولة أو احذف الصف الاختياري."
      )
    if (item.quantity && !positiveDecimal(item.quantity))
      issue(
        "cargo",
        `cargo-${item.id}-quantity`,
        "cargo-quantity",
        "An entered cargo quantity must be positive.",
        "كمية البضاعة المدخلة يجب أن تكون موجبة."
      )
    if (item.weightKg && !positiveDecimal(item.weightKg))
      issue(
        "cargo",
        `cargo-${item.id}-weightKg`,
        "cargo-weight",
        "An entered weight must be positive; blank means unknown.",
        "الوزن المدخل يجب أن يكون موجبًا؛ الفراغ يعني غير معروف."
      )
  }
  for (const expense of plan.expenses) {
    if (!expense.description.trim())
      issue(
        "costs",
        `expense-${expense.id}-description`,
        "expense-description",
        "Describe the entered cost, or remove this optional row.",
        "صف المصروف المدخل أو احذف هذا الصف الاختياري."
      )
    if (!positiveDecimal(expense.amount))
      issue(
        "costs",
        `expense-${expense.id}-amount`,
        "expense-amount",
        "Enter a positive amount with up to three decimal places.",
        "أدخل مبلغًا موجبًا حتى ثلاث منازل عشرية."
      )
    if (!/^[A-Z]{3}$/.test(expense.currency))
      issue(
        "costs",
        `expense-${expense.id}-currency`,
        "expense-currency",
        "Enter a three-letter currency code; approval of the currency is separate.",
        "أدخل رمز عملة من ثلاثة أحرف؛ اعتماد العملة إجراء منفصل."
      )
  }
  return issues
}

export function positiveDecimal(value: string): boolean {
  return (
    /^\d+(\.\d{1,3})?$/.test(value) && /[1-9]/.test(value) && value.length <= 18
  )
}

export function costSubtotals(
  expenses: Expense[]
): { currency: string; kind: Expense["kind"]; amount: string }[] {
  const totals = new Map<string, bigint>()
  for (const expense of expenses) {
    if (
      !positiveDecimal(expense.amount) ||
      !/^[A-Z]{3}$/.test(expense.currency)
    )
      continue
    const [whole, fraction = ""] = expense.amount.split(".")
    const amount =
      BigInt(whole) * BigInt(1000) + BigInt(fraction.padEnd(3, "0"))
    const key = `${expense.kind}:${expense.currency}`
    totals.set(key, (totals.get(key) ?? BigInt(0)) + amount)
  }
  return [...totals].map(([key, total]) => {
    const [kind, currency] = key.split(":")
    const fraction = (total % BigInt(1000)).toString().padStart(3, "0")
    return {
      currency,
      kind: kind as Expense["kind"],
      amount: `${total / BigInt(1000)}.${fraction.endsWith("0") ? fraction.slice(0, 2) : fraction}`,
    }
  })
}
