import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Auth } from 'aws-amplify'

export const unauthencicatedApi = createApi({
  reducerPath: 'unauthencicatedApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_APP_API_DOMAIN,
    mode: 'cors', // Fetch API では mode cors を設定する必要がある
  }),
  endpoints: (builder) => ({
    getHello: builder.query<{ message: string }, void>({
      query: () => `api/hello`,
    }),
  }),
})
export const { useGetHelloQuery } = unauthencicatedApi

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
    mode: 'cors',
  }),
  endpoints: (builder) => ({
    getAuthedHello: builder.query<{ message: string }, void>({
      query: () => `api/hello-jwt`,
    }),
    getGroup1: builder.query<{ message: string }, void>({
      query: () => `api/group1-hello`,
    }),
    getGroup2: builder.query<{ message: string }, void>({
      query: () => `api/group2-hello`,
    }),
  }),
})
export const { useGetAuthedHelloQuery, useGetGroup1Query, useGetGroup2Query } =
  authencicatedApi
