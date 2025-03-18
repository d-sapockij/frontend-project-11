// Тут инициализируется приложение и экспортируется в index.js

import onChange from 'on-change';
import i18next from 'i18next';
import 'bootstrap';
import ru from './locales/ru.js';
import render from './view.js';
import { validateUrl, loadRss } from './utils.js';

const updatePosts = (state, elements) => {
  console.log(state);
  setTimeout(() => {
    console.log('updating');

    const promises = state.feeds.map((feed) => loadRss(feed.link)
      .then(({ postsWithId: posts }) => {
        const oldPostsLinks = state.posts
          .filter((post) => post.feedId === feed.id)
          .map(({ link }) => link);
        const newPosts = posts
          .filter(({ link }) => !oldPostsLinks.includes(link))
          .map((post) => ({
            ...post,
            feedId: feed.id,
          }));
        state.posts.push(...newPosts);
      }));
    const promise = Promise.all(promises);
    promise.then(() => updatePosts(state, elements));
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

  updatePosts(watchedState, elements);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const url = formData.get('url');
    const currentUrls = watchedState.feeds.map(({ link }) => link);

    validateUrl(url, currentUrls)
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.form.error = '';
        watchedState.loadingProcess.status = 'loading';
        watchedState.loadingProcess.error = '';

        return loadRss(url);
      })
      .then(({ feed, postsWithId }) => {
        watchedState.loadingProcess.status = 'success';
        watchedState.loadingProcess.error = '';

        watchedState.feeds.push(feed);
        watchedState.posts = [...watchedState.posts, ...postsWithId];
      })
      .catch((error) => {
        if (error.isValidateError) {
          watchedState.form.isValid = false;
          watchedState.form.error = error.message;
        } else {
          watchedState.loadingProcess.status = 'fail';
          watchedState.loadingProcess.error = error.message;
        }

        console.log(error);
      });
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
