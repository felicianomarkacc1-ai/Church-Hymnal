const fs = require('fs');
const path = 'c:\\Users\\felic\\OneDrive\\Documents\\CHURCH\\hymn-app\\src\\app\\data\\sample-hymns.ts';
let text = fs.readFileSync(path, 'utf8');

const pattern = /(lyrics:\s*)(`)([\s\S]*?)(`)/gm;

function transformLyrics(body) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  let currentLabel = null;
  let currentLines = [];

  function flush() {
    if (currentLabel !== null) {
      sections.push([currentLabel, currentLines.join('\n').trim()]);
    }
    currentLabel = null;
    currentLines = [];
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const m = line.match(/^\[(.+)\]\s*$/);
    if (m) {
      flush();
      currentLabel = m[1].trim();
      currentLines = [];
    } else if (line.trim()) {
      if (currentLabel === null) {
        currentLines.push(line);
      } else {
        currentLines.push(line);
      }
    }
  }
  flush();

  if (!sections.length) return body;

  const chorusSections = sections.filter(([label]) => label.toLowerCase() === 'chorus' || label.toLowerCase() === 'koro');
  const verseSections = sections.filter(([label]) => label.toLowerCase().startsWith('verse'));
  if (!chorusSections.length || !verseSections.length) return body;

  const [chorusLabel, chorusContent] = chorusSections[0];
  if (!chorusContent) return body;

  let alreadyRepeated = true;
  for (let i = 0; i < sections.length; i++) {
    const [label] = sections[i];
    if (label.toLowerCase().startsWith('verse')) {
      const nextLabel = i + 1 < sections.length ? sections[i + 1][0].toLowerCase() : null;
      if (nextLabel !== 'chorus' && nextLabel !== 'koro') {
        alreadyRepeated = false;
        break;
      }
    }
  }
  if (alreadyRepeated) return body;

  const newSections = [];
  for (const [label, content] of sections) {
    if (label.toLowerCase() === 'chorus' || label.toLowerCase() === 'koro') continue;
    newSections.push([label, content]);
    if (label.toLowerCase().startsWith('verse')) {
      newSections.push([chorusLabel, chorusContent]);
    }
  }

  const outLines = [];
  newSections.forEach(([label, content], i) => {
    outLines.push(`[${label}]`);
    if (content) outLines.push(...content.split(/\r?\n/));
    if (i < newSections.length - 1) outLines.push('');
  });
  return outLines.join('\n');
}

const updated = text.replace(pattern, (match, prefix, quote, body) => `${prefix}${quote}${transformLyrics(body)}${quote}`);
fs.writeFileSync(path, updated, 'utf8');
console.log('updated', path);
