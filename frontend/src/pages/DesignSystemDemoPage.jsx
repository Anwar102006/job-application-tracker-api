import { useState } from 'react';
import {
  Sparkles,
  Trash2,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  LoadingIndicator,
  EmptyState,
  ErrorState,
} from '../components/atoms';
import { PageContainer } from '../layouts';

/**
 * DesignSystemDemoPage Component (Phase 6.5A)
 * Minimal polished design system showcase for visual and interaction verification
 */
export const DesignSystemDemoPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('Frontend Engineer');
  const [inputError, setInputError] = useState('');
  const [selectedType, setSelectedType] = useState('Full-time');
  const [notesValue, setNotesValue] = useState('Found on company career page.');

  return (
    <PageContainer
      title="Design System & UI Foundation"
      subtitle="Phase 6.5A Foundation Preview — Pure Vanilla CSS Design Tokens, Reusable Atoms & Layout Shell"
      actions={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Sparkles size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Open Demo Modal
        </Button>
      }
    >
      {/* Informational Banner */}
      <div
        style={{
          padding: 'var(--space-md) var(--space-lg)',
          backgroundColor: 'var(--info-subtle)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-md)',
        }}
      >
        <Info size={20} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--info-foreground)' }}>
            Phase 6.5A Scaffolding Mode Active
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Zero backend connections or authentication logic. This screen verifies typography, CSS custom properties, light/dark themes, responsive layout scaling, and atomic UI component behavior.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Section 1: Typography & Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Typography System</CardTitle>
            <CardDescription>Self-contained system font stack (Inter / system-ui)</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>Heading 1 (24px Bold)</h1>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>Heading 2 (20px Semibold)</h2>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>Heading 3 (18px Medium)</h3>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              Body text: Clean, legible sans-serif typography designed for SaaS data density.
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Secondary muted text: Contextual descriptions, timestamps, and metadata.
            </p>
            <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              Monospace text: MongoDB ObjectIds, timestamps, and currency numbers.
            </p>
          </CardContent>
        </Card>

        {/* Section 2: Application Status Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>Mapped to all 7 canonical application statuses</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <Badge variant="neutral" dot>Applied</Badge>
            <Badge variant="info" dot>Screening</Badge>
            <Badge variant="primary" dot>Interviewing</Badge>
            <Badge variant="success" dot>Offered</Badge>
            <Badge variant="danger" dot>Rejected</Badge>
            <Badge variant="warning" dot>Withdrawn</Badge>
            <Badge variant="neutral">Ghosted</Badge>
          </CardContent>
          <CardFooter>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Full FSM validation will be wired in Phase 6.5D.
            </span>
          </CardFooter>
        </Card>

        {/* Section 3: Button Atoms */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Buttons & Spinners</CardTitle>
            <CardDescription>All variants, sizes, and states</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <Button variant="primary" size="md">Primary</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="ghost" size="md">Ghost</Button>
            <Button variant="danger" size="md" leftIcon={<Trash2 size={16} />}>Danger</Button>
            <Button variant="primary" size="md" isLoading>Loading</Button>
            <Button variant="secondary" size="md" disabled>Disabled</Button>
            <LoadingIndicator size="sm" />
            <LoadingIndicator size="md" />
          </CardContent>
        </Card>

        {/* Section 4: Form Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Form Controls</CardTitle>
            <CardDescription>Accessible inputs with validation states</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Job Title"
              required
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!e.target.value) setInputError('Job title is required');
                else setInputError('');
              }}
              error={inputError}
              helperText="e.g. Senior Full-Stack Engineer"
            />
            <Select
              label="Employment Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']}
            />
            <Textarea
              label="Notes"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              helperText="Max 2000 characters"
            />
          </CardContent>
        </Card>

        {/* Section 5: Empty State Foundation */}
        <Card>
          <CardHeader>
            <CardTitle>Empty State Foundation</CardTitle>
            <CardDescription>Default view when collections are empty</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No applications tracked yet"
              description="Start tracking your job search journey by adding your first application."
              action={
                <Button variant="outline" size="sm" leftIcon={<ExternalLink size={14} />}>
                  Learn More
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Section 6: Error State Foundation */}
        <Card>
          <CardHeader>
            <CardTitle>Error State Foundation</CardTitle>
            <CardDescription>Resilient failure and retry presentation</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorState
              title="Network Request Failed"
              message="Could not reach the server. Check your connection or verify API availability."
              onRetry={() => alert('Demo retry action triggered!')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Demo Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Design System Demo Dialog"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={() => setModalOpen(false)}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          This accessible modal dialog handles keyboard <kbd style={{ padding: '2px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>ESC</kbd> dismissals, backdrop dismissal, and body scroll lock.
        </p>
        <Input
          label="Sample Modal Field"
          placeholder="Enter test value"
          helperText="Ready for Phase 6.5D CreateApplicationModal foundation."
        />
      </Modal>
    </PageContainer>
  );
};
