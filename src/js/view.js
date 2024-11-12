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
}

export default () => {
    const state = {
        processState: 'default',    
        urls: [],
        feeds: [],
        posts: [],
        error: '',
    };

    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('#subtitle');
    const form = document.querySelector('#form');
    const input = form.elements.url;
    const button = form.elements.button;
    const feedbackEl = document.querySelector('#feedback');

    const postsContainer = document.querySelector('#posts');
    const feedsContainer = document.querySelector('#feeds');

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

        if (path === 'posts') {
            postsContainer.innerHTML = '';
            const { card, cardTitle, listGroup } = createCardElem();
            postsContainer.appendChild(card);
            cardTitle.innerText = i18next.t('ui.posts.title');
            const postsElems = state.posts.map(({ title, description, link }) => {
                const elem = document.createElement('li');
                elem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
                const linkElem = document.createElement('a');
                linkElem.href = link;
                linkElem.classList.add('fw-bold');
                linkElem.target = '_blank';
                linkElem.rel = 'noopener noreferrer';
                linkElem.textContent = title;
                elem.appendChild(linkElem);
                return elem;
            });
            listGroup.replaceChildren(...postsElems);
        };

        if (path === 'feeds') {
            feedsContainer.innerHTML = '';
            const { card, cardTitle, listGroup } = createCardElem();
            feedsContainer.appendChild(card);
            cardTitle.innerText = i18next.t('ui.feeds.title');
            const feedsElems = state.feeds.map(({ title, description }) => {
                const elem = document.createElement('li');
                elem.classList.add('list-group-item', 'border-0', 'border-end-0');
                const elemTitle = document.createElement('h3');
                elemTitle.classList.add('h6', 'm-0');
                elemTitle.textContent = title;
                const elemText = document.createElement('p');
                elemText.classList.add('m-0', 'small', 'text-black-50');
                elemText.textContent = description;

                elem.replaceChildren(elemTitle, elemText);
                
                console.log('decsdasdsad', description)

                return elem;
            });
            listGroup.replaceChildren(...feedsElems);
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
                
                console.log(parsedFeed)

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
                watchedState.feeds.push({ title: feedTitle, description: feedDescription });
                watchedState.posts = [...watchedState.posts, ...itemsInfo];
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