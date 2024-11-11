import onChange from 'on-change';
import { string, setLocale } from 'yup';
import i18next from 'i18next';

import ru from './locales/ru.js';

export default () => {
    const state = {
        processState: 'default',    
        items: [],
        error: 'invalid_url',
    };

    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('#subtitle');
    const form = document.querySelector('#form');
    const input = form.elements.url;
    const button = form.elements.button;
    const errorEl = document.querySelector('#error');

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
                    errorEl.textContent = '';
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
                    break;
                case 'error':
                    input.classList.add('is-invalid');
                    errorEl.textContent = i18next.t(`errors.${state.error}`);
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
                if (state.items.includes(url)) {
                    throw new Error('duplicated_url');
                }
                watchedState.items.push(url);
                watchedState.processState = 'default';
            })
            .catch((error) => {
                watchedState.error = error.message;
                watchedState.processState = 'error';
                // console.log(state.error)
                // throw error;
            });
    });
};