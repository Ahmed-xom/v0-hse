import { retrieveAndInspectLegacyArchive } from "./legacy-migration-step"

function workflowErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "INSPECTION_FAILED"
  return ({
    MICROSOFT_AUTHORIZATION_REQUIRED: "Microsoft authorization is required.",
    SHAREPOINT_DOWNLOAD_401: "SharePoint authorization was rejected.",
    SHAREPOINT_DOWNLOAD_403: "SharePoint denied access to the archive.",
    ARCHIVE_TOO_LARGE: "Archive exceeds the 100 MB upload limit.",
    TOO_MANY_ENTRIES: "Archive exceeds the 10,000-entry safety limit.",
    ENTRY_TOO_LARGE: "An archive entry exceeds the 50 MB safety limit.",
    ARCHIVE_UNCOMPRESSED_LIMIT: "Archive exceeds the 500 MB decompression safety limit.",
  } as Record<string, string>)[code] ?? "The legacy archive inspection failed."
}

export type LegacyMigrationWorkflowInput = {
  userId: string
  sharingUrl: string
}

export async function inspectLegacyMigration(input: LegacyMigrationWorkflowInput) {
  "use workflow"
  try {
    return await retrieveAndInspectLegacyArchive(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : "INSPECTION_FAILED"
    throw new Error(workflowErrorMessage(error) === "The legacy archive inspection failed." ? message : workflowErrorMessage(error))
  }
}
