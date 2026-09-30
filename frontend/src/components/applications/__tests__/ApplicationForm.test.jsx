import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationForm } from '../ApplicationForm';

describe('ApplicationForm Component (Phase 6.5D)', () => {
  const defaultProps = {
    mode: 'create',
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    serverErrors: {},
    generalError: '',
  };

  it('14. renders create form with all required inputs and accessible labels', () => {
    render(<ApplicationForm {...defaultProps} />);

    expect(screen.getByTestId('application-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Application Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Workplace Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Posting URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date Applied/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Application Deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal Notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Application/i })).toBeInTheDocument();
  });

  it('15. performs client-side validation on required fields and invalid salary range', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ApplicationForm {...defaultProps} onSubmit={handleSubmit} />);

    // Clear any default and leave company and job title empty
    const submitBtn = screen.getByRole('button', { name: /Create Application/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Company name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Job title is required/i)).toBeInTheDocument();

    // Now fill company and job title, but make salary min > salary max
    const companyInput = screen.getByLabelText(/Company Name/i);
    const jobTitleInput = screen.getByLabelText(/Job Title/i);
    const minSalaryInput = screen.getByLabelText(/Min Salary/i);
    const maxSalaryInput = screen.getByLabelText(/Max Salary/i);

    await user.type(companyInput, 'Netflix');
    await user.type(jobTitleInput, 'Frontend Engineer');
    await user.type(minSalaryInput, '200000');
    await user.type(maxSalaryInput, '100000');

    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Minimum salary cannot exceed maximum salary/i)).toBeInTheDocument();
  });

  it('16. submits sanitized payload when valid data is entered', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ApplicationForm {...defaultProps} onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/Company Name/i), 'Microsoft');
    await user.type(screen.getByLabelText(/Job Title/i), 'Full Stack Engineer');
    await user.type(screen.getByLabelText(/Location/i), 'Redmond, WA');
    await user.type(screen.getByLabelText(/Min Salary/i), '120000');
    await user.type(screen.getByLabelText(/Max Salary/i), '160000');

    // Change status to Ghosted to ensure Ghosted is supported
    const statusSelect = screen.getByLabelText(/Application Status/i);
    fireEvent.change(statusSelect, { target: { value: 'Ghosted' } });

    await user.click(screen.getByRole('button', { name: /Create Application/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.company).toBe('Microsoft');
    expect(payload.jobTitle).toBe('Full Stack Engineer');
    expect(payload.status).toBe('Ghosted');
    expect(payload.location).toBe('Redmond, WA');
    expect(payload.salary).toEqual({
      min: 120000,
      max: 160000,
      currency: 'USD',
      period: 'Yearly',
    });
  });

  it('17. displays backend validation errors and general error cleanly', () => {
    const serverErrors = {
      company: 'Company name already registered for this role',
      jobUrl: 'Invalid URL format',
    };
    const generalError = 'Backend rejected this submission due to invalid data';

    render(
      <ApplicationForm
        {...defaultProps}
        serverErrors={serverErrors}
        generalError={generalError}
      />
    );

    expect(screen.getByText(/Backend rejected this submission/i)).toBeInTheDocument();
    expect(screen.getByText('Company name already registered for this role')).toBeInTheDocument();
    expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
  });

  it('18. loads existing data in edit mode and disables status for terminal state', () => {
    const initialData = {
      company: 'Amazon',
      jobTitle: 'Cloud Architect',
      status: 'Rejected', // Terminal state in backend
      priority: 'High',
      jobType: 'Contract',
      workplaceType: 'Remote',
      location: 'Seattle, WA',
      salary: {
        min: 180000,
        max: 220000,
        currency: 'USD',
        period: 'Yearly',
      },
      notes: 'Initial interview was positive',
    };

    render(
      <ApplicationForm
        {...defaultProps}
        mode="edit"
        initialData={initialData}
      />
    );

    expect(screen.getByLabelText(/Company Name/i)).toHaveValue('Amazon');
    expect(screen.getByLabelText(/Job Title/i)).toHaveValue('Cloud Architect');
    expect(screen.getByLabelText(/Location/i)).toHaveValue('Seattle, WA');
    expect(screen.getByLabelText(/Min Salary/i)).toHaveValue(180000);
    expect(screen.getByLabelText(/Max Salary/i)).toHaveValue(220000);
    expect(screen.getByLabelText(/Personal Notes/i)).toHaveValue('Initial interview was positive');

    // Terminal state Rejected disables status changing
    const statusSelect = screen.getByLabelText(/Application Status/i);
    expect(statusSelect).toBeDisabled();
    expect(screen.getByText(/Cannot change status from terminal state 'Rejected'/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });
});
