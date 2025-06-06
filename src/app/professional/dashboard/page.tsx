import EnhancedProDashboard from '@/app/components/EnhancedProDashboard';

// TODO: Get professionalId from session/auth
const MOCK_PROFESSIONAL_ID = '507f1f77bcf86cd799439012';

export default function ProfessionalDashboardPage() {
  return <EnhancedProDashboard professionalId={MOCK_PROFESSIONAL_ID} />;
}