import React from 'react'
import { useAppSelector } from '@/store/hooks'
import { useGetScenarioQuery } from '@/store/rtkQuery/api'
import { isUserAuthenticatedSelector } from '@/store/selectors/auth'
const Top: React.FC = () => {
  const isAuthenticated = useAppSelector(isUserAuthenticatedSelector)
  const ret = useGetScenarioQuery(undefined, { skip: !isAuthenticated })
  return (
    <div>
      Hello World<div>{JSON.stringify(ret)}</div>
    </div>
  )
}
export default Top
