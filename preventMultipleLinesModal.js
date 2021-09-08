import presentModal from './presentModal.js';

export default function presentMultipleLinesModal(/** @type {string} */ title, /** @type {string} */ text) {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.display = 'block';
    textarea.style.height = '150px';
    textarea.style.width = '50vw';

    const button = document.createElement('button');
    button.textContent = 'Submit';
    button.addEventListener('click', () => {
      dismissModal();
      resolve(textarea.value);
    });

    const dismissModal = presentModal(title, textarea, button);
    textarea.addEventListener('keyup', event => {
      if (event.key === 'Escape') {
        dismissModal();
        resolve(text);
      }
    });

    textarea.focus();
  });
}
