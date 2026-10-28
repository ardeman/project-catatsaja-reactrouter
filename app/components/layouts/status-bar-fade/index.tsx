// Fills the area under the installed app's see-through status bar on iPhone
// (statusBarStyles), so content scrolling up fades into it.
export const StatusBarFade = () => (
  <div
    aria-hidden
    className="status-bar-fade pointer-events-none fixed inset-x-0 top-0 z-40"
  />
)
