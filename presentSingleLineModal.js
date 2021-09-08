import presentModal from './presentModal.js';

export default function presentSingleLineModal(/** @type {string} */ title, /** @type {string} */ text) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.value = text;
    input.style.width = '50vw';

    const dismissModal = presentModal(title, input);

    input.focus();
    input.addEventListener('keyup', event => {
      if (event.key !== 'Enter') {
        return;
      }

      dismissModal();
      resolve(input.value);
    });
  });
}
