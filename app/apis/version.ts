// The id of the build the server has now (`version.json`, written by
// `vite.config.ts`), skipping every cache. Undefined when it can't be read,
// such as offline.
export const fetchDeployedBuildId = async () => {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (!response.ok) return
    const { buildId } = (await response.json()) as { buildId?: unknown }
    return typeof buildId === 'string' ? buildId : undefined
  } catch {
    return
  }
}
