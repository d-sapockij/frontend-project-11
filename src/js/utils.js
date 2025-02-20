import { string, setLocale } from 'yup';

export const xmlParse = (xml, url) => {
  const parser = new DOMParser();
  const parsedXml = parser.parseFromString(xml, 'application/xml');

  const errorNode = parsedXml.querySelector('parsererror');
  // Для обработки ошибок
  if (errorNode) {
    throw new Error('invalid_xml');
  }

  const feed = {
    title: parsedXml.querySelector('title').textContent,
    description: parsedXml.querySelector('description').textContent,
    link: url,
  };

  const items = parsedXml.querySelectorAll('item');
  const posts = Array.from(items)
    .map((item) => {
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      return {
        seen: false,
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
