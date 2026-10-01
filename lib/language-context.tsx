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
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const isArabic = language === "ar"

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? "rtl" : "ltr"
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
