import onChange from 'on-change';
import { string, setLocale } from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import ru from './locales/ru.js';

const xmlParse = (str) => {
    const parser = new DOMParser();
    const parsedXml = parser.parseFromString(str, 'application/xml');
    
    // // Для обработки ошибок
    // const errorNode = parsedXml.querySelector("parsererror");
    // if (errorNode) {
    //     throw new Error('invalid_xml');
    // } else {
    return parsedXml;
    // }
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
        form: {
            isValid: true,
            error: '',
        },
        loadingProcess: {
            status: 'idle', // статус который можно никак не обрабатывать, специальный статус который ничего не значит и нужен для начала приложения чтобы что-то было..
            // loading, success, fail
            error: '',
        },
        feeds: [],
        posts: [],
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

        if (path === 'form.isValid') {
            if (value) {
                input.classList.remove('is-invalid');
                feedbackEl.textContent = '';
            } else {
                input.classList.add('is-invalid');
                feedbackEl.textContent = i18next.t(`errors.${state.form.error}`);
            };
        };


        if (path === 'loadingProcess.status') {
            switch (value) {
                case 'loading':
                    input.readOnly = true;
                    button.disabled = true;
                    break;
                case 'success':
                    input.classList.remove('is-invalid');
                    feedbackEl.textContent = '';
                    input.value = '';
                    input.focus();
                    input.readOnly = false;
                    button.disabled = false;
                    break;
                case 'fail':
                    // input.classList.add('is-invalid');
                    feedbackEl.textContent = i18next.t(`errors.${state.loadingProcess.error}`);
                    input.focus();
                    input.select();
                    input.readOnly = false;
                    button.disabled = false;
                    break;
                default:
                    throw new Error(`unknown_loading_state`);
                    // Эта ошибка будто бы теперь не отобразится в UI
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
                
                return elem;
            });
            listGroup.replaceChildren(...feedsElems);
        };
    };

    const watchedState = onChange(state, render);

    setLocale({
        string: {
          url: 'invalid_url',
        },
      });

    let schema = string().url().nullable();
    
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        // watchedState.processState = 'sending';
        const formData = new FormData(event.target);
        const url = formData.get('url');
        schema.validate(url)
            .catch((error) => {
                watchedState.form.error = error.message;
                watchedState.form.isValid = false;
                throw error;
            })
            .then(() => {
                state.feeds.forEach(({ link }) => {
                    if (link === url) {
                        watchedState.form.isValid = false;
                        watchedState.form.error = 'duplicated_url';
                        throw new Error('duplicated_url');
                    };
                });
            })
            .then(() => {
                watchedState.form.isValid = true;
                watchedState.loadingProcess.status = 'loading';
                return axios.get(`https://allorigins.hexlet.app/get?url=${url}`)
                    .catch(() => {
                        watchedState.loadingProcess.error = 'network_error';
                        watchedState.loadingProcess.status = 'fail';
                        throw new Error('network_error');
                        // Настроить axios чтобы если запрос длился больше 10 секунд отдавал ошибку
                    });
            })
            .then((response) => {
                const parsedFeed = xmlParse(response.data.contents);
                const errorNode = parsedFeed.querySelector("parsererror");
                if (errorNode) {
                    watchedState.loadingProcess.error = 'invalid_xml';
                    watchedState.loadingProcess.status = 'fail';
                    throw new Error('invalid_xml');
                };
                const feedTitle = parsedFeed.querySelector('title').textContent;
                const feedDescription = parsedFeed.querySelector('description').textContent;
                const feed = {
                    title: feedTitle,
                    description: feedDescription,
                    link: url,
                };
        
                const items = parsedFeed.querySelectorAll('item');
                const itemsInfo = Array.from(items).map((item) => {
                    const title = item.querySelector('title').textContent;
                    const description = item.querySelector('description').textContent;
                    const link = item.querySelector('link').textContent;
                    return { title, description, link };
                });
                // console.log(itemsInfo)
                // watchedState.processState = 'default';
                watchedState.loadingProcess.status = 'success';
                watchedState.feeds.push(feed);
                watchedState.posts = [...watchedState.posts, ...itemsInfo];
                console.log(state)
            });
    });
};