import { ConfirmDialog } from '../sites/Dialog'
import { resetDemoData } from '../../services/dataService'

// Replaces the browser confirm() for the destructive "reset demo data" action
export default function ResetDemoDialog({ onClose }) {
  return (
    <ConfirmDialog title="Reset the demo data?" confirmLabel="Yes, reset everything" danger onClose={onClose} onConfirm={() => resetDemoData()}>
      <p>All submitted inspections, issues, alert changes, registered sites, risk history and saved files go back to the starting data. This cannot be undone.</p>
    </ConfirmDialog>
  )
}
