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
  "Close options": "إغلاق الخيارات",
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
  "Operations workspace": "مساحة العمليات",
  "AMNKO HSE control center": "مركز تحكم AMNKO للصحة والسلامة والبيئة",
  "Select an option from the list to open each HSE module.": "اختر خياراً من القائمة لفتح وحدة الصحة والسلامة والبيئة.",
  "Health, Safety & Environment performance overview": "نظرة عامة على أداء الصحة والسلامة والبيئة",
  "Key Performance Indicators": "مؤشرات الأداء الرئيسية",
  "Incident Management": "إدارة الحوادث",
  "Behaviour Observations": "ملاحظات السلوك",
  "Company Document Library": "مكتبة مستندات الشركة",
  "Files for the active company": "ملفات الشركة النشطة",
  "Ticket and Invoice Tracker": "متابعة التذاكر والفواتير",
  "Privacy Policy": "سياسة الخصوصية",
  "Terms of Service": "شروط الخدمة",
  Support: "الدعم",
  "Journey Management": "إدارة الرحلات",
  "Near Misses Reported": "الحوادث الوشيكة المبلغ عنها",
  "Training Completion": "إتمام التدريب",
  "Inspection Compliance": "الالتزام بالتفتيش",
  "Days Without Incident": "أيام بدون حوادث",
  "good reporting": "إبلاغ جيد",
  target: "الهدف",
  "this month": "هذا الشهر",
  "vs last quarter": "مقارنة بالربع السابق",
  Total: "الإجمالي",
  Draft: "مسودة",
  "Pending Approval": "بانتظار الاعتماد",
  "High Risk": "مخاطر عالية",
  Cancelled: "ملغاة",
  "Incidents by Type": "الحوادث حسب النوع",
  "Distribution of incidents by category": "توزيع الحوادث حسب الفئة",
  "Incident Trends": "اتجاهات الحوادث",
  "Monthly incidents and near-miss reports over the past year": "الحوادث الشهرية وتقارير الحوادث الوشيكة خلال العام الماضي",
  "Reference No": "الرقم المرجعي",
  Title: "العنوان",
  Type: "النوع",
  Severity: "الخطورة",
  Location: "الموقع",
  Findings: "النتائج",
  Inspector: "المفتش",
  "Course Name": "اسم الدورة",
  Frequency: "التكرار",
  Employee: "الموظف",
  Course: "الدورة",
  "Completion Date": "تاريخ الإكمال",
  Manager: "المدير",
  Code: "الرمز",
  Companies: "الشركات",
  "Select company": "اختر الشركة",
  English: "الإنجليزية",
  Arabic: "العربية",
  "HEALTH · SAFETY · ENVIRONMENT": "الصحة · السلامة · البيئة",
  "Protect · Prevent · Improve": "احمِ · امنع · طوّر",
  "Welcome back": "مرحباً بعودتك",
  "Sign in to your account to continue": "سجّل الدخول إلى حسابك للمتابعة",
  "Email Address": "عنوان البريد الإلكتروني",
  "Forgot password?": "هل نسيت كلمة المرور؟",
  "Sign In": "تسجيل الدخول",
  "By signing in, you agree to our Terms of Service and Privacy Policy": "بتسجيل الدخول، فإنك توافق على شروط الخدمة وسياسة الخصوصية",
  "AMNKO | HSE Management System": "AMNKO | نظام إدارة الصحة والسلامة والبيئة",
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof document === "undefined") return "ar"
    return document.cookie.match(/(?:^|; )hse-language=(en|ar)/)?.[1] as Language ?? "ar"
  })
  const isArabic = language === "ar"

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? "rtl" : "ltr"
    document.cookie = `hse-language=${language}; path=/; max-age=31536000; SameSite=Lax`

    const originalText = new WeakMap<Text, string>()
    const originalAttributes = new WeakMap<HTMLElement, Record<string, string | null>>()
    const attributes = ["aria-label", "placeholder", "title"] as const

    const translatePage = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let node: Node | null
      while ((node = walker.nextNode())) nodes.push(node as Text)

      for (const textNode of nodes) {
        const parent = textNode.parentElement
        if (!parent || parent.closest("script,style,textarea,input,[data-language-ignore]")) continue
        const current = textNode.nodeValue ?? ""
        const value = current.trim()
        if (!value) continue
        if (!originalText.has(textNode)) originalText.set(textNode, current)
        const source = originalText.get(textNode)!.trim()
        const translated = translations[source]
        if (isArabic && translated) textNode.nodeValue = current.replace(value, translated)
        if (!isArabic) textNode.nodeValue = originalText.get(textNode)!
      }

      document.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]").forEach((element) => {
        if (!originalAttributes.has(element)) {
          originalAttributes.set(element, Object.fromEntries(attributes.map((attribute) => [attribute, element.getAttribute(attribute)])))
        }
        const originals = originalAttributes.get(element)!
        for (const attribute of attributes) {
          const source = originals[attribute]
          if (isArabic && source && translations[source]) element.setAttribute(attribute, translations[source])
          if (!isArabic && source !== null) element.setAttribute(attribute, source)
        }
      })
    }

    translatePage()
    const observer = new MutationObserver(translatePage)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [isArabic, language])

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      document.cookie = `hse-language=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`
      setLanguageState(nextLanguage)
    }

    return {
      language,
      isArabic,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "ar" : "en"),
      t: (english) => isArabic ? translations[english] ?? english : english,
    }
  }, [isArabic, language])

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
