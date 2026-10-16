import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecentApplicationsCard } from '../RecentApplicationsCard';

describe('RecentApplicationsCard (Phase 6.5G)', () => {
  const mockApplications = [
    {
      _id: 'app-501',
      company: 'Datadog',
      jobTitle: 'Software Engineer II',
      status: 'Interviewing',
      priority: 'High',
      workplaceType: 'Remote',
      jobType: 'Full-time',
      appliedDate: '2026-10-10T12:00:00.000Z',
    },
    {
      _id: 'app-502',
      company: 'Notion',
      jobTitle: 'Frontend Engineer',
      status: 'Applied',
      priority: 'Medium',
      workplaceType: 'Hybrid',
      jobType: 'Full-time',
      appliedDate: '2026-10-12T15:00:00.000Z',
    },
  ];

  it('renders application items with company, title, status, priority, and link to details', () => {
    render(
      <MemoryRouter>
        <RecentApplicationsCard applications={mockApplications} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Recent Applications/i })).toBeInTheDocument();
    expect(screen.getByTestId('recent-applications-count-badge')).toHaveTextContent('2');

    // First item
    expect(screen.getByText('Datadog')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer II')).toBeInTheDocument();
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/Remote/i)).toBeInTheDocument();

    const link = screen.getByTestId('recent-application-item-app-501');
    expect(link).toHaveAttribute('href', '/applications/app-501');

    // Second item
    expect(screen.getByText('Notion')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('renders empty state when applications list is empty with action button', () => {
    render(
      <MemoryRouter>
        <RecentApplicationsCard applications={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText('No applications tracked yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Application/i })).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no applications loaded', () => {
    render(
      <MemoryRouter>
        <RecentApplicationsCard isLoading={true} applications={[]} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('recent-applications-loading-card')).toBeInTheDocument();
  });

  it('renders error state and invokes onRetry callback when clicked', async () => {
    const user = userEvent.setup();
    const mockRetry = vi.fn();

    render(
      <MemoryRouter>
        <RecentApplicationsCard
          error="Failed to load applications"
          applications={[]}
          onRetry={mockRetry}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('recent-applications-error-card')).toBeInTheDocument();
    expect(screen.getByText('Failed to load applications')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await user.click(retryBtn);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
