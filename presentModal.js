export default function presentModal(/** @type {string} */ title, content) {
  document.body.classList.toggle('modal', true);

  const modalDiv = document.querySelector('#modalDiv');
  const modalTitleDiv = document.querySelector('#modalTitleDiv');
  const modalContentDiv = document.querySelector('#modalContentDiv');

  function dismissModal() {
    modalDiv.classList.toggle('hidden', true);
    modalTitleDiv.textContent = '';
    modalContentDiv.innerHTML = '';
    document.body.classList.toggle('modal', false);
  }

  modalDiv.style.top = window.scrollY + 'px';
  modalDiv.classList.toggle('hidden', false);
  modalDiv.addEventListener('click', dismissModal);

  modalTitleDiv.textContent = title;

  modalContentDiv.append(content);

  // Prevent modal from closing from mouse interactions within its content
  modalContentDiv.addEventListener('click', event => event.stopPropagation());

  return dismissModal;
}
