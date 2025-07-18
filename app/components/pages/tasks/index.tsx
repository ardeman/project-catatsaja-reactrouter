import { TaskProvider } from './context'
import { List } from './list'
export { TaskProvider, useTask } from './context'

export const TaskPage = () => {
  return (
    <TaskProvider>
      <List />
    </TaskProvider>
  )
}
