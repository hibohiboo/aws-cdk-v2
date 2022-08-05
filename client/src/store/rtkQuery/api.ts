import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Auth } from 'aws-amplify'

export const authencicatedApi = createApi({
  reducerPath: 'authencicatedApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_APP_API_DOMAIN,
    prepareHeaders: async (headers, _) => {
      const session = await Auth.currentSession()
      const token = session?.getIdToken().getJwtToken()
      headers.set('authorization', token)
      return headers
    },
    mode: 'cors', // Fetch API では mode cors を設定する必要があります。
  }),
  endpoints: (builder) => ({
    getScenario: builder.query<{ message: string }, void>({
      query: () => `api/scenario`,
    }),
  }),
})
export const { useGetScenarioQuery } = authencicatedApi
