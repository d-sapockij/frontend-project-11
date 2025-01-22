import { string, setLocale } from 'yup';

export const xmlParse = (str) => {
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

export const validateUrl = (url, state) => {
  setLocale({
    string: {
      url: 'invalid_url',
    },
  });

  let schema = string().url().nullable();
  // Проверка на корректность url и на наличие дублей в стейте
  return schema.validate(url)
    .then(() => {
      state.feeds.forEach(({ link }) => {
        if (link === url) {
          throw new Error('duplicated_url');
        };
      });
    })
};
