import React from 'react'
import { Navigate, Outlet, RouteProps } from 'react-router-dom'
import { useAuth } from '@/hooks/authHook'

export const PrivateRoute: React.FC<RouteProps> = ({
  element: Component,
  ...rest
}) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  const isAdminPath = rest && rest.path && rest.path.indexOf('/admin') >= 0
  if (isAdminPath) {
    return <Navigate to="/admin" />
  }
  return <Outlet />
}
