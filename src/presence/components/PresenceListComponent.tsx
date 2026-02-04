/**
 * Presence List Component
 *
 * Displays a list of online users with avatars and colors.
 */

import { usePresence } from '../context/PresenceContext';
import { useAuth } from '@auth/hooks/useAuth';
import './PresenceListComponent.css';

/**
 * User Avatar Component
 * Displays a circular avatar with the user's initial or photo.
 */
interface UserAvatarProps {
  displayName: string;
  photoURL: string | null;
  color: string;
  isCurrentUser: boolean;
}

function UserAvatar({ displayName, photoURL, color, isCurrentUser }: UserAvatarProps) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`user-avatar ${isCurrentUser ? 'current-user' : ''}`}
      style={{ backgroundColor: color }}
      title={`${displayName}${isCurrentUser ? ' (you)' : ''}`}
    >
      {photoURL ? (
        <img src={photoURL} alt={displayName} className="avatar-image" />
      ) : (
        <span className="avatar-initial">{initial}</span>
      )}
    </div>
  );
}

/**
 * Presence List Component
 *
 * Displays all online users in the current board.
 */
export function PresenceListComponent() {
  const { onlineUsers, isLoading } = usePresence();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="presence-list presence-loading">
        <div className="presence-spinner" />
      </div>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <div className="presence-list presence-empty">
        <span>No one online</span>
      </div>
    );
  }

  const sortedUsers = [...onlineUsers].sort((a, b) => {
    if (a.uid === user?.uid) return -1;
    if (b.uid === user?.uid) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="presence-list">
      <div className="presence-avatars">
        {sortedUsers.map((onlineUser) => (
          <UserAvatar
            key={onlineUser.uid}
            displayName={onlineUser.displayName}
            photoURL={onlineUser.photoURL}
            color={onlineUser.color}
            isCurrentUser={onlineUser.uid === user?.uid}
          />
        ))}
      </div>
      <span className="presence-count">
        {onlineUsers.length} online
      </span>
    </div>
  );
}
