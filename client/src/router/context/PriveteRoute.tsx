import React from 'react'
import { Navigate, Outlet, RouteProps } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { isUserAuthenticatedSelector } from '@/store/selectors/auth'

export const PrivateRoute: React.FC<RouteProps> = ({ element: _, ...rest }) => {
  const isAuthenticated = useAppSelector(isUserAuthenticatedSelector)
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  const isAdminPath = rest && rest.path && rest.path.indexOf('/admin') >= 0
  if (isAdminPath) {
    return <Navigate to="/admin" />
  }
  return <Outlet />
}
