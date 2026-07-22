const WORK_TYPE_MAP = {
  'on-site': '1',
  remote: '2',
  hybrid: '3',
};

export function buildLinkedInSearchUrl({ keyword, location, workType }) {
  const params = new URLSearchParams();

  if (keyword) params.set('keywords', keyword);
  if (location) params.set('location', location);

  const fWt = WORK_TYPE_MAP[workType];
  if (fWt) params.set('f_WT', fWt);

  params.set('f_TPR', 'r259200');

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}
