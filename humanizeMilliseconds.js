export default function humanizeMilliseconds(/** @type {number} */ milliseconds) {
  milliseconds /= 1000;
  const seconds = ~~(milliseconds % 60);
  milliseconds /= 60;
  const minutes = ~~(milliseconds % 60);
  milliseconds /= 60;
  const hours = ~~(milliseconds % 24);

  const span = document.createElement('span');

  if (hours) {
    span.textContent += hours.toString().padStart(2, '0') + ':';
  }

  span.textContent += minutes.toString().padStart(2, '0') + ':';
  span.textContent += seconds.toString().padStart(2, '0');
  span.style.color = 'gray';
  return span;
}
