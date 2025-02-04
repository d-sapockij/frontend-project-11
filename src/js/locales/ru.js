// https://ru.hexlet.io/code_reviews/1609954

export default {
  translation: {
    languages: {
      // en: 'English',
      ru: 'Русский',
    },
    ui: {
      header: 'RSS агрегатор',
      subtitle: 'Начните читать RSS сегодня! Это легко, это красиво.',
      placeholder: 'Ссылка RSS',
      button: 'Добавить',
      posts: {
        title: 'Посты',
        button: 'Просмотр',
      },
      feeds: {
        title: 'Фиды',
      },
      modal: {
        submitButton: 'Читать полностью',
        closeButton: 'Закрыть',
      },
    },
    errors: {
      duplicated_url: 'RSS уже существует',
      invalid_url: 'Ссылка должна быть валидным URL',
      invalid_xml: 'Ресурс не содержит валидный RSS',
      network_error: 'Ошибка сети',
      unknown_loading_state: 'Что-то пошло не так.. Попробуйте перезагрузить страницу или попробовать позже',
    },
    success: 'RSS успешно загружен',
  },
};
