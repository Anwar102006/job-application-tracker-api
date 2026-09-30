import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../services/authService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/atoms';

/**
 * Register Page (Phase 6.5C)
 * User onboarding registration portal with client validation,
 * confirm password verification (never sent to backend),
 * backend error mapping, and redirection to /login on success.
 */
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    headline: '',
    targetRole: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to /
  if (!isAuthLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.headline && formData.headline.trim().length > 100) {
      newErrors.headline = 'Headline must not exceed 100 characters';
    }

    if (formData.targetRole && formData.targetRole.trim().length > 100) {
      newErrors.targetRole = 'Target role must not exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct clean payload strictly adhering to backend contract
      // confirmPassword is strictly client-side and NEVER sent
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      if (formData.headline.trim()) {
        payload.headline = formData.headline.trim();
      }

      if (formData.targetRole.trim()) {
        payload.targetRole = formData.targetRole.trim();
      }

      await apiRegister(payload);

      // Registration does NOT return tokens; notify and redirect to login
      toast.success('Account created successfully! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }

      const msg = getErrorMessage(err, 'Failed to create account. Please check the details provided.');
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* CareerPulse Branding */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-sm)',
              boxShadow: 'var(--shadow-md)',
            }}
            aria-hidden="true"
          >
            <Briefcase size={26} />
          </div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            CareerPulse
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Create your account to start managing your applications
          </p>
        </div>

        {/* Registration Card */}
        <Card>
          <CardHeader>
            <CardTitle as="h2">Create an account</CardTitle>
            <CardDescription>
              Join CareerPulse to organize applications, track interview stages, and view analytics.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {generalError && (
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
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Input
                id="name"
                name="name"
                type="text"
                label="Full Name"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                autoComplete="name"
                disabled={isSubmitting}
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />

              <div style={{ position: 'relative' }}>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  disabled={isSubmitting}
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
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Input
                id="headline"
                name="headline"
                type="text"
                label="Professional Headline (optional)"
                placeholder="Senior Full Stack Engineer"
                value={formData.headline}
                onChange={handleChange}
                error={errors.headline}
                disabled={isSubmitting}
              />

              <Input
                id="targetRole"
                name="targetRole"
                type="text"
                label="Target Role (optional)"
                placeholder="Staff Frontend Architect"
                value={formData.targetRole}
                onChange={handleChange}
                error={errors.targetRole}
                disabled={isSubmitting}
              />

              <div style={{ marginTop: 'var(--space-lg)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  style={{ width: '100%' }}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p
          style={{
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--accent)',
              fontWeight: 'var(--font-medium)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
