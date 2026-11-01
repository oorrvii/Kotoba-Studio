import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isFirebaseConfigured } from '../../lib/firebase.js'
import { observeAuth, signInWithGoogle, signOutUser } from '../../services/authService.js'
import { checkOwner } from '../../services/ownerService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: isFirebaseConfigured ? 'loading' : 'unconfigured',
    user: null,
    error: null,
  })
  const latest = useRef(0)

  const verify = useCallback(async (user) => {
    const mine = ++latest.current
    setState({ status: 'checking', user, error: null })
    const result = await checkOwner(user.uid)
    if (mine !== latest.current) return
    setState({ status: result.status, user, error: result.error ?? null })
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    return observeAuth((user) => {
      if (user) {
        verify(user)
      } else {
        latest.current += 1
        setState({ status: 'signedOut', user: null, error: null })
      }
    })
  }, [verify])

  const recheck = useCallback(() => { if (state.user) verify(state.user) }, [state.user, verify])

  const value = useMemo(
    () => ({ ...state, signIn: signInWithGoogle, signOut: signOutUser, recheck }),
    [state, recheck],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
