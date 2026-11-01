import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '../components/ui/Toast.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'
import { router } from './router.jsx'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
