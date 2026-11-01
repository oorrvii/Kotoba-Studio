import { useCallback, useState } from 'react'
import { createFullBackup } from '../services/backupService.js'
import { downloadBlob } from '../utils/download.js'

export default function useBackupExport() {
  const [state, setState] = useState({ busy: false, progress: null, error: null, summary: null })

  const run = useCallback(async () => {
    setState({ busy: true, progress: { stage: 'Starting', done: 0, total: 0 }, error: null, summary: null })
    try {
      const out = await createFullBackup((progress) => setState((s) => ({ ...s, progress })))
      downloadBlob(out.filename, out.blob)
      setState({ busy: false, progress: null, error: null, summary: { ...out, size: out.blob.size, blob: undefined } })
      return true
    } catch (e) {
      setState({ busy: false, progress: null, error: e.message, summary: null })
      return false
    }
  }, [])

  return { ...state, run }
}
