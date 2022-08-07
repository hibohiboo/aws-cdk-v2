import React from 'react'
import { useAppSelector } from '@/store/hooks'
import {
  useGetAuthedHelloQuery,
  useGetGroup1Query,
  useGetGroup2Query,
  useGetHelloQuery,
} from '@/store/rtkQuery/api'
import {
  isUserAuthenticatedSelector,
  isUserGroup1Selector,
  isUserGroup2Selector,
} from '@/store/selectors/auth'
const Top: React.FC = () => {
  const isAuthenticated = useAppSelector(isUserAuthenticatedSelector)
  const isAdmin = useAppSelector(isUserGroup1Selector)
  const isUser = useAppSelector(isUserGroup2Selector)
  const ret = useGetHelloQuery()
  const authedRet = useGetAuthedHelloQuery(undefined, {
    skip: !isAuthenticated,
  })
  const group1 = useGetGroup1Query(undefined, { skip: !isAdmin })
  const group2 = useGetGroup2Query(undefined, { skip: !isUser })

  return (
    <div>
      <div>{isAuthenticated ? 'ログイン中' : '未ログイン'}</div>
      <dl>
        <dt>認証なし</dt>
        <dd>{JSON.stringify(ret.data?.message)}</dd>
        <dt>認証あり</dt>
        <dd>{JSON.stringify(authedRet.data?.message)}</dd>
        <dt>group1</dt>
        <dd>{JSON.stringify(group1.data?.message)}</dd>
        <dt>group2</dt>
        <dd>{JSON.stringify(group2.data?.message)}</dd>
      </dl>
    </div>
  )
}
export default Top
