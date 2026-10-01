"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Language = "en" | "ar"

type LanguageContextValue = {
  language: Language
  isArabic: boolean
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (english: string) => string
}

const translations: Record<string, string> = {
  Home: "الرئيسية",
  "Performance Overview": "نظرة عامة على الأداء",
  Incidents: "الحوادث",
  Observations: "الملاحظات",
  "Inspection Reports": "تقارير التفتيش",
  "Inspection Types": "أنواع التفتيش",
  "Training Courses": "الدورات التدريبية",
  "Training Records": "سجلات التدريب",
  "Team Members": "أعضاء الفريق",
  "Business Units": "وحدات الأعمال",
  "Document Library": "مكتبة المستندات",
  "Company Management": "إدارة الشركات",
  "Journey Tracker": "متابعة الرحلات",
  Meetings: "الاجتماعات",
  Reports: "التقارير",
  "Ticket & Invoice Tracker": "متابعة التذاكر والفواتير",
  Overview: "نظرة عامة",
  Inspections: "التفتيش",
  Training: "التدريب",
  Settings: "الإعدادات",
  Workspace: "مساحة العمل",
  "All options": "كل الخيارات",
  "Hide list": "إخفاء القائمة",
  Options: "الخيارات",
  Search: "بحث",
  "Search...": "بحث...",
  "Switch to Arabic": "التبديل إلى العربية",
  "Switch to English": "التبديل إلى الإنجليزية",
  "New Journey": "رحلة جديدة",
  "Log Journey": "تسجيل رحلة",
  "Save Journey": "حفظ الرحلة",
  Cancel: "إلغاء",
  Save: "حفظ",
  Submit: "إرسال",
  Close: "إغلاق",
  Delete: "حذف",
  Edit: "تعديل",
  Add: "إضافة",
  Create: "إنشاء",
  Upload: "رفع",
  Download: "تنزيل",
  Refresh: "تحديث",
  Loading: "جارٍ التحميل",
  "Loading...": "جارٍ التحميل...",
  "No data found": "لم يتم العثور على بيانات",
  "No files found": "لم يتم العثور على ملفات",
  Drivers: "السائقون",
  Vehicles: "المركبات",
  Passengers: "الركاب",
  Destination: "الوجهة",
  "Journey date": "تاريخ الرحلة",
  "Departure time": "وقت المغادرة",
  "Return time": "وقت العودة",
  Purpose: "الغرض",
  Status: "الحالة",
  Active: "نشط",
  Pending: "قيد الانتظار",
  Completed: "مكتمل",
  Approved: "معتمد",
  Rejected: "مرفوض",
  Documents: "المستندات",
  "View Library": "عرض المكتبة",
  "Create Document": "إنشاء مستند",
  "Choose File": "اختيار ملف",
  "Upload File": "رفع ملف",
  Category: "الفئة",
  Description: "الوصف",
  Version: "الإصدار",
  "Review Date": "تاريخ المراجعة",
  "Expiry Date": "تاريخ الانتهاء",
  "View Details": "عرض التفاصيل",
  "Download File": "تنزيل الملف",
  "Manage Access": "إدارة الوصول",
  "Company is required": "الشركة مطلوبة",
  "Only Admin and Master users can manage library documents": "يمكن للمستخدمين المسؤولين والرئيسيين فقط إدارة مستندات المكتبة",
  "Permission denied": "تم رفض الإذن",
  "Journey Reports": "تقارير الرحلات",
  "Emergency Contacts": "جهات اتصال الطوارئ",
  "Risk Assessment": "تقييم المخاطر",
  "Route Plan": "خطة المسار",
  "Driver Details": "تفاصيل السائق",
  "Night Driving": "القيادة الليلية",
  Hazards: "المخاطر",
  Inspection: "التفتيش",
  "Business Unit": "وحدة الأعمال",
  "User Management": "إدارة المستخدمين",
  Profile: "الملف الشخصي",
  Logout: "تسجيل الخروج",
  Login: "تسجيل الدخول",
  Email: "البريد الإلكتروني",
  Password: "كلمة المرور",
  Name: "الاسم",
  Date: "التاريخ",
  Time: "الوقت",
  Actions: "الإجراءات",
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const isArabic = language === "ar"

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? "rtl" : "ltr"
    if (!isArabic) return

    const translatePage = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let node: Node | null
      while ((node = walker.nextNode())) nodes.push(node as Text)
      for (const textNode of nodes) {
        const value = textNode.nodeValue?.trim()
        if (!value || textNode.parentElement?.closest("script,style,textarea")) continue
        const translated = translations[value]
        if (translated) textNode.nodeValue = textNode.nodeValue!.replace(value, translated)
      }
      document.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]").forEach((element) => {
        for (const attribute of ["aria-label", "placeholder", "title"]) {
          const value = element.getAttribute(attribute)
          if (value && translations[value]) element.setAttribute(attribute, translations[value])
        }
      })
    }

    translatePage()
    const observer = new MutationObserver(() => translatePage())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isArabic, language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    isArabic,
    setLanguage: setLanguageState,
    toggleLanguage: () => setLanguageState((current) => current === "en" ? "ar" : "en"),
    t: (english) => isArabic ? translations[english] ?? english : english,
  }), [isArabic, language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}

export function translate(english: string) {
  return translations[english] ?? english
}
