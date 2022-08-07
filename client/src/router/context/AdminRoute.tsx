import React from 'react'
import { Navigate, Outlet, RouteProps } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { isUserGroup1Selector } from '@/store/selectors/auth'

export const AdminRoute: React.FC<RouteProps> = () => {
  const isAdmin = useAppSelector(isUserGroup1Selector)
  if (!isAdmin) {
    return <Navigate to="/login" />
  }

  return <Outlet />
}
