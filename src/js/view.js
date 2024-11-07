import onChange from 'on-change';
import { string } from 'yup';

export default () => {
    let schema = string().url().nullable();

    const state = {
        ui: {
            processState: 'default',    
        },
        items: [],    
    };

    const form = document.querySelector('form.form');

    const render = (path, value, previousValue, applyData) => {
        if (path === 'ui.processState') {
            const input = form.elements.url;
            switch (value) {
                case 'default':
                    input.classList.remove('is-invalid');
                    input.value = '';
                    input.focus();
                    break;
                case 'error':
                    input.classList.add('is-invalid');
                    input.focus();
                    break;
                default:
                    throw new Error(`Unknown process state: ${value}`);
            }
        };
    }

    const watchedState = onChange(state, render);

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const url = formData.get('url');
        
        schema.validate(url)
            .then((url) => {
                if (state.items.includes(url)) {
                    throw new Error('This URL has already been added');
                }
                watchedState.items.push(url);
                watchedState.ui.processState = 'default';
                console.log(state.items)
            })
            .catch((error) => {
                watchedState.ui.processState = 'error';
                console.error(error)
                // throw error;
            });
    });
};