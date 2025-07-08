import { object, string, array, setLocale } from 'yup';
import { proxy, subscribe, snapshot } from 'valtio/vanilla'
// import updateUi from './view'

import i18next from 'i18next';
import resources from '../locales/index.js'

const submitButton = document.querySelector('.btn')
const inputLine = document.querySelector('#url-input')
const feedbackCont = document.querySelector('.feedback')



const engine = () => {

  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          url: 'Ссылка должна быть валидным URL',
          required: 'Введите, пожалуйста, ссылку на RSS поток',
          notOneOf: 'Такая ссылка уже есть. Введите, пожалуйста, уникальную',
        }
      }
    }
  })
    .then((res) => {
      console.log('res', res)
      // console.log(i18next.t('url'))
    })
    .catch((err) => console.log(err))


  const state = proxy({
    feedColl: [],
    currentFeed: '',
    errors: [],
  })

  const updateUi = () => {
    // state.errors = []
    const obj = snapshot(state)
    console.log('obj', obj)

    if (state.errors.length > 0) {
      inputLine.classList.add('is-invalid')
      feedbackCont.textContent = obj.errors[0]
      return
    } else {
      if (obj.currentFeed) {
        inputLine.classList.remove('is-invalid')
        feedbackCont.textContent = 'Всё прошло успешно :)'
        inputLine.value = ''
      }
    }

  }

  subscribe(state, updateUi)
  // console.log('submitButton', submitButton)
  // console.log('inputLine', inputLine)


  submitButton.addEventListener('click', (e) => {
    e.preventDefault()
    // console.log(i18next.t('validation.required'))
    state.errors = []

    const coll = snapshot(state).feedColl;
    console.log('coll', coll)

    setLocale({
      string:{
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
        console.log('Ок', res)
        state.feedColl.push(feed)

        state.currentFeed = feed
        state.errors = []
        inputLine.focus()

      })
      .catch((err) => {
        console.log('err', err.errors)
        state.errors.push(err.message)
      })
  })

  updateUi()
}

export default engine

