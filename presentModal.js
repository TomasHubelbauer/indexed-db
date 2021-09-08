export default function presentModal(/** @type {string} */ title, content) {
  document.body.classList.toggle('modal', true);

  const modalDiv = document.querySelector('#modalDiv');
  const modalTitleDiv = document.querySelector('#modalTitleDiv');
  const modalContentDiv = document.querySelector('#modalContentDiv');

  function dismissModal() {
    modalDiv.classList.toggle('hidden', true);
    modalTitleDiv.textContent = '';
    modalContentDiv.innerHTML = '';
  }

  modalDiv.classList.toggle('hidden', false);
  modalDiv.addEventListener('click', dismissModal);

  modalTitleDiv.textContent = title;

  modalContentDiv.append(content);

  return dismissModal;
}
