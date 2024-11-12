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
        }
      },
      errors: {
        duplicated_url: 'RSS уже существует',
        invalid_url: 'Ссылка должна быть валидным URL',
        invalid_xml: 'Ресурс не содержит валидный RSS',
        network_error: 'Похоже, проблема с сетью.. Попробуйте повторить ввод позже',
      },
    },
  };