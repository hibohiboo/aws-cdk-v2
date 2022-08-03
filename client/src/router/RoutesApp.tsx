import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from '@/components/Pages/Login'
import Top from '@/components/Pages/Top'
import { PrivateRoute } from './context/PriveteRoute'
import { PublicRoute } from './context/PublicRoute'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin" element={<PrivateRoute />}>
        <Route path="/admin/top" element={<Top />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}

export default App
