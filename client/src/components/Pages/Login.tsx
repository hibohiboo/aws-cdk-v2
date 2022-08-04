import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { signIn } from '@/store/slices/auth'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useAppDispatch()

  const executeSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await dispatch(signIn({ username, password }))

    if (result.meta.requestStatus !== 'fulfilled') {
      alert('認証に失敗しました。')
      return
    }
    navigate({ pathname: '/admin/top' })
  }

  return (
    <form noValidate onSubmit={executeSignIn}>
      <div>
        <label htmlFor="username">メールアドレス: </label>
        <input
          id="username"
          type="email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password">パスワード: </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">ログイン</button>
    </form>
  )
}
export default Login
