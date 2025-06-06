import { formatDate, formatTime } from '@/lib/utils';

interface SessionCardProps {
  session: {
    _id: string;
    scheduledAt: string;
    durationMinutes: number;
    rateCents: number;
    status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
    zoomJoinUrl?: string;
  };
  user: {
    name: string;
    title?: string;
    company?: string;
    profileImageUrl?: string;
  };
  userType: 'candidate' | 'professional';
  onAction?: (sessionId: string, action: string) => void;
  showActions?: boolean;
}

export default function SessionCard({ 
  session, 
  user, 
  userType, 
  onAction,
  showActions = true 
}: SessionCardProps) {
  const getStatusBadge = () => {
    const badges = {
      requested: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-green-100 text-green-800', 
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${badges[session.status]}`}>
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
      </span>
    );
  };

  const getActionButton = () => {
    if (!showActions || !onAction) return null;

    if (session.status === 'confirmed' && session.zoomJoinUrl) {
      return (
        <a
          href={session.zoomJoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Join
        </a>
      );
    }

    if (session.status === 'requested' && userType === 'professional') {
      return (
        <button
          onClick={() => onAction(session._id, 'accept')}
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Accept
        </button>
      );
    }

    return null;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Profile Picture */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          
          {/* Session Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-bold text-gray-900">{user.name}</h3>
              {getStatusBadge()}
            </div>
            
            {user.title && user.company && (
              <p className="text-sm text-gray-600 mb-1">
                {user.title} at {user.company}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{formatDate(session.scheduledAt, false)}</span>
              <span>{formatTime(session.scheduledAt)}</span>
              <span>{session.durationMinutes} min</span>
              <span>${(session.rateCents / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0">
          {getActionButton()}
        </div>
      </div>
    </div>
  );
}