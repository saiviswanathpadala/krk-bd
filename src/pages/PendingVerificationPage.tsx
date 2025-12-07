import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing } from '../theme';

export const PendingVerificationPage: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${colors.background.gradient.start} 0%, ${colors.background.gradient.middle} 50%, ${colors.background.gradient.end} 100%)`,
    padding: spacing['2xl'],
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '24px',
    padding: spacing['3xl'],
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: `0 20px 60px ${colors.shadow.heavy}`,
  };

  const iconContainerStyles: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.primary.orange}20, ${colors.primary.navy}20)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: `0 auto ${spacing.lg}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.primary.navy,
    marginBottom: spacing.md,
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '16px',
    color: colors.text.secondary,
    lineHeight: 1.6,
    marginBottom: spacing['2xl'],
  };

  const infoBoxStyles: React.CSSProperties = {
    backgroundColor: colors.background.secondary,
    borderRadius: '12px',
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  };

  const infoTextStyles: React.CSSProperties = {
    fontSize: '14px',
    color: colors.text.secondary,
    margin: `${spacing.xs} 0`,
  };

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <div style={iconContainerStyles}>
          <Clock size={48} color={colors.primary.navy} />
        </div>
        <h1 style={titleStyles}>Verification Pending</h1>
        <p style={messageStyles}>
          Your agent account has been created successfully and is currently under review by our admin team.
        </p>
        <div style={infoBoxStyles}>
          <p style={infoTextStyles}>
            <strong>Name:</strong> {user?.name || 'N/A'}
          </p>
          <p style={infoTextStyles}>
            <strong>Email:</strong> {user?.email || 'N/A'}
          </p>
          <p style={infoTextStyles}>
            <strong>Phone:</strong> {user?.phone || 'N/A'}
          </p>
          <p style={infoTextStyles}>
            <strong>Role:</strong> Agent
          </p>
          <p style={infoTextStyles}>
            <strong>Status:</strong> Pending Approval
          </p>
        </div>
        <p style={{ ...messageStyles, fontSize: '14px' }}>
          You will receive a notification once your account is approved. This usually takes 24-48 hours.
        </p>
        <Button icon={LogOut} onClick={handleLogout} variant="outline" fullWidth>
          Logout
        </Button>
      </div>
    </div>
  );
};
