import { CalendarWidget } from '../components/CalendarWidget'
import { FileExplorer } from '../components/FileExplorer'
import { NotesWidget } from '../components/NotesWidget'
import { StatusWidget } from '../components/StatusWidget'
import { TasksWidget } from '../components/TasksWidget'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-full lg:grid-cols-[260px_1fr_260px]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <TasksWidget />
        <NotesWidget />
      </div>

      <div className="lg:min-h-[480px]">
        <FileExplorer />
      </div>

      <div className="flex flex-col gap-4">
        <StatusWidget />
        <CalendarWidget />
      </div>
    </div>
  )
}
