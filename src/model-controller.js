import { object, string, array, setLocale } from 'yup';
import { proxy, subscribe, snapshot } from 'valtio/vanilla'
// import updateUi from './view'

import i18next from 'i18next';
import resources from '../locales/index.js'
import axios from 'axios';

import { parserTags, getStartContainer, getUlElemsFromLi } from './utils.js';

const submitButton = document.querySelector('.btn')
const inputLine = document.querySelector('#url-input')
const feedbackCont = document.querySelector('.feedback')

const mainContainer = document.querySelector('.container-xxl')

// console.log('resources', resources)

const engine = () => {

  i18next.init({
    lng: 'ru',
    debug: true,
    resources: resources
  })
    .then((res) => {
      console.log('res', res)
      // console.log(i18next.t('url'))
    })
    .catch((err) => console.log(err))


  const state = proxy({
    feedColl: [],
    currentFeed: '',
    data: [],
    errors: [],
  })

  const updateUi = () => {
    // state.errors = []
    const obj = snapshot(state)
    // console.log('obj', obj)

    if (state.errors.length > 0) {
      inputLine.classList.add('is-invalid')
      feedbackCont.textContent = obj.errors[0]
      feedbackCont.classList.remove('text-success')
      feedbackCont.classList.add('text-danger')
      return
    } else {
      if (obj.currentFeed) {
        inputLine.classList.remove('is-invalid')
        feedbackCont.classList.remove('text-danger')

        feedbackCont.classList.add('text-success')

        feedbackCont.textContent = 'Всё прошло успешно :)'
        inputLine.value = ''
      }
    }
    mainContainer.innerHTML = ''

    if (obj.feedColl.length > 0) {
      const startContainer = getStartContainer()
      mainContainer.appendChild(startContainer) // нарисовали оба контейнера

      const postsData = obj.data
      console.log('postData', postsData)

      const ulPosts = getUlElemsFromLi(postsData, ['title', 'link'])
      console.log('ulPosts', ulPosts)

      const posts = document.querySelector('.posts')
      const postContainer = posts.querySelector('.card')
      postContainer.appendChild(ulPosts)
    }








  } // updateUI 

  subscribe(state, updateUi)
  // console.log('submitButton', submitButton)
  // console.log('inputLine', inputLine)


  submitButton.addEventListener('click', (e) => {
    e.preventDefault()
    // console.log(i18next.t('validation.required'))
    state.errors = []

    const coll = snapshot(state).feedColl;
    const currentState = snapshot(state);
    // console.log('coll', coll)

    setLocale({
      string: {
        url: i18next.t('url'),
      },
      mixed: {
        required: i18next.t('required'),
        notOneOf: i18next.t('notOneOf')
      }
    })

    let schema = object().shape({
      links: string()
        .url()
        .required()
        .notOneOf(coll)
    })

    const feed = inputLine.value

    // console.log('feed', feed)
    schema.validate({ links: feed })
      .then((res) => {
        // console.log('Ок', res)
        state.feedColl.push(feed)

        state.currentFeed = feed
        state.errors = []
        inputLine.focus()

        return snapshot(state).currentFeed
      })
      .then((url) => {
        // console.log('snapshot(state)', snapshot(state))
        // console.log('url', url)

        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

        return axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(normalizedUrl)}`)
      })
      // .then((resu) => console.log(resu.data.contents))
      .then((data) => {
        // console.log('curState', currentState)
        // console.log('data', data)
        const parser = new DOMParser();
        const tags = parser.parseFromString(data.data.contents, "text/xml");

        const items = tags.getElementsByTagName('item')

        const resDomParsed = parserTags(items, ['title', 'link'])
        console.log('resDomParsed', resDomParsed)
        
        state.data.push(...resDomParsed)

      })
      .catch((err) => {
        // console.log('err', err.errors)
        console.log('error', err)
        state.errors.push(err.message)
      })



  })

  updateUi()
}

export default engine

