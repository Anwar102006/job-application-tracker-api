import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApplicationPipeline } from '../ApplicationPipeline';

describe('ApplicationPipeline (Phase 6.5G)', () => {
  const mockBreakdown = {
    byStatus: {
      Applied: 5,
      Screening: 2,
      Interviewing: 3,
      Offered: 1,
      Rejected: 2,
      Withdrawn: 1,
      Ghosted: 0,
    },
  };

  it('renders all 7 backend application statuses with correct counts', () => {
    render(
      <MemoryRouter>
        <ApplicationPipeline
          breakdown={mockBreakdown}
          totalApplications={14}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Application Pipeline/i })).toBeInTheDocument();
    expect(screen.getByText('(14 applications)')).toBeInTheDocument();

    expect(screen.getByTestId('pipeline-count-applied')).toHaveTextContent('5');
    expect(screen.getByTestId('pipeline-count-screening')).toHaveTextContent('2');
    expect(screen.getByTestId('pipeline-count-interviewing')).toHaveTextContent('3');
    expect(screen.getByTestId('pipeline-count-offered')).toHaveTextContent('1');
    expect(screen.getByTestId('pipeline-count-rejected')).toHaveTextContent('2');
    expect(screen.getByTestId('pipeline-count-withdrawn')).toHaveTextContent('1');
    expect(screen.getByTestId('pipeline-count-ghosted')).toHaveTextContent('0');

    // Progress bar exists for positive counts
    expect(screen.getByTestId('pipeline-progress-bar')).toBeInTheDocument();
  });

  it('renders status pills with links to filtered application views', () => {
    render(
      <MemoryRouter>
        <ApplicationPipeline
          breakdown={mockBreakdown}
          totalApplications={14}
        />
      </MemoryRouter>
    );

    const interviewingLink = screen.getByTestId('pipeline-status-interviewing');
    expect(interviewingLink).toHaveAttribute('href', '/applications?status=Interviewing');

    const offeredLink = screen.getByTestId('pipeline-status-offered');
    expect(offeredLink).toHaveAttribute('href', '/applications?status=Offered');
  });

  it('handles empty state safely when totalApplications is 0 without division by zero', () => {
    render(
      <MemoryRouter>
        <ApplicationPipeline
          breakdown={{ byStatus: {} }}
          totalApplications={0}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('pipeline-empty-notice')).toHaveTextContent('No active applications in the pipeline yet.');
    expect(screen.getByTestId('pipeline-count-applied')).toHaveTextContent('0');
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/i)).not.toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no breakdown exists', () => {
    render(
      <MemoryRouter>
        <ApplicationPipeline isLoading={true} breakdown={null} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('pipeline-loading-card')).toBeInTheDocument();
  });

  it('renders error state and triggers onRetry callback when retry button is clicked', async () => {
    const user = userEvent.setup();
    const mockRetry = vi.fn();

    render(
      <MemoryRouter>
        <ApplicationPipeline
          error="Network Error"
          breakdown={null}
          onRetry={mockRetry}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('pipeline-error-card')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await user.click(retryBtn);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders all 10 analytics contract statuses plus backend statuses without omitting valid stages', () => {
    const fullContractBreakdown = {
      byStatus: {
        Applied: 6,
        Interviewing: 4,
        Offered: 2,
        Rejected: 3,
        Draft: 1,
        Shortlisted: 5,
        Accepted: 1,
        Declined: 2,
        Withdrawn: 1,
        Ghosted: 1,
        Screening: 2,
      },
    };

    render(
      <MemoryRouter>
        <ApplicationPipeline
          breakdown={fullContractBreakdown}
          totalApplications={28}
        />
      </MemoryRouter>
    );

    // Verify all 10 contract statuses are rendered
    expect(screen.getByTestId('pipeline-count-applied')).toHaveTextContent('6');
    expect(screen.getByTestId('pipeline-count-interviewing')).toHaveTextContent('4');
    expect(screen.getByTestId('pipeline-count-offered')).toHaveTextContent('2');
    expect(screen.getByTestId('pipeline-count-rejected')).toHaveTextContent('3');
    expect(screen.getByTestId('pipeline-count-draft')).toHaveTextContent('1');
    expect(screen.getByTestId('pipeline-count-shortlisted')).toHaveTextContent('5');
    expect(screen.getByTestId('pipeline-count-accepted')).toHaveTextContent('1');
    expect(screen.getByTestId('pipeline-count-declined')).toHaveTextContent('2');
    expect(screen.getByTestId('pipeline-count-withdrawn')).toHaveTextContent('1');
    expect(screen.getByTestId('pipeline-count-ghosted')).toHaveTextContent('1');

    // Verify valid backend status is also preserved
    expect(screen.getByTestId('pipeline-count-screening')).toHaveTextContent('2');
  });
});
