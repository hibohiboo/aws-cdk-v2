import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from '@/components/Pages/Login'
import Top from '@/components/Pages/Top'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Top />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App
