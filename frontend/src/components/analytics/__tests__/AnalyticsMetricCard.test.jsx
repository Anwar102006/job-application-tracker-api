import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Briefcase } from 'lucide-react';
import { AnalyticsMetricCard } from '../AnalyticsMetricCard';

describe('AnalyticsMetricCard Component (Phase 6.5F)', () => {
  it('renders metric card with title, numeric value, and subtitle', () => {
    render(
      <AnalyticsMetricCard
        title="Total Applications"
        value={42}
        subtitle="Active submissions"
        helperText="Excludes archived"
        icon={Briefcase}
        variant="primary"
        dataTestId="metric-total-apps"
      />
    );

    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Active submissions')).toBeInTheDocument();
    expect(screen.getByText('Excludes archived')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total-apps')).toBeInTheDocument();
  });

  it('renders percentage string value and handles different variants', () => {
    const { rerender } = render(
      <AnalyticsMetricCard
        title="Offer Rate"
        value="25.5%"
        variant="success"
        dataTestId="metric-offer-rate"
      />
    );

    expect(screen.getByText('Offer Rate')).toBeInTheDocument();
    expect(screen.getByText('25.5%')).toBeInTheDocument();

    // Rerender with danger variant
    rerender(
      <AnalyticsMetricCard
        title="Rejection Rate"
        value="50.0%"
        variant="danger"
        dataTestId="metric-rejection-rate"
      />
    );

    expect(screen.getByText('Rejection Rate')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('safely handles zero value without crashing or rendering empty', () => {
    render(
      <AnalyticsMetricCard
        title="Total Interviews"
        value={0}
        dataTestId="metric-zero-interviews"
      />
    );

    expect(screen.getByText('Total Interviews')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
