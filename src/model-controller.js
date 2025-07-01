import { proxy, subscribe, snapshot } from 'valtio/vanilla'
// import updateUi from './view'
import { object, string, array } from 'yup';


const submitButton = document.querySelector('.btn')
const inputLine = document.querySelector('#url-input')
const feedbackCont = document.querySelector('.feedback')



const engine = () => {
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
    state.errors = []

    const coll = snapshot(state).feedColl;
    console.log('coll', coll)

    let schema = object().shape({
      links: string()
        .url('Ссылка должна быть валидным URL')
        .required('Введите, пожалуйста, ссылку на RSS поток')
        .notOneOf(coll, 'Такая ссылка уже есть. Введите, пожалуйста, уникальную')
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
        console.log('err', err)
        state.errors.push(err.message)
      })
  })

  updateUi()
}

export default engine

