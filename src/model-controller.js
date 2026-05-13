import { object, string, array, setLocale } from "yup";
import { proxy, subscribe, snapshot } from "valtio/vanilla";
// import updateUi from './view'

import i18next from "i18next";
import resources from "../locales/index.js";
import axios from "axios";

import {
  parserTags,
  getStartContainer,
  getUlPosts,
  getUlFeeds,
} from "./utils.js";

const submitButton = document.querySelector(".btn");
const inputLine = document.querySelector("#url-input");
const feedbackCont = document.querySelector(".feedback");

const mainContainer = document.querySelector(".container-xxl");

// console.log('resources', resources)

const getPostsPromise = (url) => {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const result = axios.get(
    `https://allorigins.hexlet.app/get?url=${encodeURIComponent(normalizedUrl)}`,
  );
  // console.log('result', result)
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
    currentFeed: "",
    dataPosts: [],
    dataFeeds: [],
    errors: [],
  });

  // const checkNewPosts = (feed) => {
  //   const currentState = snapshot(state);
  //   const newDataPromise = getPostsPromise(url);
  // };

  const updateState = (data) => {
    const currentState = snapshot(state);
    const parser = new DOMParser();
    const tags = parser.parseFromString(data.data.contents, "text/xml");

    const items = tags.getElementsByTagName("item");
    const resDomParsed = parserTags(items, ["title", "link"]);
    // console.log('resDomParsed', resDomParsed)

    const feedTitle = tags.querySelector("title");
    const feedDesc = tags.querySelector("description");
    // console.log('feedTitle', feedTitle)
    // console.log('feedDesc', feedDesc)
    const feedData = {
      title: feedTitle.innerHTML,
      description: feedDesc.innerHTML,
    };

    state.dataPosts.push(...resDomParsed);
    state.dataFeeds.push(feedData);
  };

  const refreshFeeds = () => {
    // refresh
    const currentState = snapshot(state);

    if (currentState.feedColl.length === 0) {
      setTimeout(refreshFeeds, 5000);
      return;
    }
    // 1. Собираем массив промисов для всех ссылок
    const promises = currentState.feedColl.map((url) =>
      getPostsPromise(url).then((data) => updateState(data)),
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

      const ulPosts = getUlPosts(postsData, ["title", "link"]);
      // console.log('ulPosts', ulPosts)
      const ulFeeds = getUlFeeds(feedsData);

      const posts = document.querySelector(".posts");
      const feeds = document.querySelector(".feeds");

      const postContainer = posts.querySelector(".card");
      const feedsContainer = feeds.querySelector(".card");

      postContainer.appendChild(ulPosts);
      feedsContainer.appendChild(ulFeeds);
    }
  }; // updateUI

  subscribe(state, updateUi);
  // console.log('submitButton', submitButton)
  // console.log('inputLine', inputLine)

  submitButton.addEventListener("click", (e) => {
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

    const feed = inputLine.value;

    // console.log('feed', feed)
    schema
      .validate({ links: feed })
      .then((res) => {
        // console.log('Ок', res)
        state.feedColl.push(feed);

        state.currentFeed = feed;
        state.errors = [];
        inputLine.focus();

        return snapshot(state);
      })
      .then((state) => {
        return getPostsPromise(state.currentFeed);
      })
      .then((data) => updateState(data))
      .catch((err) => {
        // console.log('err', err.errors)
        console.log("error", err);
        state.errors.push(err.message);
      })
      .finally(() => {
        // refreshFeeds();
      });
  });

  // document.addEventListener('DOMContentLoaded', () => {
  //   return refreshFeeds()
  // })
  updateUi();
  refreshFeeds();
};

export default engine;
