import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InterviewsPage } from '../InterviewsPage';
import * as interviewService from '../../services/interviewService';
import * as applicationService from '../../services/applicationService';
import toast from 'react-hot-toast';

vi.mock('../../services/interviewService');
vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('InterviewsPage Component (Phase 6.5E)', () => {
  const mockUpcoming = [
    {
      _id: 'intv-001',
      round: 'Technical Round',
      interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      durationMinutes: 60,
      format: 'Video Call',
      status: 'Scheduled',
      applicationId: {
        _id: 'app-001',
        company: 'Stripe',
        jobTitle: 'Backend Engineer',
      },
    },
  ];

  const mockInterviews = [
    {
      _id: 'intv-001',
      round: 'Technical Round',
      interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      format: 'Video Call',
      status: 'Scheduled',
      meetingLink: 'https://zoom.us/j/12345',
      interviewers: ['John Doe'],
      notes: 'Prepare system design',
      applicationId: {
        _id: 'app-001',
        company: 'Stripe',
        jobTitle: 'Backend Engineer',
      },
    },
    {
      _id: 'intv-002',
      round: 'HR Screening',
      interviewDate: '2026-10-10T10:00:00.000Z',
      durationMinutes: 30,
      format: 'Phone Call',
      status: 'Completed',
      applicationId: {
        _id: 'app-002',
        company: 'Netflix',
        jobTitle: 'UI Engineer',
      },
    },
  ];

  const mockMeta = {
    page: 1,
    limit: 10,
    totalDocs: 2,
    totalPages: 1,
  };

  const mockApplications = [
    { _id: 'app-001', company: 'Stripe', jobTitle: 'Backend Engineer', isArchived: false },
    { _id: 'app-002', company: 'Netflix', jobTitle: 'UI Engineer', isArchived: false },
  ];

  const renderInterviewsPage = (initialEntries = ['/interviews']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/interviews/:id" element={<div data-testid="mock-interview-details">Interview Details</div>} />
          <Route path="/applications/:id" element={<div data-testid="mock-app-details">App Details</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockApplications },
    });
  });

  it('1. displays loading indicators while fetching upcoming and all interviews', () => {
    interviewService.getUpcomingInterviews.mockReturnValue(new Promise(() => {}));
    interviewService.getInterviews.mockReturnValue(new Promise(() => {}));

    renderInterviewsPage();

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('2. successfully renders upcoming interviews and main interview list', async () => {
    interviewService.getUpcomingInterviews.mockResolvedValueOnce({
      data: { success: true, data: mockUpcoming },
    });
    interviewService.getInterviews.mockResolvedValueOnce({
      data: { success: true, data: mockInterviews, meta: mockMeta },
    });

    renderInterviewsPage();

    await waitFor(() => {
      // Upcoming interview card
      expect(screen.getByTestId('upcoming-interview-card')).toBeInTheDocument();
      // Main interview table rows
      expect(screen.getByTestId('interview-row-intv-001')).toBeInTheDocument();
      expect(screen.getByTestId('interview-row-intv-002')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Stripe/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Netflix/i).length).toBeGreaterThan(0);
  });

  it('3. renders empty state when no interviews exist', async () => {
    interviewService.getUpcomingInterviews.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });
    interviewService.getInterviews.mockResolvedValueOnce({
      data: { success: true, data: [], meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 } },
    });

    renderInterviewsPage();

    await waitFor(() => {
      expect(screen.getByText(/No upcoming interviews in the next 7 days/i)).toBeInTheDocument();
      expect(screen.getByText(/No interviews scheduled yet/i)).toBeInTheDocument();
    });
  });

  it('4. displays retryable error state when loading interviews fails', async () => {
    interviewService.getUpcomingInterviews.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });
    interviewService.getInterviews.mockRejectedValueOnce(new Error('Network error loading interviews'));

    renderInterviewsPage();

    await waitFor(() => {
      expect(screen.getByText(/Network error loading interviews/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    expect(retryBtn).toBeInTheDocument();

    // Mock success on retry
    interviewService.getInterviews.mockResolvedValueOnce({
      data: { success: true, data: mockInterviews, meta: mockMeta },
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('interview-row-intv-001')).toBeInTheDocument();
    });
  });

  it('5. opens schedule modal and successfully schedules an interview', async () => {
    const user = userEvent.setup();
    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
    interviewService.getInterviews.mockResolvedValue({
      data: { success: true, data: [], meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 } },
    });
    interviewService.createInterview.mockResolvedValueOnce({
      data: { success: true, data: { _id: 'new-intv', round: 'HR Screening' } },
    });

    renderInterviewsPage();

    await waitFor(() => {
      expect(screen.getByTestId('schedule-interview-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('schedule-interview-btn'));

    // Modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Select application
    const appSelect = screen.getByLabelText(/Target Job Application/i);
    fireEvent.change(appSelect, { target: { value: 'app-001' } });

    // Date
    const dateInput = screen.getByLabelText(/Date & Time/i);
    fireEvent.change(dateInput, { target: { value: '2026-11-01T15:00' } });

    // Submit
    const submitBtn = screen.getByTestId('interview-submit-btn');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(interviewService.createInterview).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Interview scheduled successfully/i));
    });
  });

  it('6. handles 409 Conflict during schedule without closing modal or losing input', async () => {
    const user = userEvent.setup();
    interviewService.getUpcomingInterviews.mockResolvedValue({ data: { success: true, data: [] } });
    interviewService.getInterviews.mockResolvedValue({
      data: { success: true, data: [], meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 } },
    });

    const conflictErr = {
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            message: 'Interview schedule conflict: You already have an active interview scheduled during this time window.',
          },
        },
      },
    };
    interviewService.createInterview.mockRejectedValueOnce(conflictErr);

    renderInterviewsPage();

    await waitFor(() => {
      expect(screen.getByTestId('schedule-interview-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('schedule-interview-btn'));

    const appSelect = screen.getByLabelText(/Target Job Application/i);
    fireEvent.change(appSelect, { target: { value: 'app-001' } });

    const dateInput = screen.getByLabelText(/Date & Time/i);
    fireEvent.change(dateInput, { target: { value: '2026-11-01T15:00' } });

    await user.click(screen.getByTestId('interview-submit-btn'));

    await waitFor(() => {
      const banner = screen.getByTestId('interview-form-error');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Schedule Conflict/i);
    });

    // Modal remains open and date input is preserved
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Date & Time/i).value).toBe('2026-11-01T15:00');
  });

  it('7. opens delete modal and confirms deletion', async () => {
    const user = userEvent.setup();
    interviewService.getUpcomingInterviews.mockResolvedValue({ data: { success: true, data: [] } });
    interviewService.getInterviews.mockResolvedValue({
      data: { success: true, data: mockInterviews, meta: mockMeta },
    });
    interviewService.deleteInterview.mockResolvedValueOnce({
      data: { success: true, message: 'Deleted' },
    });

    renderInterviewsPage();

    await waitFor(() => {
      expect(screen.getByTestId('delete-interview-intv-001')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-interview-intv-001'));

    // Confirmation dialog
    expect(screen.getByText(/Are you sure you want to permanently delete this/i)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-delete-interview-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(interviewService.deleteInterview).toHaveBeenCalledWith('intv-001');
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Interview deleted successfully/i));
    });
  });
});
