import axios from 'axios';
import { string, setLocale } from 'yup';
import { uniqueId } from 'lodash';

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

export const loadRss = (url) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
  .then((response) => {
    const { feed, posts } = xmlParse(response.data.contents);

    feed.id = uniqueId();
    feed.link = url;

    const postsWithId = posts.map((post) => ({
      id: uniqueId(),
      feedId: feed.id,
      ...post,
    }));

    return { feed, postsWithId };
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      throw new Error('network_error');
    } else if (error.isParsingError) {
      throw new Error('invalid_xml');
    }
  });

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
    .catch((error) => {
      const e = new Error(error.message);
      e.isValidateError = true;
      throw e;
    });
};
