import { masterCategories } from "./masters-data"

export type MasterRegistrySection = {
  id: string
  categoryId: string
  name: string
  description: string
  source: "master_value" | "special"
}

export const masterRegistry: MasterRegistrySection[] = masterCategories.flatMap((category) =>
  category.items.map((section) => ({
    id: section.id,
    categoryId: category.id,
    name: section.name,
    description: section.description,
    source: ["company", "reviewer-approver", "vehicle-details", "jm-vehicle-detail", "setup-risk-matrix"].includes(section.id)
      ? "special"
      : "master_value",
  })),
)

export function getMasterSection(sectionId: string) {
  return masterRegistry.find((section) => section.id === sectionId)
}

export function getMasterSectionIds() {
  return masterRegistry.map((section) => section.id)
}
