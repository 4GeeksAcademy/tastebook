import React from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ 
  imageUrl, 
  username, 
  fullName, 
  size        = "medium", // "small", "medium", "large", "xl"
  className   = "",
  showTooltip = true,
  onClick
}) => {

  const sizeClasses = {
    small:  "24px",
    medium: "40px", 
    large:  "64px",
    xl:     "96px"
  };

  const iconSizes = {
    small:  12,
    medium: 20,
    large:  32,
    xl:     48
  };

  const displayName = fullName || username || "User";
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarStyle = {
    width:     sizeClasses[size],
    height:    sizeClasses[size],
    minWidth:  sizeClasses[size],
    minHeight: sizeClasses[size],
    cursor:    onClick ? 'pointer' : 'default'
  };

  const avatarContent = imageUrl ? (
    <img
      src={imageUrl}
      alt={`${displayName}'s profile`}
      className="w-100 h-100 rounded-circle"
      style={{ objectFit: 'cover' }}
    />
  ) : (
    <div className="w-100 h-100 rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white">
      {size === 'small' ? (
        <User size={iconSizes[size]} />
      ) : (
        <span className="fw-bold" style={{ fontSize: size === 'xl' ? '1.5rem' : '0.875rem' }}>
          {initials}
        </span>
      )}
    </div>
  );

  return (
    <div
      className={`d-inline-block ${className}`}
      style={avatarStyle}
      onClick={onClick}
      title={showTooltip ? displayName : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {avatarContent}
    </div>
  );
};

export default UserAvatar;
