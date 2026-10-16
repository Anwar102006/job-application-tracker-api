import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { DashboardMetricCard } from '../DashboardMetricCard';

describe('DashboardMetricCard (Phase 6.5G)', () => {
  it('renders title, value, subtitle, and helper text', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          title="Total Applications"
          value={12}
          subtitle="Active submissions"
          helperText="Click to manage"
          icon={Briefcase}
          dataTestId="test-metric-card"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByTestId('test-metric-card-value')).toHaveTextContent('12');
    expect(screen.getByText('Active submissions')).toBeInTheDocument();
    expect(screen.getByText('Click to manage')).toBeInTheDocument();
  });

  it('renders zero values and percentages safely without NaN', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          title="Offer Rate"
          value="0%"
          subtitle="Application to offer"
          variant="success"
          dataTestId="zero-metric-card"
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('zero-metric-card-value')).toHaveTextContent('0%');
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });

  it('renders accessible link when "to" prop is provided', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          title="Applications"
          value={5}
          to="/applications"
          dataTestId="link-metric-card"
        />
      </MemoryRouter>
    );

    const link = screen.getByTestId('link-metric-card');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/applications');
  });

  it('renders without link when "to" prop is omitted', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          title="Unlinked Metric"
          value={99}
          dataTestId="plain-metric-card"
        />
      </MemoryRouter>
    );

    const card = screen.getByTestId('plain-metric-card');
    expect(card.tagName).not.toBe('A');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
