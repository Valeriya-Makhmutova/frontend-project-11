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

const getPostsPromise = (url) => {
  // эта функция возвращает просто xml разметку
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const result = axios.get(
    `https://allorigins.hexlet.app/get?url=${encodeURIComponent(normalizedUrl)}`,
  );
  return result; // возвращаем промис
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

    const currentFeed = currentstate.dataFeeds.find(
      (feed) => feed.link === newFeed.link,
    );

    const currentFeedIdx = currentstate.dataFeeds.findIndex(
      (feed) => feed.link === newFeed.link,
    );

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
      return;
    } else {
      state.dataPosts.push(...postsData);
      state.dataFeeds.push(newFeed);
    }
  };

  const refreshFeeds = () => {
    // refresh
    const currentState = snapshot(state);
    console.log('currState', currentState)

    if (currentState.feedColl.length === 0) {
      setTimeout(refreshFeeds, 5000);
      return;
    }
    // 1. Собираем массив промисов для всех ссылок
    const promises = currentState.feedColl.map((url) =>
      getPostsPromise(url).then((data) => {
        console.log("data in refresh", data);
        return updateState(data);
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
      inputLine.classList.add("is-invalid");
      feedbackCont.textContent = obj.errors[0];
      feedbackCont.classList.remove("text-success");
      feedbackCont.classList.add("text-danger");
      return;
    } else {
      if (obj.currentFeed) {
        inputLine.classList.remove("is-invalid");
        feedbackCont.classList.remove("text-danger");

        feedbackCont.classList.add("text-success");

        feedbackCont.textContent = "Всё прошло успешно :)";
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

      const ulPosts = getUlPosts(postsData);
      // console.log('ulPosts', ulPosts)
      const ulFeeds = getUlFeeds(feedsData);

      const posts = document.querySelector(".posts");
      const feeds = document.querySelector(".feeds");

      const postContainer = posts.querySelector(".card");
      const feedsContainer = feeds.querySelector(".card");

      // const postsSet = new Set(ulPosts)
      // const feedsSet = new Set(ulFeeds)

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
        console.log("data in submit", data);
        return updateState(data);
      }) // в стейт тут должны отдавать данные в виде объекта
      .catch((err) => {
        // console.log('err', err.errors)
        console.log("error", err);
        state.errors.push(err.message);
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
        console.log('targetPost', targetPost)
        // console.log('targetPost cleanDescription', cleanDescription)
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
  refreshFeeds();
};

export default engine;
