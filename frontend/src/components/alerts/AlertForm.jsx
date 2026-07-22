import { useState } from 'react';
import { Plus, AlertTriangle, BookmarkCheck } from 'lucide-react';
import { buildLinkedInSearchUrl } from '../../utils/buildLinkedInSearchUrl';
import CountrySelect from '../shared/CountrySelect';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Modal from '../shared/Modal';
import FilterChip from '../shared/FilterChip';

const ALERT_LIMIT = 20;

export default function AlertForm({ onSubmit, alertCount = 0, keywords = [], onSaveKeyword }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('remote');
  const [saveKeyword, setSaveKeyword] = useState(false);

  const atLimit = alertCount >= ALERT_LIMIT;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim() || atLimit) return;

    if (saveKeyword && onSaveKeyword) {
      const exists = keywords.some(
        (k) => k.keyword.toLowerCase() === keyword.trim().toLowerCase()
      );
      if (!exists) onSaveKeyword(keyword.trim());
    }

    const label = location
      ? `${keyword.trim()} - ${location}`
      : keyword.trim();

    const searchUrl = buildLinkedInSearchUrl({
      keyword: keyword.trim(),
      location,
      workType,
    });

    onSubmit({
      label,
      keyword: keyword.trim(),
      location: location || null,
      workType,
      searchUrl,
    });

    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setKeyword('');
    setLocation('');
    setWorkType('remote');
    setSaveKeyword(false);
  };

  return (
    <>
      {atLimit && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-warning-main/10 border border-warning-main/20 text-warning-main text-[13px] font-medium mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Maximum limit of {ALERT_LIMIT} alerts reached.</span>
        </div>
      )}

      <Button
        onClick={() => !atLimit && setIsOpen(true)}
        disabled={atLimit}
        variant="primary"
        size="md"
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Alert</span>
      </Button>

      <Modal open={isOpen} onClose={handleClose} title="Create Search Alert">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Job Title or Keyword *"
            placeholder="e.g. Senior Software Engineer"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />

          {keywords.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-muted">Saved Keywords:</span>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((k) => (
                  <FilterChip
                    key={k.id}
                    label={k.keyword}
                    active={keyword === k.keyword}
                    onClick={() => setKeyword(k.keyword)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Country</label>
              <CountrySelect value={location} onChange={setLocation} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full h-12 px-4 rounded-[12px] border border-border-default bg-surface-default text-[14px] text-text-primary focus-ring transition-all outline-none"
              >
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-[13px] text-text-secondary pt-1">
            <input
              type="checkbox"
              checked={saveKeyword}
              onChange={(e) => setSaveKeyword(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-primary"
            />
            <BookmarkCheck className="w-4 h-4 text-brand-primary" />
            <span>Save keyword for quick reuse</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-default/60 mt-2">
            <Button type="button" variant="ghost" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create Alert
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
