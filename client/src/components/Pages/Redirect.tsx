import React from 'react'
import { Navigate } from 'react-router'
import { useAppSelector } from '@/store/hooks'
import { isUserAuthenticatedSelector } from '@/store/selectors/auth'
const Top: React.FC = () => {
  const isAuthenticated = useAppSelector(isUserAuthenticatedSelector)
  if (isAuthenticated) {
    return <Navigate to="/admin/top" />
  }
  return <Navigate to="/login" />
}
export default Top
