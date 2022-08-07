import { createSelector } from 'reselect'
import { RootState } from '../index'

export const authSelector = (state: RootState) => state.auth

export const isUserAuthenticatedSelector = createSelector(
  authSelector,
  (auth) => {
    return auth.authenticated
  },
)

export const isUserGroup1Selector = createSelector(authSelector, (auth) => {
  return auth.groups.includes('group_1')
})
export const isUserGroup2Selector = createSelector(authSelector, (auth) => {
  return auth.groups.includes('group_2')
})

export const errorSelector = createSelector(authSelector, (auth) => {
  return auth.error
})
