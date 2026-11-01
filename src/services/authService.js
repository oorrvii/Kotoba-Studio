import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import { clearImageCache } from './imageService.js'
import { clearOfflineData } from './offlineStore.js'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

const QUIET_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

function describeError(error) {
  switch (error?.code) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.'
    case 'auth/network-request-failed':
      return 'Could not reach Google. Check your connection and try again.'
    case 'auth/unauthorized-domain':
      return 'This website address is not authorised in Firebase. See the setup guide.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}

export const observeAuth = (callback) => onAuthStateChanged(auth, callback)

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider)
    return { ok: true }
  } catch (error) {
    if (QUIET_CODES.includes(error?.code)) return { ok: false, cancelled: true }
    return { ok: false, error: describeError(error) }
  }
}

export async function signOutUser() {
  let warning = null
  clearImageCache()
  try {
    await clearOfflineData()
  } catch {
    warning = 'You were signed out, but offline copies couldn’t be removed from this device. Clear this site’s data in your browser settings.'
  }
  try {
    await signOut(auth)
    return { ok: true, warning }
  } catch {
    return { ok: false, error: 'Sign-out failed. Please try again.' }
  }
}
