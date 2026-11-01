import PageHeader from '../components/layout/PageHeader.jsx'
import ExportCard from '../components/backup/ExportCard.jsx'
import RestoreFlow from '../components/backup/RestoreFlow.jsx'

export default function Backup() {
  return (
    <>
      <PageHeader title="Backup & Restore" description="Your words and images live in the cloud, and this page gives you a copy you control." />
      <div className="space-y-8">
        <ExportCard />
        <RestoreFlow />
      </div>
    </>
  )
}
