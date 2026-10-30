// Converts TipTap JSON nodes to an HTML string for read-only display.
// Keeps it dependency-free (no generateHTML import needed at runtime).

function attrs(node) {
  const a = node.attrs || {};
  const styles = [];
  if (a.textAlign && a.textAlign !== 'left') styles.push(`text-align:${a.textAlign}`);
  return styles.length ? ` style="${styles.join(';')}"` : '';
}

function marks(text, ms = []) {
  return ms.reduce((t, m) => {
    if (m.type === 'bold')       return `<strong>${t}</strong>`;
    if (m.type === 'italic')     return `<em>${t}</em>`;
    if (m.type === 'underline')  return `<u>${t}</u>`;
    if (m.type === 'code')       return `<code>${t}</code>`;
    if (m.type === 'link')       return `<a href="${m.attrs?.href || '#'}" target="_blank" rel="noopener">${t}</a>`;
    return t;
  }, text);
}

function renderNodes(nodes = []) {
  return nodes.map(node => {
    const inner = renderNodes(node.content);
    const a = attrs(node);

    switch (node.type) {
      case 'text':          return marks(node.text?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '', node.marks);
      case 'paragraph':     return `<p${a}>${inner || '&nbsp;'}</p>`;
      case 'heading':       return `<h${node.attrs?.level || 2}${a}>${inner}</h${node.attrs?.level || 2}>`;
      case 'bulletList':    return `<ul>${inner}</ul>`;
      case 'orderedList':   return `<ol>${inner}</ol>`;
      case 'listItem':      return `<li>${inner}</li>`;
      case 'blockquote':    return `<blockquote>${inner}</blockquote>`;
      case 'codeBlock':     return `<pre><code>${inner}</code></pre>`;
      case 'hardBreak':     return '<br>';
      case 'horizontalRule':return '<hr>';
      case 'image':         return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`;
      default:              return inner;
    }
  }).join('');
}

export function tiptapToHtml(json) {
  if (!json) return '';
  if (typeof json === 'string') return `<p>${json}</p>`;
  return renderNodes(json.content || []);
}
