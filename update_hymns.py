from pathlib import Path
import re

path = Path(r'c:\Users\felic\OneDrive\Documents\CHURCH\hymn-app\src\app\data\sample-hymns.ts')
text = path.read_text(encoding='utf-8')

pattern = re.compile(r'(lyrics:\s*)(`)([\s\S]*?)(`)', re.MULTILINE)


def transform_lyrics(body: str) -> str:
    lines = body.splitlines()
    sections = []
    current_label = None
    current_lines = []

    def flush():
        nonlocal current_label, current_lines
        if current_label is not None:
            sections.append((current_label, '\n'.join(current_lines).strip()))
        current_label = None
        current_lines = []

    for raw in lines:
        line = raw.rstrip()
        m = re.match(r'^\[(.+)\]\s*$', line.strip())
        if m:
            flush()
            current_label = m.group(1).strip()
            current_lines = []
        else:
            if current_label is None:
                if line.strip():
                    current_lines.append(line)
            else:
                current_lines.append(line)
    flush()

    if not sections:
        return body

    chorus_sections = [(label, content) for label, content in sections if label.lower() in {'chorus', 'koro'}]
    verse_labels = [label for label, _ in sections if label.lower().startswith('verse')]
    if not chorus_sections or not verse_labels:
        return body

    chorus_label, chorus_content = chorus_sections[0]
    if not chorus_content:
        return body

    # If chorus is already repeated after each verse, leave it alone.
    already_repeated = True
    for i, (label, _) in enumerate(sections):
        if label.lower().startswith('verse'):
            next_label = sections[i + 1][0].lower() if i + 1 < len(sections) else None
            if next_label not in {'chorus', 'koro'}:
                already_repeated = False
                break
    if already_repeated:
        return body

    new_sections = []
    for label, content in sections:
        if label.lower() in {'chorus', 'koro'}:
            continue
        new_sections.append((label, content))
        if label.lower().startswith('verse'):
            new_sections.append((chorus_label, chorus_content))

    out_lines = []
    for i, (label, content) in enumerate(new_sections):
        out_lines.append(f'[{label}]')
        if content:
            out_lines.extend(content.splitlines())
        if i < len(new_sections) - 1:
            out_lines.append('')
    return '\n'.join(out_lines)


def repl(match):
    prefix, quote, body, ending = match.groups()
    return f'{prefix}{quote}{transform_lyrics(body)}{ending}'

new_text = pattern.sub(repl, text)
path.write_text(new_text, encoding='utf-8')
print('updated', path)
