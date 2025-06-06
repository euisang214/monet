import EnhancedCandidateDashboard from '@/app/components/EnhancedCandidateDashboard';

// TODO: Get candidateId from session/auth
const MOCK_CANDIDATE_ID = '507f1f77bcf86cd799439013';

export default function CandidateDashboardPage() {
  return <EnhancedCandidateDashboard candidateId={MOCK_CANDIDATE_ID} />;
}