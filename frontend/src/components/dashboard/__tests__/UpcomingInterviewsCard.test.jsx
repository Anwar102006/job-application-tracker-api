import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingInterviewsCard } from '../UpcomingInterviewsCard';

describe('UpcomingInterviewsCard (Phase 6.5G)', () => {
  const mockInterviews = [
    {
      _id: 'iv-101',
      round: 'Technical',
      status: 'Scheduled',
      format: 'Video Call',
      interviewDate: '2026-10-25T14:30:00.000Z',
      durationMinutes: 60,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      applicationId: {
        _id: 'app-1',
        company: 'Stripe',
        jobTitle: 'Backend Engineer',
        status: 'Interviewing',
      },
    },
    {
      _id: 'iv-102',
      round: 'Behavioral',
      status: 'Scheduled',
      format: 'Phone Call',
      interviewDate: '2026-10-28T10:00:00.000Z',
      durationMinutes: 45,
      applicationId: {
        _id: 'app-2',
        company: 'Figma',
        jobTitle: 'Product Engineer',
        status: 'Interviewing',
      },
    },
  ];

  it('renders interview items with company, role, round, format, date, and link', () => {
    render(
      <MemoryRouter>
        <UpcomingInterviewsCard interviews={mockInterviews} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Upcoming Interviews/i })).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-interviews-count-badge')).toHaveTextContent('2');

    // First interview details
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Video Call')).toBeInTheDocument();
    expect(screen.getByText('Meeting Link')).toBeInTheDocument();

    // Link to detail page
    const itemLink = screen.getByTestId('upcoming-interview-item-iv-101');
    expect(itemLink).toHaveAttribute('href', '/interviews/iv-101');

    // Second interview details
    expect(screen.getByText('Figma')).toBeInTheDocument();
    expect(screen.getByText('Product Engineer')).toBeInTheDocument();
    expect(screen.getByText('Phone Call')).toBeInTheDocument();
  });

  it('renders empty state when interviews list is empty', () => {
    render(
      <MemoryRouter>
        <UpcomingInterviewsCard interviews={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
    expect(screen.getByText(/You have no interviews scheduled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schedule from Applications/i })).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no interviews loaded', () => {
    render(
      <MemoryRouter>
        <UpcomingInterviewsCard isLoading={true} interviews={[]} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('upcoming-interviews-loading-card')).toBeInTheDocument();
  });

  it('renders error state and invokes onRetry callback when clicked', async () => {
    const user = userEvent.setup();
    const mockRetry = vi.fn();

    render(
      <MemoryRouter>
        <UpcomingInterviewsCard
          error="Failed to load interviews"
          interviews={[]}
          onRetry={mockRetry}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('upcoming-interviews-error-card')).toBeInTheDocument();
    expect(screen.getByText('Failed to load interviews')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await user.click(retryBtn);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
