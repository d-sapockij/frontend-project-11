import { string, setLocale } from 'yup';

export const xmlParse = (xml) => {
  const parser = new DOMParser();
  const parsedXml = parser.parseFromString(xml, 'application/xml');

  const errorNode = parsedXml.querySelector('parsererror');
  // Для обработки ошибок
  if (errorNode) {
    const error = new Error(errorNode.textContent);
    error.isParsingError = true;
    throw error;
  }

  const feed = {
    title: parsedXml.querySelector('title').textContent,
    description: parsedXml.querySelector('description').textContent,
  };

  const items = parsedXml.querySelectorAll('item');
  const posts = Array.from(items)
    .map((item) => {
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      return {
        title,
        description,
        link,
      };
    });
  return { feed, posts };
};

export const validateUrl = (url, urlsList) => {
  setLocale({
    string: {
      url: 'invalid_url',
    },
    mixed: {
      notOneOf: 'duplicated_url',
    },
  });

  const schema = string().url().required().notOneOf(urlsList);
  // Проверка на корректность url и на наличие дублей в стейте
  return schema.validate(url)
    .then(() => null)
    .catch((e) => e.message);
};
