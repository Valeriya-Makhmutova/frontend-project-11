import { object, string, array, setLocale } from "yup";
import { proxy, subscribe, snapshot } from "valtio/vanilla";
// import updateUi from './view'

import i18next from "i18next";
import resources from "../locales/index.js";
import axios from "axios";

import {
  getStartContainer,
  getUlPosts,
  getUlFeeds,
  XMLparserByTags,
} from "./utils.js";


const submitButton = document.querySelector(".btn");
const inputLine = document.querySelector("#url-input");
const feedbackCont = document.querySelector(".feedback");
const mainContainer = document.querySelector(".container-xxl");

const successClasses = () => {
  inputLine.classList.remove("is-invalid");
  feedbackCont.classList.remove("text-danger");
  feedbackCont.classList.add("text-success");
}

const errorClasses = () => {
  inputLine.classList.add("is-invalid");
  feedbackCont.classList.remove("text-success");
  feedbackCont.classList.add("text-danger");
}

const getPostsPromise = (url, retries = 3, delay = 100) => {
  // эта функция возвращает просто xml разметку
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  return axios.get(
    `https://allorigins.hexlet.app/get?url=${encodeURIComponent(normalizedUrl)}`,
  { timeout: 5000 }).catch((error) => {
    // Если попытки остались И это ошибка сети/таймаута (нет ответа от сервера)
    if (retries > 1 && (!error.response || error.response.status >= 500)) {
      console.warn(`Сеть нестабильна, повторяю запрос... Осталось попыток: ${retries - 1}`);
      
      // Ждем указанное время и вызываем функцию снова
      return new Promise((resolve) => setTimeout(resolve, delay))
        .then(() => getPostsPromise(url, retries - 1, delay * 2)); // Удваиваем задержку
    }
    
    // Если попытки исчерпаны или это ошибка 4xx (например, 404), пробрасываем её дальше
    throw error;
  });
    // возвращаем промис
};

const engine = () => {
  i18next
    .init({
      lng: "ru",
      debug: true,
      resources: resources,
    })
    .then((res) => {
      console.log("res", res);
      // console.log(i18next.t('url'))
    })
    .catch((err) => {
      console.log(err);
    });

  const state = proxy({
    isFirstCall: true,
    feedColl: [],
    currentFeed: "", // TODO: убрать currentFeed
    dataPosts: [],
    dataFeeds: [],
    errors: [],
  });

  const updateState = (data) => {
    const currentstate = snapshot(state);
    const { postsData, feedData: newFeed } = XMLparserByTags(
      data.data.contents,
    );
    console.log('new feed', newFeed)
    const currentFeed = currentstate.dataFeeds.find(
      (feed) => feed.link === newFeed.link && feed.title === newFeed.title,
    );

    const currentFeedIdx = currentstate.dataFeeds.findIndex(
      (feed) => feed.link === newFeed.link && feed.title === newFeed.title,
    );
    console.log('currentFeed', currentFeed)
    console.log('newFeed', newFeed)
    if (currentFeed) {
      if (currentFeed.lastBuildDate !== newFeed.lastBuildDate) {
        const newPosts = postsData.filter((post) =>
          currentstate.dataPosts.every(
            (statePost) => statePost.title !== post.title,
          ),
        );
        // добавить к фидам id, а к постам id фидов
        // console.log('newPosts', newPosts)
        state.dataPosts.push(...newPosts);
        state.dataFeeds[currentFeedIdx].lastBuildDate = newFeed.lastBuildDate;
      }
      // return;
    } else {
      state.dataPosts.push(...postsData);
      state.dataFeeds.push(newFeed);
    }
    const secondCurrentstate = snapshot(state);
    console.log('secondCurrentstate', secondCurrentstate)
  };

  const refreshFeeds = () => {
    // refresh
    const currentState = snapshot(state);
    // console.log('currState', currentState)

    if (currentState.feedColl.length === 0) {
      setTimeout(refreshFeeds, 5000);
      return;
    }
    // 1. Собираем массив промисов для всех ссылок
    const promises = currentState.feedColl.map((url) =>
      getPostsPromise(url).then((data) => {
        // console.log("data in refresh", data);
        return updateState(data);
      }).catch((error) => {
        console.error('Все попытки получить данные исчерпаны.')
        errorClasses()
        feedbackCont.textContent = 'Ошибка сети'
      }),
    );
    // 2. Ждем, пока обновятся ВСЕ ссылки
    Promise.allSettled(promises).finally(() => {
      // 3. Только КОГДА ВСЕ завершились, планируем ОДИН следующий общий вызов
      setTimeout(refreshFeeds, 5000);
    });
  };

  const updateUi = () => {
    // state.errors = []
    const obj = snapshot(state);
    // console.log('obj', obj)

    if (state.errors.length > 0) {
      errorClasses()
      feedbackCont.textContent = "Ресурс не содержит валидный RSS"
      return;
    } else {
      if (obj.currentFeed) {
        successClasses()
        feedbackCont.textContent = "RSS успешно загружен";
        setTimeout(() => {
          feedbackCont.textContent = ""
        },5000)
        
        inputLine.value = "";
      }
    }
    mainContainer.innerHTML = "";

    if (obj.feedColl.length > 0) {
      const startContainer = getStartContainer();
      mainContainer.appendChild(startContainer); // нарисовали оба контейнера

      const postsData = obj.dataPosts;
      const feedsData = obj.dataFeeds;
      // console.log('postData', postsData)
      console.log('feedsData', feedsData)
      const ulPosts = getUlPosts(postsData);
      // console.log('ulPosts', ulPosts)
      const ulFeeds = getUlFeeds(feedsData);
      

      const posts = document.querySelector(".posts");
      const feeds = document.querySelector(".feeds");

      const postContainer = posts.querySelector(".card");
      const feedsContainer = feeds.querySelector(".card");
      // console.log(obj, 'obj')
      // console.log(ulFeeds, 'ulFeeds')
      postContainer.appendChild(ulPosts);
      feedsContainer.appendChild(ulFeeds);
    }


    
  }; // updateUI

  subscribe(state, updateUi);

  submitButton.addEventListener("click", (e) => {
    // в этом случае мы только по кнопке запрашиваем данные
    e.preventDefault();
    // console.log(i18next.t('validation.required'))
    state.errors = [];

    const coll = snapshot(state).feedColl;
    const currentState = snapshot(state);
    // console.log('coll', coll)

    setLocale({
      string: {
        url: i18next.t("url"),
      },
      mixed: {
        required: i18next.t("required"),
        notOneOf: i18next.t("notOneOf"),
      },
    });

    let schema = object().shape({
      links: string().url().required().notOneOf(coll),
    });

    const feed = inputLine.value; // забрали ссылку на фид из формы 'http...'

    // console.log('feed', feed)
    schema
      .validate({ links: feed })
      .then((res) => {
        // console.log('Ок', res)
        state.feedColl.push(feed); // поместили в коллекцию фидов эту ссылку

        state.currentFeed = feed; // пометили текущую ссылку
        state.errors = [];
        inputLine.focus();

        return snapshot(state); // проталкиваем текущее состояние
      })
      .then((state) => {
        // текущее состояние
        return getPostsPromise(state.currentFeed); // делаем get запрос и получаем xml разметку в виде строки
      })
      .then((data) => {
        return updateState(data);
      }) // в стейт тут должны отдавать данные в виде объекта
      .catch((err) => {
        // console.log('err', err.errors)
        console.log("error", err);
        // state.errors.push(err.message);
        console.error('Все попытки получить данные исчерпаны.')
        errorClasses()
        feedbackCont.textContent = 'Ошибка сети'
      });
  });

  mainContainer.addEventListener('click', function(event) {
    const currentState = snapshot(state);
    if (event.target.classList.contains('btn-sm')) {
      const linkElement = event.target.parentElement.querySelector('a')
      const targetPost = state.dataPosts.find(post => post.title === linkElement.textContent); 
      //linkElement.textContent заголовок
      if (targetPost) {
        targetPost.isViewed = true
        const parser = new DOMParser();
        const doc = parser.parseFromString(targetPost.description, 'text/html');
        const cleanDescription = doc.body.textContent;
        const modalTitle = document.querySelector('.modal-title')
        const modalDescription = document.querySelector('.modal-body')
        const modalLinkButton = document.querySelector('.btn-primary-modal')
        modalTitle.innerHTML = targetPost.title
        modalDescription.innerHTML = cleanDescription
        modalLinkButton.setAttribute("href", targetPost.link)
        updateUi()
      }
    }
  })
  


  updateUi();
  // refreshFeeds();
};

export default engine;
