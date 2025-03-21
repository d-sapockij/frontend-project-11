const handleLoadState = (value, elements, i18nextInstance) => {
  const isLoading = value === 'loading';
  // eslint-disable-next-line
  elements.fields.input.readOnly = isLoading;
  // eslint-disable-next-line
  elements.fields.button.disabled = isLoading;

  elements.fields.input.focus();
  switch (value) {
    case 'success':
      elements.fields.input.classList.remove('is-invalid');
      // eslint-disable-next-line
      elements.fields.input.value = '';
      // eslint-disable-next-line
      elements.feedbackEl.textContent = i18nextInstance.t('success');
      elements.feedbackEl.classList.remove('text-danger');
      elements.feedbackEl.classList.add('text-success');
      break;
    case 'fail':
      elements.fields.input.classList.add('is-invalid');
      elements.fields.input.select();
      break;
    default:
  }
};

const createCardElem = () => {
  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const cardTitle = document.createElement('h2');
  const listGroup = document.createElement('ul');

  card.classList.add('card', 'border-0');
  cardBody.classList.add('card-body');
  cardTitle.classList.add('card-title', 'h4');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');

  card.appendChild(cardBody);
  cardBody.appendChild(cardTitle);
  card.appendChild(listGroup);

  return { card, cardTitle, listGroup };
};

const renderPosts = (elements, posts, i18nextInstance) => {
  // eslint-disable-next-line
  elements.postsContainer.innerHTML = '';

  const { card, cardTitle, listGroup } = createCardElem();
  elements.postsContainer.appendChild(card);
  cardTitle.innerText = i18nextInstance.t('ui.posts.title');
  const postsElems = posts.map(({
    id, seen, title, link,
  }) => {
    const elem = document.createElement('li');
    elem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const linkElem = document.createElement('a');
    linkElem.href = link;
    if (seen) {
      linkElem.classList.add('fw-normal', 'link-secondary');
    } else {
      linkElem.classList.add('fw-bold');
    }
    linkElem.target = '_blank';
    linkElem.rel = 'noopener noreferrer';
    linkElem.textContent = title;
    linkElem.dataset.id = id;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary');
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.dataset.id = id;
    button.textContent = i18nextInstance.t('ui.posts.button');

    elem.append(linkElem, button);
    return elem;
  });
  listGroup.replaceChildren(...postsElems);
};

const renderFeeds = (elements, feeds, i18nextInstance) => {
  // eslint-disable-next-line
  elements.feedsContainer.innerHTML = '';

  const { card, cardTitle, listGroup } = createCardElem();
  elements.feedsContainer.appendChild(card);
  cardTitle.innerText = i18nextInstance.t('ui.feeds.title');

  const feedsElems = feeds.map(({ title, description }) => {
    const elem = document.createElement('li');
    elem.classList.add('list-group-item', 'border-0', 'border-end-0');
    const elemTitle = document.createElement('h3');
    elemTitle.classList.add('h6', 'm-0');
    elemTitle.textContent = title;
    const elemText = document.createElement('p');
    elemText.classList.add('m-0', 'small', 'text-black-50');
    elemText.textContent = description;

    elem.replaceChildren(elemTitle, elemText);

    return elem;
  });
  listGroup.replaceChildren(...feedsElems);
};

export default (elements, initialState, i18nextInstance) => (path, value) => {
  switch (path) {
    case 'form.isValid':
      if (value) {
        elements.fields.input.classList.remove('is-invalid');
      } else {
        elements.fields.input.classList.add('is-invalid');
        elements.fields.input.focus();
        elements.fields.input.select();
      }
      break;
    case 'loadingProcess.status':
      handleLoadState(value, elements, i18nextInstance);
      break;
    case 'form.error':
    case 'loadingProcess.error':
      // eslint-disable-next-line
      elements.feedbackEl.textContent = value ? i18nextInstance.t(`errors.${value}`) : value;
      elements.feedbackEl.classList.add('text-danger');
      elements.feedbackEl.classList.remove('text-success');
      break;
    case 'posts':
      renderPosts(elements, initialState.posts, i18nextInstance);
      break;
    case 'feeds':
      renderFeeds(elements, initialState.feeds, i18nextInstance);
      break;
    case 'activeModal':
      initialState.posts.forEach((post) => {
        if (post.id === value) {
          // eslint-disable-next-line
          elements.modalItems.title.textContent = post.title;
          // eslint-disable-next-line
          elements.modalItems.body.textContent = post.description;
          // eslint-disable-next-line
          elements.modalItems.submitButton.href = post.link;
        }
      });
      break;
    default:
  }
};
