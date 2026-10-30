import type { Localized, Section } from "@/lib/journeys/domain"

export type Copy = (en: string, ar: string) => string
export const sectionLabels: Record<Section, Localized> = {
  basics: { en: "Journey details", ar: "تفاصيل الرحلة" },
  schedule: { en: "Schedule", ar: "الجدول الزمني" },
  route: { en: "Route & stops", ar: "المسار والمحطات" },
  resources: { en: "Driver & vehicle", ar: "السائق والمركبة" },
  passengers: { en: "Passengers", ar: "الركاب" },
  cargo: { en: "Cargo & equipment", ar: "البضائع والمعدات" },
  safety: { en: "Safety & emergency", ar: "السلامة والطوارئ" },
  attachments: { en: "Attachments", ar: "المرفقات" },
  costs: { en: "Costs & fuel", ar: "التكاليف والوقود" },
  review: { en: "Review & approvals", ar: "المراجعة والموافقات" },
}
export const tabLabels = {
  overview: { en: "Overview", ar: "نظرة عامة" },
  journeys: { en: "Journeys", ar: "الرحلات" },
  approvals: { en: "Approvals", ar: "الموافقات" },
  resources: { en: "Resources", ar: "الموارد" },
  locations: { en: "Locations", ar: "المواقع" },
  costs: { en: "Costs", ar: "التكاليف" },
  reports: { en: "Reports", ar: "التقارير" },
  readiness: { en: "Activation", ar: "التفعيل" },
} satisfies Record<string, Localized>
export type WorkspaceTab = keyof typeof tabLabels
export const activationGates = [
  {
    id: "G03",
    title: { en: "Company-scoped schema", ar: "مخطط معزول بالشركة" },
    description: {
      en: "Approve additive schema changes, reservation constraints and rollback before database changes.",
      ar: "اعتماد إضافات المخطط وقيود الحجز وخطة الرجوع قبل تغيير قاعدة البيانات.",
    },
  },
  {
    id: "G04",
    title: { en: "Resource ownership", ar: "ملكية الموارد" },
    description: {
      en: "Verify existing drivers, vehicles, branches and historical records. Unknown ownership cannot be assigned.",
      ar: "مطابقة السائقين والمركبات والفروع والسجلات الحالية. المورد مجهول الملكية غير متاح للإسناد.",
    },
  },
  {
    id: "G05",
    title: { en: "Isolated data testing", ar: "اختبارات بيانات معزولة" },
    description: {
      en: "Authorize a separate test environment before creating records, documents or reservations.",
      ar: "التصريح ببيئة اختبار منفصلة قبل إنشاء سجلات أو مستندات أو حجوزات.",
    },
  },
  {
    id: "G08",
    title: {
      en: "Server identity & delegated access",
      ar: "هوية الخادم والتفويض",
    },
    description: {
      en: "Review shared access helpers, verify session-backed scope and configure separate HSE and management delegates.",
      ar: "مراجعة دوال الوصول المشتركة والتحقق من نطاق الجلسة وتعيين مفوضين منفصلين للسلامة والإدارة.",
    },
  },
  {
    id: "G06",
    title: { en: "Optional services", ar: "الخدمات الاختيارية" },
    description: {
      en: "Private files, mail, scheduled alerts, maps and GPS each need explicit activation. Manual routes need no map provider.",
      ar: "تفعيل منفصل للملفات الخاصة والبريد والتنبيهات والخرائط وGPS. المسار اليدوي لا يحتاج مزود خرائط.",
    },
  },
  {
    id: "G10",
    title: { en: "Release authorization", ar: "تفويض الإصدار" },
    description: {
      en: "Complete safety and isolation acceptance checks, then approve the exact target deployment.",
      ar: "إتمام قبول السلامة والعزل ثم اعتماد بيئة وإصدار النشر المحددين.",
    },
  },
]
