import React from 'react'
import { Outlet, RouteProps } from 'react-router-dom'

export const PublicRoute: React.FC<RouteProps> = () => {
  return <Outlet />
}
