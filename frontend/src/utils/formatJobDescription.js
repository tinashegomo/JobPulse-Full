import DOMPurify from 'dompurify';

const SECTION_HEADERS = [
  'important requirements',
  'requirements',
  'responsibilities',
  "what you'll do",
  "what you'll bring",
  'qualifications',
  'benefits',
  'about the role',
  'about us',
  'about the company',
  'who you are',
  'nice to have',
  'preferred qualifications',
  'minimum qualifications',
  'key responsibilities',
  'role overview',
  'job description',
  'overview',
  'our expectations',
  'you should have',
  'we offer',
  'what we offer',
  'perks',
  'compensation',
  'salary',
];

const HEADER_PATTERN = new RegExp(
  `(?:^|\\n)\\s*((?:${SECTION_HEADERS.join('|')})\\s*[:\\-])\\s*`,
  'gi'
);

const BULLET_PATTERN = /[•●▪►→]\s*/g;

function hasBlockStructure(html) {
  return /<\s*(p|li|br|ul|ol|div|h[1-6])[\s>]/i.test(html);
}

function fixSquishedPunctuation(text) {
  return text.replace(/([.!?])([A-Z])/g, '$1 $2');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseBulletItems(text) {
  const items = text
    .split(BULLET_PATTERN)
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length <= 1) return null;
  return '<ul>' + items.map((item) => `<li>${escapeHtml(item)}</li>`).join('') + '</ul>';
}

function reconstructPlainText(raw) {
  let text = raw.trim();
  text = text.replace(/\s*Show\s*(more|less)\s*/gi, ' ');
  text = fixSquishedPunctuation(text);

  let html = escapeHtml(text);

  html = html.replace(
    HEADER_PATTERN,
    (_match, header) => `\n<h4>${header.trim()}</h4>\n`
  );

  const lines = html.split('\n');
  const output = [];
  let buffer = [];

  function flushBuffer() {
    if (buffer.length === 0) return;
    const chunk = buffer.join(' ').trim();
    if (!chunk) { buffer = []; return; }

    const bulletHtml = parseBulletItems(chunk);
    if (bulletHtml) {
      output.push(bulletHtml);
    } else {
      output.push(`<p>${chunk}</p>`);
    }
    buffer = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^<h4>/i.test(trimmed)) {
      flushBuffer();
      output.push(trimmed);
      continue;
    }

    if (/^<ul>/i.test(trimmed)) {
      flushBuffer();
      output.push(trimmed);
      continue;
    }

    if (trimmed === '') {
      flushBuffer();
      continue;
    }

    buffer.push(trimmed);
  }

  flushBuffer();

  return output.join('\n');
}

export function formatJobDescription(description) {
  if (!description || !description.trim()) return '';

  const sanitized = DOMPurify.sanitize(description);

  if (hasBlockStructure(sanitized)) {
    return sanitized.replace(/\s*Show\s*(more|less)\s*/gi, ' ');
  }

  return reconstructPlainText(sanitized);
}
