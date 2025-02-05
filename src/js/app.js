// Тут инициализируется приложение и экспортируется в index.js

import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import 'bootstrap';
import ru from './locales/ru.js';
import render from './view.js';
import { xmlParse, validateUrl } from './utils.js';

const updatePosts = (state, elements) => {
  setTimeout(() => {
    console.log(state);
    state.feeds.forEach((feed) => {
      axios.get(`https://allorigins.hexlet.app/get?url=${feed.link}`)
        .then((response) => {
          const oldPostsLinks = state.posts
            .filter((post) => post.feedId === feed.id)
            .map(({ link }) => link);

          const parsedFeed = xmlParse(response.data.contents);
          const items = parsedFeed.querySelectorAll('item');
          const newPosts = Array.from(items)
            .map((item) => {
              const title = item.querySelector('title').textContent;
              const description = item.querySelector('description').textContent;
              const link = item.querySelector('link').textContent;
              return { title, description, link };
            })
            .filter(({ link }) => !oldPostsLinks.includes(link))
            .map((item) => ({
              id: uniqueId(),
              feedId: feed.id,
              seen: false,
              ...item,
            }));
            // eslint-disable-next-line
          state.posts = [...state.posts, ...newPosts];
        });
    });
    updatePosts(state, elements);
  }, 5000);
};

export default () => {
  const initialState = {
    form: {
      isValid: true,
      error: '',
    },
    loadingProcess: {
      status: 'idle',
      // idle - статус который можно никак не обрабатывать,
      // специальный статус который ничего не значит
      // и нужен для начала приложения чтобы что-то было..
      // loading, success, fail
      error: '',
    },
    // Добавил parsingProcess потому что надо завязаться на что-то когда буду очищать инпут
    parsingProcess: {
      status: 'idle',
      // success, fail
      error: '',
    },
    feeds: [],
    posts: [],
  };

  const elements = {
    h1: document.querySelector('h1'),
    subtitle: document.querySelector('#subtitle'),
    form: document.querySelector('#form'),
    fields: {
      input: document.querySelector('#url-input'),
      button: document.querySelector('#button'),
    },
    feedbackEl: document.querySelector('#feedback'),
    postsContainer: document.querySelector('#posts'),
    feedsContainer: document.querySelector('#feeds'),
    modal: document.querySelector('#modal'),
    modalItems: {
      title: document.querySelector('#modal-title'),
      body: document.querySelector('.modal-body'),
      submitButton: document.querySelector('#modal-button'),
      closeButton: document.querySelector('#modal-close-button'),
    },
  };

  // тут инстанс добавить
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => {
    elements.h1.textContent = i18next.t('ui.header');
    elements.subtitle.textContent = i18next.t('ui.subtitle');
    elements.fields.input.placeholder = i18next.t('ui.placeholder');
    elements.fields.button.textContent = i18next.t('ui.button');
    elements.modalItems.submitButton.textContent = i18next.t('ui.modal.submitButton');
    elements.modalItems.closeButton.textContent = i18next.t('ui.modal.closeButton');
  });

  const watchedState = onChange(initialState, render(elements, initialState));

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Сделал чтобы задоджить ситуацию описанную в ТГ
    // Поискать в избранном по подстроке:
    // крч проблема, когда не зануляется в стэйте состояние парсинга
    watchedState.form.isValid = true;
    watchedState.form.error = '';
    watchedState.loadingProcess.status = 'idle';
    watchedState.loadingProcess.error = '';
    watchedState.parsingProcess.status = 'idle';
    watchedState.parsingProcess.error = '';

    const formData = new FormData(event.target);
    const url = formData.get('url');
    const currentUrls = watchedState.feeds.map(({ link }) => link);
    validateUrl(url, currentUrls)
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.form.error = '';

        watchedState.loadingProcess.status = 'loading';
        watchedState.loadingProcess.error = '';
        return axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`);
      })
      .then((response) => {
        watchedState.loadingProcess.status = 'success';
        watchedState.loadingProcess.error = '';

        const parsedFeed = xmlParse(response.data.contents);
        // Ошибки можно обработать внутри внутри xmlParse
        watchedState.parsingProcess.status = 'success';
        watchedState.parsingProcess.error = '';

        const feedTitle = parsedFeed.querySelector('title').textContent;
        const feedDescription = parsedFeed.querySelector('description').textContent;
        const feedId = uniqueId();
        const feed = {
          id: feedId,
          title: feedTitle,
          description: feedDescription,
          link: url,
        };

        const items = parsedFeed.querySelectorAll('item');
        const itemsInfo = Array.from(items)
          .map((item) => {
            const title = item.querySelector('title').textContent;
            const description = item.querySelector('description').textContent;
            const link = item.querySelector('link').textContent;
            return {
              id: uniqueId(),
              feedId,
              seen: false,
              title,
              description,
              link,
            };
          });
        watchedState.loadingProcess.status = 'success';
        watchedState.feeds.push(feed);
        watchedState.posts = [...watchedState.posts, ...itemsInfo];

        updatePosts(watchedState, elements);
      })
      .catch((error) => {
        console.log(error);
        if (axios.isAxiosError(error)) {
          watchedState.loadingProcess.error = 'network_error';
          watchedState.loadingProcess.status = 'fail';
          // добавить обработку чтобы если запрос длился больше 10 секунд axios отдавал ошибку
        } else if (error.message === 'invalid_xml') {
          watchedState.parsingProcess.error = error.message;
          watchedState.parsingProcess.status = 'fail';
        } else {
          watchedState.form.error = error.message;
          watchedState.form.isValid = false;
        }
        // попробую вынести это в общий блок для общей обработки в view
        // watchedState.form.isValid = false;
      });

    // вынести коды ошибок в константы
  });

  elements.postsContainer.addEventListener('click', (event) => {
    const currentId = event.target.dataset.id;
    watchedState.posts.forEach((item, index) => {
      if (item.id === currentId) {
        watchedState.posts[index].seen = true;
      }
    });

    if (currentId && event.target.tagName === 'BUTTON') {
      watchedState.posts.forEach((item) => {
        if (item.id === currentId) {
          watchedState.activeModal = currentId;
        }
      });
    }
  });
};
