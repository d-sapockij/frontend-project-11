// Тут инициализируется приложение и экспортируется в index.js

import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import ru from './locales/ru.js';
import render from './view.js';
import { xmlParse, validateUrl } from './utils.js';

export default () => {
  const initialState = {
    form: {
      isValid: true,
      error: '',
    },
    loadingProcess: {
      status: 'idle', 
      // idle - статус который можно никак не обрабатывать, специальный статус который ничего не значит и нужен для начала приложения чтобы что-то было..
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
  };

  // тут инстанс добавить 
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    }
  }).then(() => {
    elements.h1.textContent = i18next.t('ui.header');
    elements.subtitle.textContent = i18next.t('ui.subtitle');
    elements.fields.input.placeholder = i18next.t('ui.placeholder');
    elements.fields.button.textContent = i18next.t('ui.button');
  });

  const watchedState = onChange(initialState, render(elements, initialState));

  // const loop = () => {
  //   setTimeout(() => {
  //     // Your logic here
  
  //     loop();
  //   }, delay);
  // };
  
  console.log(form)

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
    validateUrl(url, watchedState)
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.form.error = '';

        watchedState.loadingProcess.status = 'loading';
        watchedState.loadingProcess.error = '';

        return axios.get(`https://allorigins.hexlet.app/get?url=${url}`)
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
        const feed = {
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
            return { title, description, link };
          });
        watchedState.loadingProcess.status = 'success';
        watchedState.feeds.push(feed);
        // Почему именно так добавляю посты? Не через пуш или еще как
        watchedState.posts = [...watchedState.posts, ...itemsInfo];
        console.log(watchedState)
      })
      .catch((error) => {
        console.log(error)
        console.log(initialState)
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
};