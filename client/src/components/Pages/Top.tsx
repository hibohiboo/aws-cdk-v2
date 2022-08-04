import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { useGetScenarioQuery } from '@/store/rtkQuery/api'
import { signOut } from '@/store/slices/auth'
const Top: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const ret = useGetScenarioQuery()

  const executeSignOut = async () => {
    const result = await dispatch(signOut())
    console.log(result)
    navigate({ pathname: '/test' })
  }
  return (
    <div>
      <div>
        Hello World<div>{JSON.stringify(ret?.data?.message)}</div>
      </div>

      <button onClick={executeSignOut}>ログアウト</button>
    </div>
  )
}
export default Top
