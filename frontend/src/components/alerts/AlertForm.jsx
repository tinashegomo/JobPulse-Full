import { useState } from 'react';
import { Plus, BookmarkCheck } from 'lucide-react';
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

  const filteredKeywords = keyword.trim()
    ? keywords.filter((k) =>
        k.keyword.toLowerCase().includes(keyword.trim().toLowerCase())
      )
    : keywords;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || atLimit) return;

    if (saveKeyword && onSaveKeyword) {
      const exists = keywords.some(
        (k) => k.keyword.toLowerCase() === keyword.trim().toLowerCase()
      );
      if (!exists) await onSaveKeyword(keyword.trim());
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
      <Button
        onClick={() => !atLimit && setIsOpen(true)}
        disabled={atLimit}
        variant="primary"
        size="md"
        className="gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>New Alert</span>
      </Button>

      <Modal open={isOpen} onClose={handleClose} title="Create Search Alert">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Keyword */}
          <Input
            label="Job Title or Keyword"
            placeholder="e.g. Senior Software Engineer"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />

          {/* Saved Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[16px] font-semibold text-text-primary">Saved Keywords</span>
              {keyword.trim() ? (
                filteredKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredKeywords.map((k) => (
                      <FilterChip
                        key={k.id}
                        label={k.keyword}
                        active={keyword === k.keyword}
                        onClick={() => setKeyword(k.keyword)}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[13px] text-text-muted italic">This is a new keyword</span>
                )
              ) : (
                <span className="text-[13px] text-text-muted italic">Start typing to match saved keywords</span>
              )}
            </div>
          )}

          {/* Country */}
          <div className="flex flex-col gap-2">
            <label className="text-[16px] font-semibold text-text-primary">Country</label>
            <CountrySelect value={location} onChange={setLocation} />
          </div>

          {/* Work Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[16px] font-semibold text-text-primary">Work Type</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full h-14 px-4 rounded-[12px] border border-border-default bg-surface-default text-[16px] text-text-primary focus-ring transition-all outline-none"
            >
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Save Keyword Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer text-[15px] text-text-secondary py-2">
            <input
              type="checkbox"
              checked={saveKeyword}
              onChange={(e) => setSaveKeyword(e.target.checked)}
              className="w-5 h-5 rounded accent-brand-primary"
            />
            <BookmarkCheck className="w-5 h-5 text-brand-primary shrink-0" />
            <span>Save keyword for quick reuse</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default/60">
            <Button type="button" variant="ghost" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Alert
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
