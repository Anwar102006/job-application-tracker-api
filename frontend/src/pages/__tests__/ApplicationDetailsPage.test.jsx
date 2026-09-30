import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ApplicationDetailsPage } from '../ApplicationDetailsPage';
import * as applicationService from '../../services/applicationService';
import toast from 'react-hot-toast';

vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('ApplicationDetailsPage Component (Phase 6.5D)', () => {
  const mockApp = {
    _id: 'app-999',
    company: 'Netflix',
    jobTitle: 'Senior Infrastructure Engineer',
    status: 'Interviewing',
    priority: 'High',
    jobType: 'Full-time',
    workplaceType: 'Remote',
    location: 'Los Gatos, CA',
    appliedDate: '2026-09-01T00:00:00.000Z',
    deadline: '2026-10-15T00:00:00.000Z',
    createdAt: '2026-09-01T12:00:00.000Z',
    salary: {
      min: 220000,
      max: 280000,
      currency: 'USD',
      period: 'Yearly',
    },
    jobUrl: 'https://jobs.netflix.com/jobs/12345',
    notes: 'Completed system design interview. Waiting for feedback.',
    isArchived: false,
  };

  const renderDetailsPage = (appId = 'app-999') => {
    return render(
      <MemoryRouter initialEntries={[`/applications/${appId}`]}>
        <Routes>
          <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="/applications" element={<div data-testid="applications-list-page">Applications List</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 20. Details loading
  it('20. displays loading indicator while fetching application details', () => {
    applicationService.getApplicationById.mockReturnValue(new Promise(() => {})); // pending promise

    renderDetailsPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // 21. Details rendering
  it('21. renders full application metadata accurately', async () => {
    applicationService.getApplicationById.mockResolvedValueOnce({
      data: { success: true, data: mockApp },
    });

    renderDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('details-job-title')).toHaveTextContent('Senior Infrastructure Engineer');
      expect(screen.getByTestId('details-company')).toHaveTextContent('Netflix');
      expect(screen.getByLabelText('Status: Interviewing')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority: High')).toBeInTheDocument();
    });

    expect(screen.getByTestId('details-job-type')).toHaveTextContent('Full-time');
    expect(screen.getByTestId('details-workplace-type')).toHaveTextContent('Remote');
    expect(screen.getByTestId('details-salary')).toHaveTextContent('$220,000 - $280,000 per year');
    expect(screen.getByTestId('details-job-url')).toHaveAttribute('href', 'https://jobs.netflix.com/jobs/12345');
    expect(screen.getByTestId('details-notes')).toHaveTextContent('Completed system design interview. Waiting for feedback.');
  });

  // 22. 404 / Error handling
  it('22. renders not found state when application does not exist (404)', async () => {
    applicationService.getApplicationById.mockRejectedValueOnce({
      response: { status: 404, data: { message: 'Job application not found' } },
    });

    renderDetailsPage('non-existent-id');

    await waitFor(() => {
      expect(screen.getByText('Application Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Applications/i })).toBeInTheDocument();
    });
  });

  it('22b. renders ErrorState with retry button on unexpected server failure', async () => {
    applicationService.getApplicationById.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Internal Server Error' } },
    });

    renderDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Application')).toBeInTheDocument();
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });

    // Test retry
    applicationService.getApplicationById.mockResolvedValueOnce({
      data: { success: true, data: mockApp },
    });

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('details-company')).toHaveTextContent('Netflix');
    });
  });

  // 19. Successful update from details view
  it('19. allows editing application and displays updated information', async () => {
    const user = userEvent.setup();
    applicationService.getApplicationById.mockResolvedValueOnce({
      data: { success: true, data: mockApp },
    });

    const updatedApp = {
      ...mockApp,
      jobTitle: 'Principal Infrastructure Engineer',
    };

    applicationService.updateApplication.mockResolvedValueOnce({
      data: { success: true, data: updatedApp },
    });

    renderDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('details-edit-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('details-edit-btn'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Edit Application/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Job Title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Principal Infrastructure Engineer');

    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        'app-999',
        expect.objectContaining({
          jobTitle: 'Principal Infrastructure Engineer',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Application updated successfully!');
      expect(screen.getByTestId('details-job-title')).toHaveTextContent('Principal Infrastructure Engineer');
    });
  });

  // Archive restrictions
  it('renders archive notice and disables edit button when application is archived', async () => {
    applicationService.getApplicationById.mockResolvedValueOnce({
      data: { success: true, data: { ...mockApp, isArchived: true } },
    });

    renderDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('archived-banner')).toBeInTheDocument();
      expect(screen.getByTestId('details-edit-btn')).toBeDisabled();
    });
  });

  // Delete from details page navigates back to /applications
  it('deletes application and navigates back to /applications', async () => {
    const user = userEvent.setup();
    applicationService.getApplicationById.mockResolvedValueOnce({
      data: { success: true, data: mockApp },
    });
    applicationService.deleteApplication.mockResolvedValueOnce({
      data: { success: true },
    });

    renderDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('details-delete-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('details-delete-btn'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Delete Application/i })).toBeInTheDocument();

    await user.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(applicationService.deleteApplication).toHaveBeenCalledWith('app-999');
      expect(toast.success).toHaveBeenCalledWith('Application deleted successfully');
      expect(screen.getByTestId('applications-list-page')).toBeInTheDocument();
    });
  });
});
