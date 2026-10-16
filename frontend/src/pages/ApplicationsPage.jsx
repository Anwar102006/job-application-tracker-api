import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Input,
  Select,
  Card,
  Modal,
  LoadingIndicator,
  EmptyState,
  ErrorState,
} from '../components/atoms';
import { StatusBadge, PriorityBadge, ApplicationForm } from '../components/applications';
import {
  APPLICATION_STATUS_LIST,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
  SORT_OPTIONS,
} from '../constants/application.constants';
import * as applicationService from '../services/applicationService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';

/**
 * Format date for friendly display (e.g. 'Sep 30, 2026')
 */
const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format salary object to human-readable string
 */
const formatSalary = (salary) => {
  if (!salary || (salary.min == null && salary.max == null)) return null;

  const currencySymbol = salary.currency === 'USD' ? '$' : salary.currency === 'EUR' ? '€' : salary.currency === 'GBP' ? '£' : salary.currency === 'INR' ? '₹' : `${salary.currency} `;
  const periodLabel = salary.period === 'Yearly' ? '/yr' : salary.period === 'Monthly' ? '/mo' : salary.period === 'Hourly' ? '/hr' : '';

  if (salary.min != null && salary.max != null) {
    return `${currencySymbol}${Number(salary.min).toLocaleString('en-US')} - ${currencySymbol}${Number(salary.max).toLocaleString('en-US')}${periodLabel}`;
  }
  if (salary.min != null) {
    return `From ${currencySymbol}${Number(salary.min).toLocaleString('en-US')}${periodLabel}`;
  }
  if (salary.max != null) {
    return `Up to ${currencySymbol}${Number(salary.max).toLocaleString('en-US')}${periodLabel}`;
  }
  return null;
};

/**
 * Applications Page (Phase 6.5D)
 *
 * Professional job-tracking dashboard:
 * - Paginated list of applications
 * - Server-synchronized search, filtering, and sorting
 * - Create, Edit, Archive, and Delete modals
 * - Responsive table and card layouts
 */
export const ApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL search params
  const currentFilters = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      workplaceType: searchParams.get('workplaceType') || '',
      isArchived: searchParams.get('isArchived') || 'false',
      sortBy: searchParams.get('sortBy') || 'appliedDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
    };
  }, [searchParams]);

  // Data state
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Local filter inputs (for typing in search)
  const [searchInput, setSearchInput] = useState(currentFilters.search);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [archivingApplication, setArchivingApplication] = useState(null);
  const [deletingApplication, setDeletingApplication] = useState(null);

  // Action loading / error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');

  // Sync local search input if URL changes externally
  useEffect(() => {
    setSearchInput(currentFilters.search);
  }, [currentFilters.search]);

  // Open create modal if URL search parameter action=new is present (Phase 6.5G quick action)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Update URL search parameters safely
  const updateUrlParams = useCallback((newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || (key === 'page' && val === 1) || (key === 'isArchived' && val === 'false')) {
        updated.delete(key);
      } else {
        updated.set(key, String(val));
      }
    });
    setSearchParams(updated, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch applications list
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await applicationService.getApplications({
        search: currentFilters.search,
        status: currentFilters.status,
        priority: currentFilters.priority,
        workplaceType: currentFilters.workplaceType,
        isArchived: currentFilters.isArchived,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        page: currentFilters.page,
        limit: 10,
      });

      const responseData = response.data?.data;
      const responseMeta = response.data?.meta;

      setApplications(Array.isArray(responseData) ? responseData : []);
      if (responseMeta) {
        setMeta(responseMeta);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load applications. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // Trigger fetch on filter change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput.trim(), page: 1 });
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  // Handle Create Application
  const handleCreateSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      await applicationService.createApplication(payload);
      toast.success('Application created successfully!');
      setIsCreateModalOpen(false);
      fetchApplications();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormServerErrors(fieldErrors);
      }
      setFormGeneralError(getErrorMessage(err, 'Failed to create application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Application
  const handleEditSubmit = async (payload) => {
    if (!editingApplication) return;
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      await applicationService.updateApplication(editingApplication._id, payload);
      toast.success('Application updated successfully!');
      setEditingApplication(null);
      fetchApplications();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormServerErrors(fieldErrors);
      }
      setFormGeneralError(getErrorMessage(err, 'Failed to update application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Archive / Unarchive
  const handleArchiveConfirm = async () => {
    if (!archivingApplication) return;
    setIsSubmitting(true);

    try {
      const res = await applicationService.archiveApplication(archivingApplication._id);
      const isNowArchived = res.data?.data?.isArchived;
      toast.success(
        isNowArchived
          ? 'Application archived successfully'
          : 'Application unarchived successfully'
      );
      setArchivingApplication(null);
      fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update application archive status.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingApplication) return;
    setIsSubmitting(true);

    try {
      await applicationService.deleteApplication(deletingApplication._id);
      toast.success('Application deleted successfully');
      setDeletingApplication(null);
      fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    currentFilters.search ||
    currentFilters.status ||
    currentFilters.priority ||
    currentFilters.workplaceType ||
    currentFilters.isArchived === 'true'
  );

  return (
    <div className="applications-page" data-testid="applications-page" style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Applications
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              marginTop: 'var(--space-xs)',
              marginBottom: 0,
            }}
          >
            {isLoading
              ? 'Loading your applications...'
              : `Managing ${meta.totalDocs} job ${meta.totalDocs === 1 ? 'application' : 'applications'}`}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setFormServerErrors({});
            setFormGeneralError('');
            setIsCreateModalOpen(true);
          }}
          leftIcon={<Plus size={18} />}
          data-testid="add-application-btn"
        >
          Add Application
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-md)' }}>
          {/* Top row: Search input & Submit */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-md)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <Input
                id="search-applications"
                placeholder="Search by company or job title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: '100%' }}
                data-testid="search-input"
              />
            </div>
            <Button type="submit" variant="outline" leftIcon={<Search size={16} />} data-testid="search-btn">
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw size={16} />}
                data-testid="reset-filters-btn"
              >
                Reset
              </Button>
            )}
          </form>

          {/* Bottom row: Filter selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-sm)',
              alignItems: 'end',
            }}
          >
            {/* Status Filter */}
            <Select
              id="filter-status"
              label="Status"
              value={currentFilters.status}
              onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
              options={[
                { value: '', label: 'All Statuses' },
                ...APPLICATION_STATUS_LIST.map((s) => ({ value: s, label: s })),
              ]}
              placeholder={null}
              data-testid="status-filter-select"
            />

            {/* Priority Filter */}
            <Select
              id="filter-priority"
              label="Priority"
              value={currentFilters.priority}
              onChange={(e) => updateUrlParams({ priority: e.target.value, page: 1 })}
              options={[
                { value: '', label: 'All Priorities' },
                ...PRIORITY_LEVELS.map((p) => ({ value: p, label: p })),
              ]}
              placeholder={null}
              data-testid="priority-filter-select"
            />

            {/* Workplace Type Filter */}
            <Select
              id="filter-workplace"
              label="Workplace"
              value={currentFilters.workplaceType}
              onChange={(e) => updateUrlParams({ workplaceType: e.target.value, page: 1 })}
              options={[
                { value: '', label: 'All Workplaces' },
                ...WORKPLACE_TYPES.map((w) => ({ value: w, label: w })),
              ]}
              placeholder={null}
              data-testid="workplace-filter-select"
            />

            {/* Sort Field */}
            <Select
              id="sort-by"
              label="Sort By"
              value={currentFilters.sortBy}
              onChange={(e) => updateUrlParams({ sortBy: e.target.value, page: 1 })}
              options={SORT_OPTIONS}
              placeholder={null}
              data-testid="sort-by-select"
            />

            {/* Sort Order Toggle & Archive Toggle */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateUrlParams({
                    sortOrder: currentFilters.sortOrder === 'asc' ? 'desc' : 'asc',
                    page: 1,
                  })
                }
                leftIcon={<ArrowUpDown size={16} />}
                title={`Sort ${currentFilters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                aria-label={`Toggle sort direction, current is ${currentFilters.sortOrder}`}
                style={{ flex: 1, height: '42px', marginTop: 'auto' }}
                data-testid="sort-order-toggle-btn"
              >
                {currentFilters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </Button>

              <Button
                type="button"
                variant={currentFilters.isArchived === 'true' ? 'primary' : 'outline'}
                size="sm"
                onClick={() =>
                  updateUrlParams({
                    isArchived: currentFilters.isArchived === 'true' ? 'false' : 'true',
                    page: 1,
                  })
                }
                leftIcon={currentFilters.isArchived === 'true' ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                title="Toggle archived applications"
                aria-label="Toggle archived applications"
                style={{ flex: 1, height: '42px', marginTop: 'auto' }}
                data-testid="archive-toggle-btn"
              >
                {currentFilters.isArchived === 'true' ? 'Archived' : 'Active'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ padding: 'var(--space-3xl) 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <LoadingIndicator size="lg" label="Loading job applications..." />
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Loading job applications...
          </p>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Applications"
          message={error}
          onRetry={fetchApplications}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={hasActiveFilters ? 'No Matching Applications' : 'No Applications Found'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search criteria or clearing filters to find what you are looking for.'
              : 'Start tracking your career journey by creating your first job application.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleResetFilters} leftIcon={<RotateCcw size={16} />}>
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setFormServerErrors({});
                  setFormGeneralError('');
                  setIsCreateModalOpen(true);
                }}
                leftIcon={<Plus size={16} />}
              >
                Add Your First Application
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Applications Responsive List / Table */}
          <div
            className="applications-list"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
            data-testid="applications-list"
          >
            {applications.map((app) => {
              const salaryText = formatSalary(app.salary);

              return (
                <Card
                  key={app._id}
                  className="application-card"
                  style={{
                    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                    borderLeft: app.isArchived
                      ? '4px solid var(--text-muted)'
                      : '4px solid var(--accent)',
                  }}
                  data-testid={`application-card-${app._id}`}
                >
                  <div
                    style={{
                      padding: 'var(--space-lg)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-md)',
                    }}
                  >
                    {/* Left Column: Job & Company Info */}
                    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)',
                          flexWrap: 'wrap',
                          marginBottom: 'var(--space-xs)',
                        }}
                      >
                        <Link
                          to={`/applications/${app._id}`}
                          style={{
                            fontWeight: 'var(--font-bold)',
                            fontSize: 'var(--text-lg)',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                          }}
                          className="app-title-link"
                          aria-label={`View details for ${app.jobTitle} at ${app.company}`}
                        >
                          {app.jobTitle}
                        </Link>
                        <StatusBadge status={app.status} />
                        <PriorityBadge priority={app.priority} />
                        {app.isArchived && (
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'rgba(156, 163, 175, 0.2)',
                              color: 'var(--text-muted)',
                              fontWeight: 'var(--font-medium)',
                            }}
                          >
                            Archived
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-md)',
                          flexWrap: 'wrap',
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'var(--font-semibold)' }}>
                          <Building2 size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                          {app.company}
                        </span>

                        {app.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                            {app.location} ({app.workplaceType})
                          </span>
                        )}

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                          Applied: {formatDate(app.appliedDate)}
                        </span>

                        {salaryText && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                            <DollarSign size={16} aria-hidden="true" />
                            <span>{salaryText}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                        flexShrink: 0,
                      }}
                    >
                      <Link to={`/applications/${app._id}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`View ${app.company} details`}
                          title="View Details"
                          leftIcon={<Eye size={16} />}
                          data-testid={`view-app-${app._id}`}
                        >
                          View
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormServerErrors({});
                          setFormGeneralError('');
                          setEditingApplication(app);
                        }}
                        disabled={app.isArchived}
                        aria-label={`Edit ${app.company} application`}
                        title={app.isArchived ? 'Unarchive application to edit' : 'Edit Application'}
                        leftIcon={<Edit2 size={16} />}
                        data-testid={`edit-app-${app._id}`}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchivingApplication(app)}
                        aria-label={app.isArchived ? `Unarchive ${app.company} application` : `Archive ${app.company} application`}
                        title={app.isArchived ? 'Unarchive' : 'Archive'}
                        leftIcon={app.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                        data-testid={`archive-app-${app._id}`}
                      >
                        {app.isArchived ? 'Restore' : 'Archive'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingApplication(app)}
                        aria-label={`Delete ${app.company} application`}
                        title="Delete Application"
                        style={{ color: 'var(--danger)' }}
                        leftIcon={<Trash2 size={16} />}
                        data-testid={`delete-app-${app._id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border)',
              }}
              data-testid="pagination-controls"
            >
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.totalDocs} total)
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrlParams({ page: meta.page - 1 })}
                  disabled={!meta.hasPrevPage || isLoading}
                  leftIcon={<ChevronLeft size={16} />}
                  aria-label="Previous Page"
                  data-testid="prev-page-btn"
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrlParams({ page: meta.page + 1 })}
                  disabled={!meta.hasNextPage || isLoading}
                  rightIcon={<ChevronRight size={16} />}
                  aria-label="Next Page"
                  data-testid="next-page-btn"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsCreateModalOpen(false);
        }}
        title="Add New Application"
        data-testid="create-application-modal"
      >
        <ApplicationForm
          mode="create"
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
          serverErrors={formServerErrors}
          generalError={formGeneralError}
        />
      </Modal>

      {/* Edit Application Modal */}
      <Modal
        isOpen={Boolean(editingApplication)}
        onClose={() => {
          if (!isSubmitting) setEditingApplication(null);
        }}
        title={`Edit Application: ${editingApplication?.company || ''}`}
        data-testid="edit-application-modal"
      >
        {editingApplication && (
          <ApplicationForm
            mode="edit"
            initialData={editingApplication}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingApplication(null)}
            isLoading={isSubmitting}
            serverErrors={formServerErrors}
            generalError={formGeneralError}
          />
        )}
      </Modal>

      {/* Archive / Unarchive Confirmation Modal */}
      <Modal
        isOpen={Boolean(archivingApplication)}
        onClose={() => {
          if (!isSubmitting) setArchivingApplication(null);
        }}
        title={archivingApplication?.isArchived ? 'Unarchive Application' : 'Archive Application'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button
              variant="ghost"
              onClick={() => setArchivingApplication(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleArchiveConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="confirm-archive-btn"
            >
              {archivingApplication?.isArchived ? 'Restore Application' : 'Archive Application'}
            </Button>
          </div>
        }
        data-testid="archive-modal"
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {archivingApplication?.isArchived ? (
            <>
              Are you sure you want to restore <strong>{archivingApplication?.company}</strong> (
              {archivingApplication?.jobTitle})? It will return to your active applications list.
            </>
          ) : (
            <>
              Are you sure you want to archive <strong>{archivingApplication?.company}</strong> (
              {archivingApplication?.jobTitle})? Archived applications are hidden from active lists
              and cannot be modified until restored.
            </>
          )}
        </p>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingApplication)}
        onClose={() => {
          if (!isSubmitting) setDeletingApplication(null);
        }}
        title="Delete Application"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button
              variant="ghost"
              onClick={() => setDeletingApplication(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="confirm-delete-btn"
            >
              Permanently Delete
            </Button>
          </div>
        }
        data-testid="delete-modal"
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete the application for{' '}
          <strong>{deletingApplication?.jobTitle}</strong> at{' '}
          <strong>{deletingApplication?.company}</strong>?
          <br />
          <br />
          <span style={{ color: 'var(--danger)', fontWeight: 'var(--font-medium)' }}>
            This action cannot be undone. All associated interview records will be permanently removed.
          </span>
        </p>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;
