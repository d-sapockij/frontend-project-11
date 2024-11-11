import onChange from 'on-change';
import { string, setLocale } from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import ru from './locales/ru.js';

const xmlParse = (str) => {
    const parser = new DOMParser();
    const parsedXml = parser.parseFromString(str, 'application/xml');
    
    // Для обработки ошибок
    const errorNode = parsedXml.querySelector("parsererror");
    if (errorNode) {
        throw new Error('invalid_xml');
    } else {
        return parsedXml;
    }
};

export default () => {
    const state = {
        processState: 'default',    
        urls: [],
        feeds: [],
        items: [],
        error: 'invalid_url',
    };

    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('#subtitle');
    const form = document.querySelector('#form');
    const input = form.elements.url;
    const button = form.elements.button;
    const feedbackEl = document.querySelector('#feedback');

    // тут инстансы добавить придется думаю
    i18next.init({
        lng: 'ru',
        debug: true,
        resources: {
            ru,
        }
    }).then(() => {
        h1.textContent = i18next.t('ui.header');
        subtitle.textContent = i18next.t('ui.subtitle');
        input.placeholder = i18next.t('ui.placeholder');
        button.textContent = i18next.t('ui.button');
    });


    const render = (path, value, previousValue) => {
        if (path === 'processState') {
            switch (value) {
                case 'default':
                    input.classList.remove('is-invalid');
                    feedbackEl.textContent = '';
                    input.value = '';
                    input.focus();
                    break;
                case 'sending':
                    // запихать что-то типа блокировки формы на время отправки
                    // пока он тут нужен чтобы onChange отрабатывал даже если state меняется на тот же самый 
                    // error => error например
                    // без этого кейс с error не отрабатывает каждый раз, только в первый
                    // хорошо прослеживается на input.select()
                    // отработает при ошибке только один раз, пока не сменится на другой state
                    // ну и в целолм onChange работает при СМЕНЕ чего-то) так что все логично

                    // ну и так-то актуально.. время какое-то проходит пока ответ приходит
                    break;
                case 'error':
                    input.classList.add('is-invalid');
                    feedbackEl.textContent = i18next.t(`errors.${state.error}`);
                    input.focus();
                    input.select();
                    break;
                default:
                    throw new Error(`Unknown process state: ${value}`);
            }
        };
    }

    const watchedState = onChange(state, render);

    setLocale({
        string: {
          url: 'invalid_url',
        },
      });

    let schema = string().url().nullable();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        watchedState.processState = 'sending';
        const formData = new FormData(event.target);
        const url = formData.get('url');
        
        schema.validate(url)
            .then((url) => {
                if (state.urls.includes(url)) {
                    throw new Error('duplicated_url');
                }
                const request = axios.get(`https://allorigins.hexlet.app/get?url=${url}`)
                    .catch(() => {
                        throw new Error('network_error');
                    });
                return request;
            })
            .then((response) => {
                // console.log(response.data.contents)
                const parsedFeed = xmlParse(response.data.contents);
                const feedTitle = parsedFeed.querySelector('title').textContent;
                const feedDescription = parsedFeed.querySelector('description').textContent;
                const items = parsedFeed.querySelectorAll('item');
                const itemsInfo = Array.from(items).map((item) => {
                    const title = item.querySelector('title').textContent;
                    const description = item.querySelector('description').textContent;
                    const link = item.querySelector('link').textContent;
                    return { title, description, link };
                });
                // console.log(itemsInfo)
                watchedState.urls.push(url);
                watchedState.feeds.push({ title: feedTitle, decription: feedDescription });
                watchedState.items = [...watchedState.items, ...itemsInfo];
                watchedState.processState = 'default';
                console.log(state)
            })
            .catch((error) => {
                watchedState.error = error.message;
                watchedState.processState = 'error';
                // console.error(error)
                // console.log(state.error)
                throw error;
            });
    });
};