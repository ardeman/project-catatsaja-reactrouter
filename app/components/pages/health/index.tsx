import { HealthLogProvider } from './context'
import { List } from './list.client'
export { HealthLogProvider, useHealthLog } from './context'

export const HealthPage = () => {
  return (
    <HealthLogProvider>
      <List />
    </HealthLogProvider>
  )
}
