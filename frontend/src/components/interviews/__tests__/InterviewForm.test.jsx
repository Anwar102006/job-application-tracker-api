import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewForm } from '../InterviewForm';

describe('InterviewForm Component (Phase 6.5E)', () => {
  const mockApplications = [
    { _id: 'app-1', company: 'Google', jobTitle: 'Frontend Lead', isArchived: false },
    { _id: 'app-2', company: 'Meta', jobTitle: 'Fullstack Dev', isArchived: true },
  ];

  const defaultProps = {
    mode: 'create',
    applications: mockApplications,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    serverErrors: {},
    generalError: '',
  };

  it('renders create form with required inputs and accessible labels', () => {
    render(<InterviewForm {...defaultProps} />);

    expect(screen.getByTestId('interview-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Job Application/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interview Round/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Format \/ Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date & Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meeting Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interviewers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preparation & Follow-up Notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schedule Interview/i })).toBeInTheDocument();
  });

  it('validates required fields on client-side before submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<InterviewForm {...defaultProps} onSubmit={handleSubmit} />);

    // Click submit without filling required fields
    const submitBtn = screen.getByRole('button', { name: /Schedule Interview/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Please select a job application/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview date and time is required/i)).toBeInTheDocument();
  });

  it('validates duration bounds (15 to 480 minutes)', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<InterviewForm {...defaultProps} onSubmit={handleSubmit} selectedApplicationId="app-1" />);

    const durationInput = screen.getByLabelText(/Duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, '10'); // Below 15

    const dateInput = screen.getByLabelText(/Date & Time/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-30T10:00' } });

    await user.click(screen.getByRole('button', { name: /Schedule Interview/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Duration must be between 15 and 480 minutes/i)).toBeInTheDocument();
  });

  it('prevents scheduling against an archived application', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <InterviewForm
        {...defaultProps}
        onSubmit={handleSubmit}
        selectedApplicationId="app-2" // app-2 is isArchived: true
      />
    );

    const dateInput = screen.getByLabelText(/Date & Time/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-30T10:00' } });

    await user.click(screen.getByRole('button', { name: /Schedule Interview/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Cannot schedule an interview for an archived application/i)).toBeInTheDocument();
  });

  it('submits valid payload in create mode without status field', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<InterviewForm {...defaultProps} onSubmit={handleSubmit} selectedApplicationId="app-1" />);

    const roundSelect = screen.getByLabelText(/Interview Round/i);
    fireEvent.change(roundSelect, { target: { value: 'Technical Round' } });

    const formatSelect = screen.getByLabelText(/Format \/ Mode/i);
    fireEvent.change(formatSelect, { target: { value: 'Video Call' } });

    const dateInput = screen.getByLabelText(/Date & Time/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-25T14:30' } });

    const linkInput = screen.getByLabelText(/Meeting Link/i);
    await user.type(linkInput, 'https://meet.google.com/xyz-abc');

    const interviewersInput = screen.getByLabelText(/Interviewers/i);
    await user.type(interviewersInput, 'Jane Doe, John Smith');

    await user.click(screen.getByRole('button', { name: /Schedule Interview/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const [payload, appId] = handleSubmit.mock.calls[0];

    expect(appId).toBe('app-1');
    expect(payload.round).toBe('Technical Round');
    expect(payload.format).toBe('Video Call');
    expect(payload.meetingLink).toBe('https://meet.google.com/xyz-abc');
    expect(payload.interviewers).toEqual(['Jane Doe', 'John Smith']);
    // Crucial rule: status must NOT be in create payload!
    expect(payload).not.toHaveProperty('status');
  });

  it('renders edit mode with status select and valid transitions for Scheduled status', () => {
    const initialData = {
      _id: 'intv-100',
      applicationId: { _id: 'app-1', company: 'Google', jobTitle: 'Frontend Lead' },
      round: 'Technical Round',
      interviewDate: '2026-10-25T14:30:00.000Z',
      durationMinutes: 60,
      format: 'Video Call',
      status: 'Scheduled',
    };

    render(
      <InterviewForm
        {...defaultProps}
        mode="edit"
        initialData={initialData}
      />
    );

    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    const statusSelect = screen.getByLabelText(/Interview Status/i);
    expect(statusSelect).toBeInTheDocument();

    // Valid transitions from Scheduled: Completed, Rescheduled, Cancelled, No Show
    expect(screen.getByRole('option', { name: /Completed/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Rescheduled/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Cancelled/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /No Show/i })).toBeInTheDocument();
  });

  it('locks status when interview is in terminal state (Completed or Cancelled)', () => {
    const initialData = {
      _id: 'intv-200',
      applicationId: { _id: 'app-1', company: 'Google', jobTitle: 'Frontend Lead' },
      round: 'Technical Round',
      interviewDate: '2026-10-20T10:00:00.000Z',
      status: 'Completed',
    };

    render(
      <InterviewForm
        {...defaultProps}
        mode="edit"
        initialData={initialData}
      />
    );

    expect(screen.getByTestId('interview-status-locked')).toBeInTheDocument();
    expect(screen.getByText(/Interviews in 'Completed' state cannot be transitioned/i)).toBeInTheDocument();
  });

  it('renders 409 Schedule Conflict banner without clearing user-entered data', () => {
    const conflictMessage = 'Interview schedule conflict: You already have an active interview scheduled during this time window.';

    render(
      <InterviewForm
        {...defaultProps}
        generalError={conflictMessage}
        selectedApplicationId="app-1"
      />
    );

    const errorBanner = screen.getByTestId('interview-form-error');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent(/Schedule Conflict/i);
    expect(errorBanner).toHaveTextContent(conflictMessage);
  });

  it('displays field-level server validation errors', () => {
    const serverErrors = {
      round: 'Interview round is required',
      durationMinutes: 'Duration must be an integer',
    };

    render(
      <InterviewForm
        {...defaultProps}
        serverErrors={serverErrors}
        selectedApplicationId="app-1"
      />
    );

    expect(screen.getByText('Interview round is required')).toBeInTheDocument();
    expect(screen.getByText('Duration must be an integer')).toBeInTheDocument();
  });

  it('disables submit button and calls onCancel', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();

    const { rerender } = render(
      <InterviewForm {...defaultProps} onCancel={handleCancel} isLoading={false} />
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    rerender(<InterviewForm {...defaultProps} isLoading={true} />);
    const submitBtn = screen.getByTestId('interview-submit-btn');
    expect(submitBtn).toBeDisabled();
  });
});
