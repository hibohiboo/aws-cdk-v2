import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import {
  useGetGroup1Query,
  useGetGroup2Query,
  useGetHelloQuery,
  useGetAuthedHelloQuery,
} from '@/store/rtkQuery/api'
import { signOut } from '@/store/slices/auth'

const Top: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const ret = useGetHelloQuery()
  const authedRet = useGetAuthedHelloQuery()
  const group1 = useGetGroup1Query()
  const group2 = useGetGroup2Query()

  const executeSignOut = async () => {
    const result = await dispatch(signOut())
    console.log(result)
    navigate({ pathname: '/test' })
  }

  return (
    <div>
      <div>Hello World</div>
      <div>
        <Link to={'/test'}>未ログイン状態チェック画面</Link>
      </div>
      <button
        onClick={() => {
          ret.refetch()
        }}
      >
        再取得
      </button>

      <button onClick={executeSignOut}>ログアウト</button>
      <div>
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
    </div>
  )
}
export default Top
