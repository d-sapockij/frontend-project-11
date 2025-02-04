import { string, setLocale } from 'yup';

export const xmlParse = (str) => {
  const parser = new DOMParser();
  const parsedXml = parser.parseFromString(str, 'application/xml');
  // Для обработки ошибок
  const errorNode = parsedXml.querySelector('parsererror');
  if (errorNode) {
    throw new Error('invalid_xml');
  } else {
    return parsedXml;
  }
};

export const validateUrl = (url, urlsList) => {
  setLocale({
    string: {
      url: 'invalid_url',
    },
  });

  const schema = string().url().nullable();
  // Проверка на корректность url и на наличие дублей в стейте
  return schema.validate(url)
    .then(() => {
      urlsList.forEach((item) => {
        if (item === url) {
          throw new Error('duplicated_url');
        }
      });
    });
};
