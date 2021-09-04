export default function humanizeBytes(/** @type {number} */ bytes) {
  let order = 0;
  while (bytes > 1000) {
    order++;
    bytes /= 1000;
  }

  const span = document.createElement('span');
  span.textContent = bytes.toFixed(2) + ' ' + ['B', 'kB', 'MB', 'GB'][order];
  span.style.color = 'gray';
  return span;
}
