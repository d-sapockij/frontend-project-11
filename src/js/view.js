import i18next from 'i18next';

const handleProcessState = (value, elements) => {
  const isLoading = value === 'loading';
  elements.fields.input.readOnly = isLoading;
  elements.fields.button.disabled = isLoading;
      
  switch (value) {
    case 'success':
      // elements.fields.input.classList.remove('is-invalid');
      // elements.fields.input.value = '';
      // elements.fields.input.focus();
      break;
    case 'fail':
      // elements.fields.input.focus();
      // elements.fields.input.select();
      break;
    default:
    // внутри рендера не обрабатываются ошибки
    // мб стоит добавить просто откат к дефолтным стилям
  }
};

const handleParsingState = (value, elements) => {
  elements.fields.input.focus();

  switch (value) {
    case 'success':
      elements.fields.input.classList.remove('is-invalid');
      elements.fields.input.value = '';

      elements.feedbackEl.textContent = i18next.t('success');
      elements.feedbackEl.classList.remove('text-danger');
      elements.feedbackEl.classList.add('text-success');
      break;
    case 'fail':
      elements.fields.input.classList.add('is-invalid');
      elements.fields.input.select();
      break;
    default:
    // внутри рендера не обрабатываются ошибки
    // мб стоит добавить просто откат к дефолтным стилям
  }
};

// const renderErrors = () => {
  
// };

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

const renderPosts = (elements, posts) => {
  elements.postsContainer.innerHTML = '';
      const { card, cardTitle, listGroup } = createCardElem();
      elements.postsContainer.appendChild(card);
      cardTitle.innerText = i18next.t('ui.posts.title');
      const postsElems = posts.map(({ id, seen, title, link }) => {
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
        button.textContent = i18next.t('ui.posts.button');

        
        // Я НЕ ПОНИМАЮ.. Нельзя же изменять состояние изнутри рендера :///
        // А в уроке Отрисовка (рендеринг) состояния говорится что:
        // Рендеринг пользуется состоянием для отрисовки (добавление, изменение или удаление элементов) и добавляет новые обработчики в DOM

        // linkElem.addEventListener('click', (event) => {
        //   event.preventDefault();
        //   console.log(event.target);
        // })
        elem.append(linkElem, button);
        return elem;
      });
      listGroup.replaceChildren(...postsElems);
};

const renderFeeds = (elements, feeds) => {
  elements.feedsContainer.innerHTML = '';
      const { card, cardTitle, listGroup } = createCardElem();
      elements.feedsContainer.appendChild(card);
      cardTitle.innerText = i18next.t('ui.feeds.title');
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

export default (elements, initialState) => (path, value, previousValue) => {
// Я чувствую, что стоит пересмотреть логику рендера, и разделить вывод ошибок и обработку стилей формы и тд
// не хочу (и не получается) обращаться к стейту, будто бы стоит юзать только аргументы самого рендера (path, value, previousValue)
    
    if (path === 'form.isValid') {
      if (value) {
        elements.fields.input.classList.remove('is-invalid');
      } else {
        elements.fields.input.classList.add('is-invalid');
        elements.fields.input.focus();
        elements.fields.input.select();
      };
    };

    // Думаю нужно плотно переписывать логику рендера и обработки ошибок в принципе, хотя с этим уже лучше чем с рендером 

    if (path === 'loadingProcess.status') {
      handleProcessState(value, elements);
    };

    if (path === 'parsingProcess.status') {
      handleParsingState(value, elements);
    };

    if (path === 'form.error' || path === 'loadingProcess.error' || path === 'parsingProcess.error') {
      elements.feedbackEl.textContent = value ? i18next.t(`errors.${value}`) : value;
      
      elements.feedbackEl.classList.add('text-danger');
      elements.feedbackEl.classList.remove('text-success');
    };

    if (path === 'posts') {
      renderPosts(elements, initialState.posts);
    };

    if (path === 'feeds') {
      renderFeeds(elements, initialState.feeds);
    };

    if (path === 'activeModal') {
      initialState.posts.forEach((post) => {
        if (post.id === value) {
          elements.modalItems.title.textContent = post.title;
          elements.modalItems.body.textContent = post.description;
          elements.modalItems.submitButton.href = post.link;
        }
      });
    }
  };
