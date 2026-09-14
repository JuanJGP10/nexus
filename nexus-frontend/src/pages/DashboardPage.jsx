import { CalendarWidget } from '../components/CalendarWidget'
import { FileExplorer } from '../components/FileExplorer'
import { NotesWidget } from '../components/NotesWidget'
import { StatusWidget } from '../components/StatusWidget'
import { TasksWidget } from '../components/TasksWidget'

export function DashboardPage() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_260px]">
      <div className="flex min-h-0 flex-col gap-4">
        <TasksWidget />
        <NotesWidget />
      </div>

      <div className="min-h-[480px]">
        <FileExplorer />
      </div>

      <div className="flex flex-col gap-4">
        <StatusWidget />
        <CalendarWidget />
      </div>
    </div>
  )
}
