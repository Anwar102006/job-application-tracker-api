import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InterviewDetailsPage } from '../InterviewDetailsPage';
import * as interviewService from '../../services/interviewService';
import toast from 'react-hot-toast';

vi.mock('../../services/interviewService');
vi.mock('react-hot-toast');

describe('InterviewDetailsPage Component (Phase 6.5E)', () => {
  const mockInterview = {
    _id: 'intv-888',
    round: 'Technical Round',
    interviewDate: '2026-10-30T14:00:00.000Z',
    durationMinutes: 60,
    format: 'Video Call',
    status: 'Scheduled',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewers: ['Alice Engineer', 'Bob Architect'],
    notes: 'Review system design concepts and portfolio code.',
    applicationId: {
      _id: 'app-999',
      company: 'Amazon Web Services',
      jobTitle: 'Senior Cloud Architect',
      status: 'Interviewing',
      priority: 'High',
      isArchived: false,
    },
  };

  const renderInterviewDetailsPage = (id = 'intv-888') => {
    return render(
      <MemoryRouter initialEntries={[`/interviews/${id}`]}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailsPage />} />
          <Route path="/interviews" element={<div data-testid="mock-interviews-list">Interviews List</div>} />
          <Route path="/applications/:id" element={<div data-testid="mock-app-details">Application Details</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. displays loading indicator while fetching interview details', () => {
    interviewService.getInterviewById.mockReturnValue(new Promise(() => {}));

    renderInterviewDetailsPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('2. renders complete interview details and associated application', async () => {
    interviewService.getInterviewById.mockResolvedValueOnce({
      data: { success: true, data: mockInterview },
    });

    renderInterviewDetailsPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Technical Round/i })).toBeInTheDocument();
      expect(screen.getAllByText('Amazon Web Services').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Senior Cloud Architect').length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Review system design concepts and portfolio code/i)).toBeInTheDocument();
    expect(screen.getByText('Alice Engineer')).toBeInTheDocument();
    expect(screen.getByText('Bob Architect')).toBeInTheDocument();
    expect(screen.getByTestId('details-meeting-link')).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij'
    );
  });

  it('3. renders 404 Not Found state when interview does not exist', async () => {
    const error404 = { response: { status: 404, data: { message: 'Interview not found' } } };
    interviewService.getInterviewById.mockRejectedValueOnce(error404);

    renderInterviewDetailsPage('non-existent');

    await waitFor(() => {
      expect(screen.getByText(/Interview Not Found/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Back to Interviews/i })).toBeInTheDocument();
  });

  it('4. opens edit modal and successfully reschedules interview', async () => {
    const user = userEvent.setup();
    interviewService.getInterviewById.mockResolvedValueOnce({
      data: { success: true, data: mockInterview },
    });

    const updatedInterview = {
      ...mockInterview,
      status: 'Rescheduled',
      interviewDate: '2026-11-05T16:00:00.000Z',
    };
    interviewService.updateInterview.mockResolvedValueOnce({
      data: { success: true, data: updatedInterview },
    });

    renderInterviewDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('details-edit-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('details-edit-btn'));

    // Modal opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const statusSelect = screen.getByTestId('interview-status-select');
    fireEvent.change(statusSelect, { target: { value: 'Rescheduled' } });

    const submitBtn = screen.getByTestId('interview-submit-btn');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(interviewService.updateInterview).toHaveBeenCalledWith(
        'intv-888',
        expect.objectContaining({ status: 'Rescheduled' })
      );
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Interview updated successfully/i));
    });
  });

  it('5. opens delete confirmation and navigates to /interviews upon deletion', async () => {
    const user = userEvent.setup();
    interviewService.getInterviewById.mockResolvedValueOnce({
      data: { success: true, data: mockInterview },
    });
    interviewService.deleteInterview.mockResolvedValueOnce({
      data: { success: true, message: 'Interview deleted' },
    });

    renderInterviewDetailsPage();

    await waitFor(() => {
      expect(screen.getByTestId('details-delete-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('details-delete-btn'));

    expect(screen.getByText(/Are you sure you want to permanently delete this/i)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-delete-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(interviewService.deleteInterview).toHaveBeenCalledWith('intv-888');
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Interview deleted successfully/i));
      // Navigates back to /interviews
      expect(screen.getByTestId('mock-interviews-list')).toBeInTheDocument();
    });
  });
});
