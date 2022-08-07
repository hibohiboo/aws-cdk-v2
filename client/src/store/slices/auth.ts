import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'
import { Auth } from 'aws-amplify'

interface AuthState {
  username?: string
  authenticated: boolean
  error?: SerializedError
  groups: string[]
}

const initialState: AuthState = {
  username: undefined,
  authenticated: false,
  error: undefined,
  groups: [],
}
type IdTokenPayload = {
  aud: string //"17e4qspqct1l2cuh7s73h13e7s"
  auth_time: number
  event_id: string //'a778712b-1e5d-475c-9ab3-edae87faad0c'
  exp: number
  iat: number
  iss: string // 'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_xxxxxx'
  jti: string //'2284a3cf-1f21-42fc-943e-3837dfbf24e4'
  origin_jti: string // 'b31b301f-1df4-1aaa-a01b-33270cf3b839'
  sub: string // '15949eae-bc0c-459a-af0c-3eca21b4226e'
  token_use: string // 'id'
  email: string
  'cognito:username': string // '15949eae-bc0c-459a-af0c-3eca21b4226e'
  'cognito:groups'?: string[]
}
const getGropus = async () => {
  const session = await Auth.currentSession()
  const token = session.getIdToken()
  const payload = token.payload as IdTokenPayload
  const groups = payload['cognito:groups']
  console.log(token)
  return groups || []
}

export const initUser = createAsyncThunk<AuthState>(
  'initUser',
  async (req, thunkAPI) => {
    try {
      const result = await Auth.currentAuthenticatedUser()
      const groups = await getGropus()
      return { username: result.username, groups, authenticated: true }
    } catch (error: any) {
      return thunkAPI.rejectWithValue({ error: error.message })
    }
  },
)

export const signIn = createAsyncThunk<
  AuthState,
  { username: string; password: string }
>('signIn', async ({ username, password }, thunkAPI) => {
  try {
    const result = await Auth.signIn(username, password)
    const groups = await getGropus()
    return { username: result.username, groups, authenticated: true }
  } catch (error: any) {
    return thunkAPI.rejectWithValue({ error: error.message })
  }
})

export const signOut = createAsyncThunk('logout', async (_, thunkAPI) => {
  try {
    await Auth.signOut()
  } catch (error: any) {
    return thunkAPI.rejectWithValue({ error: error.message })
  }
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.authenticated = true
      state.username = action.payload.username
      state.groups = action.payload.groups
    })
    builder.addCase(signIn.rejected, (state, action) => {
      return { ...initialState, error: action.error }
    })
    builder.addCase(signOut.fulfilled, () => {
      return { ...initialState }
    })
    builder.addCase(signOut.rejected, (state, action) => {
      return { ...initialState, error: action.error }
    })
    builder.addCase(initUser.fulfilled, (state, action) => {
      state.authenticated = true
      state.username = action.payload.username
      state.groups = action.payload.groups
    })
  },
})
