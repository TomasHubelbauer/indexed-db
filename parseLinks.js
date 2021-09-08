export default function* parseLinks(/** @type {string} */ text) {
  const regex = /https?:\/\/([\w-]+.)[\w-]+.[\w-]+(\/[\w-]+)+([\?\#][\w-]+)?/g;
  let match;
  let index = 0;
  while (match = regex.exec(text)) {
    yield text.slice(index, match.index);

    const a = document.createElement('a');
    a.textContent = match[0].replace(/https?:\/\/(www.)?/, ''); // Strip https?:// and www.
    a.href = match[0];
    a.target = '_blank';
    yield a;

    // Stop the link from triggering click handlers on parent elements
    a.addEventListener('click', event => event.stopPropagation());
    a.addEventListener('contextmenu', event => event.stopPropagation());

    index = match.index + match[0].length;
  }

  if (index < text.length) {
    yield text.slice(index);
  }
}
