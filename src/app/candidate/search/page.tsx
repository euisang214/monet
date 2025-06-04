import CandidateSearch from '@/app/components/CandidateSearch';

// TODO: Get candidateId from session/auth
const MOCK_CANDIDATE_ID = '507f1f77bcf86cd799439011';

export default function CandidateSearchPage() {
  return <CandidateSearch candidateId={MOCK_CANDIDATE_ID} />;
}