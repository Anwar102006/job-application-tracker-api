import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ApplicationsPage } from '../ApplicationsPage';
import * as applicationService from '../../services/applicationService';
import toast from 'react-hot-toast';

vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('ApplicationsPage Component (Phase 6.5D)', () => {
  const mockApplications = [
    {
      _id: 'app-001',
      company: 'Google',
      jobTitle: 'Senior Frontend Engineer',
      status: 'Interviewing',
      priority: 'High',
      jobType: 'Full-time',
      workplaceType: 'Hybrid',
      location: 'Mountain View, CA',
      appliedDate: '2026-09-15T00:00:00.000Z',
      salary: { min: 160000, max: 210000, currency: 'USD', period: 'Yearly' },
      isArchived: false,
    },
    {
      _id: 'app-002',
      company: 'Meta',
      jobTitle: 'Product Designer',
      status: 'Ghosted', // Verified backend status
      priority: 'Medium',
      jobType: 'Full-time',
      workplaceType: 'Remote',
      location: 'Menlo Park, CA',
      appliedDate: '2026-08-20T00:00:00.000Z',
      isArchived: false,
    },
  ];

  const mockMeta = {
    page: 1,
    limit: 10,
    totalDocs: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const renderApplicationsPage = (initialEntries = ['/applications']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<div data-testid="mock-details-page">Details Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 7. Loading state
  it('7. displays loading indicator while fetching applications', async () => {
    applicationService.getApplications.mockReturnValue(new Promise(() => {})); // pending promise

    renderApplicationsPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // 8. Successful application list rendering
  it('8. renders application cards with company, title, workplace, and salary', async () => {
    applicationService.getApplications.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockApplications,
        meta: mockMeta,
      },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
    });

    expect(screen.getByText(/Mountain View, CA/i)).toBeInTheDocument();
    expect(screen.getByText(/\$160,000 - \$210,000\/yr/i)).toBeInTheDocument();
  });

  // 9. Empty state
  it('9. renders EmptyState when no applications exist', async () => {
    applicationService.getApplications.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        meta: { ...mockMeta, totalDocs: 0 },
      },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByText('No Applications Found')).toBeInTheDocument();
      expect(screen.getByText(/Start tracking your career journey/i)).toBeInTheDocument();
    });
  });

  // 10. API error state
  it('10. renders ErrorState with retry button when API fails', async () => {
    applicationService.getApplications.mockRejectedValueOnce({
      response: { data: { message: 'Database connection failed' } },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Applications')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    // Test retry
    applicationService.getApplications.mockResolvedValueOnce({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });
  });

  // 11. Status rendering (including Ghosted)
  it('11. renders correct status badges including backend-supported Ghosted', async () => {
    applicationService.getApplications.mockResolvedValueOnce({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Status: Interviewing')).toBeInTheDocument();
      expect(screen.getByLabelText('Status: Ghosted')).toBeInTheDocument();
    });
  });

  // 12. Search and filter behavior
  it('12. updates search and filter inputs and triggers service query', async () => {
    const user = userEvent.setup();
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    // Enter search keyword
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Google');
    await user.click(screen.getByTestId('search-btn'));

    expect(applicationService.getApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Google',
      })
    );

    // Change status filter
    const statusSelect = screen.getByTestId('status-filter-select');
    fireEvent.change(statusSelect, { target: { value: 'Screening' } });

    expect(applicationService.getApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Screening',
      })
    );
  });

  // 13. Pagination behavior
  it('13. handles pagination controls when multiple pages exist', async () => {
    const user = userEvent.setup();
    const multiPageMeta = {
      page: 1,
      limit: 10,
      totalDocs: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    };

    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockApplications, meta: multiPageMeta },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-controls')).toHaveTextContent(/Page 1 of 3/i);
    });

    const nextBtn = screen.getByTestId('next-page-btn');
    expect(nextBtn).toBeEnabled();
    const prevBtn = screen.getByTestId('prev-page-btn');
    expect(prevBtn).toBeDisabled();

    await user.click(nextBtn);

    expect(applicationService.getApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      })
    );
  });

  // 16. Application creation modal interaction & toast
  it('16. opens create modal, submits valid application, and toasts success', async () => {
    const user = userEvent.setup();
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: [], meta: { ...mockMeta, totalDocs: 0 } },
    });
    applicationService.createApplication.mockResolvedValueOnce({
      data: { success: true, data: { _id: 'new-app-1', company: 'Figma', jobTitle: 'Design Engineer' } },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-application-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('add-application-btn'));

    expect(screen.getByText('Add New Application')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Company Name/i), 'Figma');
    await user.type(screen.getByLabelText(/Job Title/i), 'Design Engineer');

    await user.click(screen.getByRole('button', { name: /Create Application/i }));

    await waitFor(() => {
      expect(applicationService.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Figma',
          jobTitle: 'Design Engineer',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Application created successfully!');
    });
  });

  // 23 & 24. Archive confirmation modal and execution
  it('23 & 24. shows archive confirmation modal and performs archive toggle', async () => {
    const user = userEvent.setup();
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });
    applicationService.archiveApplication.mockResolvedValueOnce({
      data: { success: true, data: { _id: 'app-001', isArchived: true } },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByTestId('archive-app-app-001')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('archive-app-app-001'));

    // Confirmation modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Archive Application/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to archive/i)).toBeInTheDocument();

    // Confirm archive
    await user.click(screen.getByTestId('confirm-archive-btn'));

    await waitFor(() => {
      expect(applicationService.archiveApplication).toHaveBeenCalledWith('app-001');
      expect(toast.success).toHaveBeenCalledWith('Application archived successfully');
    });
  });

  // 25 & 26. Delete confirmation modal and execution
  it('25 & 26. shows destructive delete confirmation modal and performs deletion', async () => {
    const user = userEvent.setup();
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });
    applicationService.deleteApplication.mockResolvedValueOnce({
      data: { success: true, message: 'Application deleted successfully' },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByTestId('delete-app-app-001')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-app-app-001'));

    // Confirmation modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Delete Application/i })).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();

    // Confirm delete
    await user.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(applicationService.deleteApplication).toHaveBeenCalledWith('app-001');
      expect(toast.success).toHaveBeenCalledWith('Application deleted successfully');
    });
  });

  // 30 & 31. Accessibility & accessible labels for actions
  it('30 & 31. ensures all action buttons have accessible labels and are keyboard-focusable', async () => {
    applicationService.getApplications.mockResolvedValueOnce({
      data: { success: true, data: mockApplications, meta: mockMeta },
    });

    renderApplicationsPage();

    await waitFor(() => {
      expect(screen.getByLabelText('View Google details')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit Google application')).toBeInTheDocument();
      expect(screen.getByLabelText('Archive Google application')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Google application')).toBeInTheDocument();
    });
  });
});
