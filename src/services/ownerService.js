import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

export async function checkOwner(uid) {

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' }
  try {
    const snap = await getDoc(doc(db, 'owner', 'config'))
    const uids = snap.exists() ? snap.data().uids : null
    if (Array.isArray(uids) && uids.includes(uid)) return { status: 'authorised' }
    return { status: 'denied' }
  } catch (error) {
    if (error?.code === 'permission-denied') return { status: 'denied' }
    if (error?.code === 'unavailable') return { status: 'offline' }
    return { status: 'error', error: 'Could not verify access. Check your connection and try again.' }
  }
}
