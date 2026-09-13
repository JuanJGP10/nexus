import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/tasks" element={<TasksPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
