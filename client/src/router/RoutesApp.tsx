import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { getRum } from '@/domain/rum/aws-rum'
import Login from '@/components/Pages/Login'
import Redirect from '@/components/Pages/Redirect'
import Test from '@/components/Pages/Test'
import Top from '@/components/Pages/Top'
import { AdminRoute } from './context/AdminRoute'
import { PrivateRoute } from './context/PriveteRoute'
import { PublicRoute } from './context/PublicRoute'

const App: React.FC = () => {
  const location = useLocation()

  React.useEffect(() => {
    if (import.meta.env.DEV) return
    const cwr = getRum()
    if (!cwr) return
    console.log(location.pathname)
    cwr.recordPageView(location.pathname)
  }, [location])

  return (
    <Routes>
      <Route path="/admin" element={<AdminRoute />}>
        <Route path="/admin/top" element={<Top />} />
      </Route>
      <Route path="/private" element={<PrivateRoute />}>
        <Route path="/private/top" element={<Top />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/" element={<Redirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<Test />} />
      </Route>
    </Routes>
  )
}

export default App
