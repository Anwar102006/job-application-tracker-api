import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, updateProfile, changePassword } from '../services/userService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  LoadingIndicator,
  ErrorState,
} from '../components/atoms';

/**
 * Profile Page (Phase 6.5C)
 *
 * Section 1: User Profile details (read-only verified email, editable name/headline/targetRole)
 * Section 2: Security & Password Management (change password, session invalidation & redirect to /login)
 */
export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, clearAuth } = useAuth();

  // Profile Information State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    headline: '',
    targetRole: '',
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileFetchError, setProfileFetchError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Security / Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordGeneralError, setPasswordGeneralError] = useState('');

  // Fetch current user details on mount
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      setProfileFetchError('');

      try {
        const response = await getCurrentUser();
        const userData = response.data?.data || response.data;

        if (isMounted) {
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            headline: userData.headline || '',
            targetRole: userData.targetRole || '',
          });
          setUser(userData);
        }
      } catch (err) {
        if (isMounted) {
          // If we already have user in AuthContext, fallback to that
          if (user) {
            setProfileData({
              name: user.name || '',
              email: user.email || '',
              headline: user.headline || '',
              targetRole: user.targetRole || '',
            });
          } else {
            setProfileFetchError(getErrorMessage(err, 'Failed to load profile details.'));
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Profile Form Validation
  const validateProfile = () => {
    const errs = {};
    const trimmedName = profileData.name.trim();

    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      errs.name = 'Name must not exceed 50 characters';
    }

    if (profileData.headline && profileData.headline.trim().length > 100) {
      errs.headline = 'Headline must not exceed 100 characters';
    }

    if (profileData.targetRole && profileData.targetRole.trim().length > 100) {
      errs.targetRole = 'Target role must not exceed 100 characters';
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));

    if (profileErrors[name]) {
      setProfileErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    setIsUpdatingProfile(true);

    try {
      // Backend schema allows name, headline, targetRole. Email MUST NOT be sent.
      const payload = {
        name: profileData.name.trim(),
        headline: profileData.headline.trim() || undefined,
        targetRole: profileData.targetRole.trim() || undefined,
      };

      const response = await updateProfile(payload);
      const updatedUser = response.data?.data || response.data;

      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setProfileErrors(fieldErrors);
      } else {
        toast.error(getErrorMessage(err, 'Failed to update profile.'));
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password Form Validation
  const validatePassword = () => {
    const errs = {};

    if (!passwordData.currentPassword) {
      errs.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errs.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters';
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errs.newPassword = 'New password must be different from current password';
    }

    if (!passwordData.confirmNewPassword) {
      errs.confirmNewPassword = 'Confirm new password is required';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errs.confirmNewPassword = 'Passwords do not match';
    }

    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (passwordGeneralError) {
      setPasswordGeneralError('');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordGeneralError('');

    if (!validatePassword()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      // Backend requires currentPassword and newPassword only
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // The backend immediately invalidates all active refresh tokens for this user.
      // Therefore, clear frontend auth state without issuing a redundant backend logout call.
      clearAuth();

      toast.success('Password changed successfully. Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setPasswordErrors(fieldErrors);
      }

      const msg = getErrorMessage(err, 'Failed to change password. Please check your credentials.');
      setPasswordGeneralError(msg);
      setIsChangingPassword(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
        <LoadingIndicator label="Loading profile..." size="large" />
      </div>
    );
  }

  if (profileFetchError) {
    return (
      <div className="page-container">
        <ErrorState
          title="Could not load profile"
          description={profileFetchError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Settings</h1>
          <p className="page-subtitle">Manage your account information and security credentials</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '720px' }}>
        {/* Section 1: Profile Information */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <User size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <CardTitle as="h2">Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal and professional career details.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleProfileSubmit} noValidate>
              {/* Read-only verified email */}
              <div className="form-group">
                <label htmlFor="profile-email" className="form-label">
                  Email Address
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileData.email}
                    disabled
                    readOnly
                    className="form-input"
                    style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                  />
                  <Badge variant="success" dot>
                    <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Verified
                  </Badge>
                </div>
                <span className="form-helper">
                  Your email address is managed through your primary account authentication.
                </span>
              </div>

              <Input
                id="profile-name"
                name="name"
                type="text"
                label="Full Name"
                placeholder="Jane Doe"
                value={profileData.name}
                onChange={handleProfileChange}
                error={profileErrors.name}
                required
                disabled={isUpdatingProfile}
              />

              <Input
                id="profile-headline"
                name="headline"
                type="text"
                label="Professional Headline"
                placeholder="Senior Full Stack Engineer"
                value={profileData.headline}
                onChange={handleProfileChange}
                error={profileErrors.headline}
                disabled={isUpdatingProfile}
                helperText="Brief summary displayed on your profile (max 100 characters)"
              />

              <Input
                id="profile-targetRole"
                name="targetRole"
                type="text"
                label="Target Role"
                placeholder="Staff Frontend Architect"
                value={profileData.targetRole}
                onChange={handleProfileChange}
                error={profileErrors.targetRole}
                disabled={isUpdatingProfile}
                helperText="Primary role you are actively targeting in your job search"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isUpdatingProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Saving changes...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 2: Security & Password */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Shield size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <CardTitle as="h2">Security & Password</CardTitle>
            </div>
            <CardDescription>
              Change your account password. Updating your password will sign you out of all active sessions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {passwordGeneralError && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'var(--danger-subtle)',
                  color: 'var(--danger-foreground)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-md)',
                }}
              >
                {passwordGeneralError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div style={{ position: 'relative' }}>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Current Password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChangeInput}
                  error={passwordErrors.currentPassword}
                  required
                  autoComplete="current-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  disabled={isChangingPassword}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '32px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Minimum 8 characters"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChangeInput}
                  error={passwordErrors.newPassword}
                  required
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  disabled={isChangingPassword}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '32px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChangeInput}
                  error={passwordErrors.confirmNewPassword}
                  required
                  autoComplete="new-password"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                  aria-label={showConfirmNewPassword ? 'Hide confirm new password' : 'Show confirm new password'}
                  disabled={isChangingPassword}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '32px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <Button
                  type="submit"
                  variant="danger"
                  size="md"
                  isLoading={isChangingPassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
