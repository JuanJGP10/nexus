import { CalendarWidget } from '../components/CalendarWidget'
import { FileExplorer } from '../components/files/FileExplorer'
import { NotesWidget } from '../components/NotesWidget'
import { StatusWidget } from '../components/StatusWidget'
import { TasksWidget } from '../components/TasksWidget'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-full lg:grid-cols-[320px_1fr_320px]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <TasksWidget />
        <NotesWidget />
      </div>

      <div className="min-h-105 lg:min-h-0">
        <FileExplorer />
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0">
        <StatusWidget />
        <CalendarWidget />
      </div>
    </div>
  )
}
