import { Hammer } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

export default function Placeholder({ title, description, phase }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={Hammer} title="Coming soon" description={`This page is built in ${phase}.`} />
    </>
  )
}
