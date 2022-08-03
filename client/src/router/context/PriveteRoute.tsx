import React from 'react'
import { Navigate, Outlet, RouteProps } from 'react-router-dom'

export const PrivateRoute: React.FC<RouteProps> = ({
  element: Component,
  ...rest
}) => {
  const auth = true // TODO
  if (!auth) {
    return <Navigate to="/login" />
  }
  const isAdminPath = rest && rest.path && rest.path.indexOf('/admin') >= 0
  if (isAdminPath) {
    return <Navigate to="/admin" />
  }
  return <Outlet />
}
