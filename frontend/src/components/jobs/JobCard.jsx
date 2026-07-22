import { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Trash2, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { markJobSeen, markJobUnseen, hideJob } from '../../api/firestoreService';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import InfoRow from '../shared/InfoRow';
import Button from '../shared/Button';
import IconButton from '../shared/IconButton';
import JobDetailModal from './JobDetailModal';

/**
 * JobCard redesigned per design system guidelines:
 * Company -> Role -> Metadata row -> Tags -> Actions
 * Soft elevation, 16px internal padding, 16px radius, 12px vertical gaps.
 */
export default function JobCard({ job }) {
  const { currentUser } = useAuth();
  const seen = job.seen;
  const [detailOpen, setDetailOpen] = useState(false);

  const handleApply = async (e) => {
    e?.stopPropagation();
    if (currentUser) {
      await markJobSeen(currentUser.uid, job.source, job.externalJobId);
    }
    window.open(job.jobUrl, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSeen = async (e) => {
    e?.stopPropagation();
    if (!currentUser) return;
    if (seen) {
      await markJobUnseen(currentUser.uid, job.source, job.externalJobId);
    } else {
      await markJobSeen(currentUser.uid, job.source, job.externalJobId);
    }
  };

  const handleHide = async (e) => {
    e?.stopPropagation();
    if (!currentUser) return;
    await hideJob(currentUser.uid, job.source, job.externalJobId);
  };

  return (
    <>
      <Card
        onClick={() => setDetailOpen(true)}
        className={`group flex flex-col gap-3 h-full transition-all duration-200 cursor-pointer ${
          seen
            ? 'bg-surface-default/60 border-border-default/60 opacity-80'
            : 'bg-surface-default border-border-default hover:border-brand-primary/40 hover:shadow-md'
        }`}
      >
        {/* Top Header: Company + Source/Status Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[14px] font-medium text-text-secondary truncate">
              {job.company}
            </span>
            {seen && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success-main shrink-0 bg-success-main/10 px-2.5 py-0.5 rounded-pill">
                <CheckCircle2 className="w-4 h-4" />
                Seen
              </span>
            )}
          </div>
          <Badge variant={job.source === 'LINKEDIN' ? 'brand' : 'info'}>
            {job.source}
          </Badge>
        </div>

        {/* Role Title */}
        <h3 className="text-[17px] font-semibold tracking-tight text-text-primary group-hover:text-brand-primary transition-colors leading-snug">
          {job.title}
        </h3>

        {/* Metadata Row */}
        <InfoRow
          location={job.location}
          postedText={job.postedText}
          salary={job.salary}
          jobType={job.jobType}
        />

        {/* Tags Row */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {job.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div
          className="flex items-center justify-between gap-3 pt-3 border-t border-border-default/60 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setDetailOpen(true)}
              ariaLabel="View job details"
            >
              <Info className="w-5 h-5 text-text-muted hover:text-text-primary" />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={handleToggleSeen}
              ariaLabel={seen ? 'Mark as unseen' : 'Mark as seen'}
            >
              {seen ? (
                <EyeOff className="w-5 h-5 text-text-muted hover:text-text-primary" />
              ) : (
                <Eye className="w-5 h-5 text-text-muted hover:text-text-primary" />
              )}
            </IconButton>
            <IconButton
              size="sm"
              variant="danger"
              onClick={handleHide}
              ariaLabel="Hide job"
            >
              <Trash2 className="w-5 h-5" />
            </IconButton>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleApply}
            className="gap-2 text-[14px] font-semibold px-5 h-10"
          >
            <span>Apply</span>
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      <JobDetailModal
        job={job}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onApply={handleApply}
      />
    </>
  );
}
