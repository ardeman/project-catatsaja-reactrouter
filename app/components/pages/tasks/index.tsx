import { TaskProvider } from './context'
import { List } from './list'

export const TaskPage = () => {
  return (
    <TaskProvider>
      <List />
    </TaskProvider>
  )
}
