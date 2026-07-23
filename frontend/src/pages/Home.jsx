import { useState, useMemo } from 'react';
import { useJobs } from '../hooks/useJobs';
import { useFCMToken } from '../hooks/useFCMToken';
import { useAuth } from '../hooks/useAuth';
import { hideAllJobs } from '../api/firestoreService';
import JobCard from '../components/jobs/JobCard';
import PageHeader from '../components/layout/PageHeader';
import PermissionBanner from '../components/shared/PermissionBanner';
import EmptyState from '../components/shared/EmptyState';
import SkeletonJobCard from '../components/shared/SkeletonJobCard';
import SearchBar from '../components/shared/SearchBar';
import FilterChip from '../components/shared/FilterChip';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import { groupJobsByTime } from '../utils/groupJobsByTime';
import { Briefcase, Trash2 } from 'lucide-react';

export default function Home() {
  const { jobs, loading, error } = useJobs();
  const { permission, requestPermission } = useFCMToken();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, unseen, linkedin, remoteok
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Client-side filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Filter by type
      if (activeFilter === 'unseen' && job.seen) return false;
      if (activeFilter === 'linkedin' && job.source !== 'LINKEDIN') return false;
      if (activeFilter === 'remoteok' && job.source !== 'REMOTEOK') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(q);
        const companyMatch = job.company?.toLowerCase().includes(q);
        const locationMatch = job.location?.toLowerCase().includes(q);
        return titleMatch || companyMatch || locationMatch;
      }
      return true;
    });
  }, [jobs, activeFilter, searchQuery]);

  const groups = useMemo(() => groupJobsByTime(filteredJobs), [filteredJobs]);

  const unseenCount = useMemo(() => jobs.filter((j) => !j.seen).length, [jobs]);

  const handleClearAll = async () => {
    if (!currentUser) return;
    setClearing(true);
    try {
      await hideAllJobs(currentUser.uid);
      setClearModalOpen(false);
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header */}
      <PageHeader
        title="Job Feed"
        subtitle="Real-time alerts for matching job postings"
        action={
          <div className="flex items-center gap-2">
            {jobs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-main hover:bg-danger-bg p-2.5 h-10 gap-1.5"
                onClick={() => setClearModalOpen(true)}
                title="Clear all jobs"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline text-[13px]">Clear all</span>
              </Button>
            )}
            <Badge variant="brand" className="text-[13px] px-3 py-1">{jobs.length} total</Badge>
          </div>
        }
      />

      {/* Push Notification Banner */}
      <PermissionBanner
        permission={permission}
        onRequestPermission={requestPermission}
      />

      {/* Search & Filters */}
      {jobs.length > 0 && (
        <div className="flex flex-col gap-4 mb-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <FilterChip
              label="All Jobs"
              count={jobs.length}
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <FilterChip
              label="New / Unseen"
              count={unseenCount}
              active={activeFilter === 'unseen'}
              onClick={() => setActiveFilter('unseen')}
            />
            <FilterChip
              label="LinkedIn"
              active={activeFilter === 'linkedin'}
              onClick={() => setActiveFilter('linkedin')}
            />
            <FilterChip
              label="RemoteOK"
              active={activeFilter === 'remoteok'}
              onClick={() => setActiveFilter('remoteok')}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-danger-bg border border-danger-main/20 rounded-[12px] text-danger-main text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SkeletonJobCard />
          <SkeletonJobCard />
          <SkeletonJobCard />
          <SkeletonJobCard />
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={searchQuery || activeFilter !== 'all' ? 'No matching jobs' : 'No jobs detected yet'}
          description={
            searchQuery || activeFilter !== 'all'
              ? 'Try clearing your search query or filter tags.'
              : 'Jobs will appear here immediately when detected by the watcher scraper.'
          }
          action={
            searchQuery || activeFilter !== 'all' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : null
          }
        />
      ) : (
        /* Grouped Job Feed */
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <h2 className="text-[12px] font-semibold text-text-muted uppercase tracking-wider px-1">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-stagger">
                {group.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear All Jobs"
      >
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Are you sure you want to hide all <strong className="text-text-primary">{jobs.length} jobs</strong>? They won't appear again unless new postings match your search alerts.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-default/60 mt-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear All Jobs'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
