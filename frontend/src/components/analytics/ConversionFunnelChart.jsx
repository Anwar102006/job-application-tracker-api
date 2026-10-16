import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../atoms';
import { Filter, ArrowRight, Award, Calendar, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Conversion Funnel & Progression Component (Phase 6.5F)
 *
 * Visualizes candidate progression through application lifecycle stages:
 * Applications -> Interviews -> Offers, plus overall rejection statistics.
 */
export const ConversionFunnelChart = ({ data }) => {
  const {
    totalApplications = 0,
    applicationsWithInterviews = 0,
    offeredApplications = 0,
    rejectedApplications = 0,
    applicationToInterviewRate = 0,
    interviewToOfferRate = 0,
    applicationToOfferRate = 0,
    applicationToRejectionRate = 0,
  } = data || {};

  const stages = [
    {
      id: 'applications',
      title: 'Total Applications',
      count: totalApplications,
      rate: totalApplications > 0 ? 100 : 0,
      rateLabel: '100% baseline',
      icon: Filter,
      color: 'var(--accent)',
      barColor: 'var(--accent)',
    },
    {
      id: 'interviews',
      title: 'Applications with Interviews',
      count: applicationsWithInterviews,
      rate: applicationToInterviewRate,
      rateLabel: `${applicationToInterviewRate}% of apps reached interview`,
      conversionStep: `${applicationToInterviewRate}% conversion`,
      icon: Calendar,
      color: '#8b5cf6',
      barColor: '#8b5cf6',
    },
    {
      id: 'offers',
      title: 'Job Offers Extended',
      count: offeredApplications,
      rate: applicationToOfferRate,
      rateLabel: `${applicationToOfferRate}% overall offer rate (${interviewToOfferRate}% of interviews)`,
      conversionStep: `${interviewToOfferRate}% interview-to-offer`,
      icon: Award,
      color: 'var(--success)',
      barColor: 'var(--success)',
    },
  ];

  return (
    <Card className="conversion-funnel-card" data-testid="conversion-funnel-card">
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Filter size={20} color="var(--accent)" aria-hidden="true" />
          <div>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Progression rates from application submission to interview rounds and offers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {totalApplications === 0 ? (
          <div
            style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No applications tracked yet. Start applying to populate your conversion funnel.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Visual Funnel Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                // Calculate visual bar width relative to total applications, minimum 4% if count > 0
                const percentOfTotal = totalApplications > 0
                  ? Math.max(stage.count > 0 ? 6 : 0, Math.round((stage.count / totalApplications) * 100))
                  : 0;

                return (
                  <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={16} color={stage.color} aria-hidden="true" />
                        <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                          {stage.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontWeight: 'var(--font-bold)',
                            color: 'var(--text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {stage.count}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            minWidth: '55px',
                            textAlign: 'right',
                          }}
                        >
                          {stage.rateLabel.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div
                      style={{
                        height: 12,
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                      role="progressbar"
                      aria-valuenow={stage.count}
                      aria-valuemin={0}
                      aria-valuemax={totalApplications}
                      aria-label={`${stage.title}: ${stage.count}`}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentOfTotal}%`,
                          backgroundColor: stage.barColor,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width var(--transition-normal)',
                        }}
                      />
                    </div>

                    {/* Funnel Step Transition Note */}
                    {idx < stages.length - 1 && stages[idx + 1].conversionStep && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          paddingLeft: '0.5rem',
                          margin: '0.125rem 0',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ArrowRight size={12} aria-hidden="true" />
                        <span>{stages[idx + 1].conversionStep}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Key Funnel Rates Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2px' }}>
                  <Calendar size={14} color="#8b5cf6" aria-hidden="true" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Interview Reach
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                  {applicationToInterviewRate}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {applicationsWithInterviews} of {totalApplications} applications
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2px' }}>
                  <CheckCircle2 size={14} color="var(--success)" aria-hidden="true" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Interview-to-Offer
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                  {interviewToOfferRate}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {offeredApplications} of {applicationsWithInterviews} interviewed
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2px' }}>
                  <Award size={14} color="var(--success)" aria-hidden="true" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Overall Offer Rate
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                  {applicationToOfferRate}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {offeredApplications} offers out of {totalApplications} apps
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2px' }}>
                  <XCircle size={14} color="var(--danger)" aria-hidden="true" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Rejection Rate
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                  {applicationToRejectionRate}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {rejectedApplications} rejections ({applicationToRejectionRate}%)
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

ConversionFunnelChart.propTypes = {
  data: PropTypes.shape({
    totalApplications: PropTypes.number,
    applicationsWithInterviews: PropTypes.number,
    offeredApplications: PropTypes.number,
    rejectedApplications: PropTypes.number,
    applicationToInterviewRate: PropTypes.number,
    interviewToOfferRate: PropTypes.number,
    applicationToOfferRate: PropTypes.number,
    applicationToRejectionRate: PropTypes.number,
  }),
};

export default ConversionFunnelChart;
