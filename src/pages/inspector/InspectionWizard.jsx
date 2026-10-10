import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useInspection, STEPS_BY_KIND } from '../../context/InspectionContext'
import { getSiteById } from '../../services/dataService'
import { getSummary } from '../../utils/inspection'
import { sitePath } from '../../utils/paths'
import PageHead from '../../components/ui/PageHead'
import StepIndicator from '../../components/inspection/StepIndicator'
import GpsVerifier from '../../components/inspection/GpsVerifier'
import ChecklistStep from '../../components/inspection/ChecklistStep'
import ProgressStep from '../../components/inspection/ProgressStep'
import PhaseItemsStep from '../../components/inspection/PhaseItemsStep'
import EvidenceStep from '../../components/inspection/EvidenceStep'
import IssuesStep from '../../components/inspection/IssuesStep'
import SummaryStep from '../../components/inspection/SummaryStep'
import ConstructionSummaryStep from '../../components/inspection/ConstructionSummaryStep'
import CheckoutStep from '../../components/inspection/CheckoutStep'
import CompletedScreen from '../../components/inspection/CompletedScreen'

// Plain-language help for each step (shown under the progress bar)
const STEP_HELP = {
  'Check-in': 'Stand at the site and confirm your GPS position. Check-in opens only when you are inside the allowed radius.',
  Progress: 'Record how far the work has actually come, and the phase it is in.',
  Checklist: 'Mark every item Pass, Attention or Fail. Use the category tabs to jump around – nothing is lost.',
  Materials: 'Check the materials used against the plan for this phase.',
  Evidence: 'Add clear photos of what you found. Good light and a steady hand help.',
  Issues: 'Report anything that needs follow-up. You can skip this step if everything is fine.',
  Summary: 'Review everything. You can still go back and change answers before submitting.',
  'Check-out': 'Confirm your GPS position once more to finish and submit the inspection.',
}

// Used for BOTH old and new sites. The step list comes from the inspection kind.
// Old:  Check-in → Checklist → Evidence → Issues → Summary → Check-out
// New:  Check-in → Progress → Checklist → Materials → Evidence → Issues → Summary → Check-out
export default function InspectionWizard() {
  const { siteId } = useParams()
  const insp = useInspection()
  const { draft } = insp
  const site = getSiteById(siteId)

  if (!site) return <Navigate to="/inspector" replace />
  if (!draft || draft.siteId !== siteId) return <Navigate to={sitePath(site)} replace />

  const steps = STEPS_BY_KIND[draft.kind]
  const construction = draft.kind === 'construction'
  const summary = getSummary(draft, site)
  const done = draft.step === steps.length
  const label = steps[draft.step]

  return (
    <>
      {!done && !draft.submitted && <Link to={sitePath(site)} className="back-link"><ArrowLeft size={16} /> {construction ? 'Project' : 'Site'} details (progress is kept)</Link>}
      <PageHead title={done ? 'All done' : construction ? 'Construction inspection' : 'Site inspection'} subtitle={site.name} />
      {!done && (
        <div className="flow-progress">
          <div className="meta"><span>Step {draft.step + 1} of {steps.length}: {label}</span><span>{Math.round((draft.step / steps.length) * 100)}% done</span></div>
          <div className="track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((draft.step / steps.length) * 100)} aria-label="Inspection progress"><span style={{ width: `${Math.max(4, (draft.step / steps.length) * 100)}%` }} /></div>
          <p className="muted small" style={{ margin: 0 }}>{STEP_HELP[label]} <span role="status">Your progress is saved automatically on this device.</span></p>
        </div>
      )}
      {!done && <StepIndicator steps={steps} current={draft.step} locked={draft.submitted} onSelect={insp.goto} />}

      {label === 'Check-in' && <GpsVerifier site={site} purpose="checkin" onConfirm={insp.setCheckIn} />}
      {label === 'Progress' && <ProgressStep site={site} insp={insp} />}
      {label === 'Checklist' && (construction ? <PhaseItemsStep site={site} insp={insp} mode="work" /> : <ChecklistStep site={site} insp={insp} summary={summary} />)}
      {label === 'Materials' && <PhaseItemsStep site={site} insp={insp} mode="materials" />}
      {label === 'Evidence' && <EvidenceStep insp={insp} summary={summary} />}
      {label === 'Issues' && <IssuesStep site={site} insp={insp} summary={summary} />}
      {label === 'Summary' && (construction ? <ConstructionSummaryStep site={site} insp={insp} summary={summary} /> : <SummaryStep site={site} insp={insp} summary={summary} />)}
      {label === 'Check-out' && <CheckoutStep site={site} insp={insp} />}
      {done && <CompletedScreen site={site} insp={insp} summary={summary} />}
    </>
  )
}
