import { ExternalLink, Building2 } from 'lucide-react';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import InfoRow from '../shared/InfoRow';
import Button from '../shared/Button';
import { formatJobDescription } from '../../utils/formatJobDescription';

export default function JobDetailModal({ job, open, onClose, onApply }) {
  if (!job) return null;

  const formattedDescription = formatJobDescription(job.description);

  const handleApply = () => {
    if (onApply) onApply();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Job Details">
      <div className="flex flex-col gap-4">
        {/* Company + Source Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-4 h-4 text-text-muted shrink-0" />
            <span className="text-[14px] font-medium text-text-secondary truncate">
              {job.company}
            </span>
          </div>
          <Badge variant={job.source === 'LINKEDIN' ? 'brand' : 'info'}>
            {job.source}
          </Badge>
        </div>

        {/* Role Title */}
        <h2 className="text-[20px] font-bold text-text-primary leading-tight">
          {job.title}
        </h2>

        {/* Metadata Row */}
        <InfoRow
          location={job.location}
          postedText={job.postedText}
          salary={job.salary}
          jobType={job.jobType}
        />

        <div className="border-t border-border-default/60 my-1" />

        {/* Description Section */}
        {formattedDescription ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
              Description
            </h3>
            <div
              className="prose prose-sm max-w-none text-[14px] text-text-secondary leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_p]:my-2 [&_strong]:text-text-primary [&_strong]:font-semibold [&_a]:text-brand-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: formattedDescription }}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-[13px] text-text-muted bg-surface-muted rounded-[12px]">
            Full description not available in preview. Tap below to view on {job.source || 'source'}.
          </div>
        )}

        {/* CTA Action */}
        <div className="pt-3">
          <Button fullWidth size="lg" variant="primary" onClick={handleApply}>
            <span>Apply Now</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
