export const parserTags = (data, keys) => {
  // data - это массив с данными 
  // console.log('data', data)
  // console.log('keys', keys)

  const result = []
  Array.from(data).forEach((item) => {
    const obj = {}
    keys.forEach((key) => {
      const elem = item.getElementsByTagName(`${key}`)
      obj[key] = elem
    })
    result.push(obj)
  })
  return result
}

export const getUlElemsFromLi = (data, keys) => {
  console.log('data', data)
  const resUl = document.createElement('ul')
  resUl.classList.add('list-group', 'border-0', 'rounded-0')

  data.forEach((item) => {
    console.log('item', item)
    const linkElem = document.createElement('a')
    const li = document.createElement('li')

    li.classList.add('list-group-item', 'd-flex',
      'justify-content-between', 'align-items-start',
      'border-0', 'border-end-0')

    keys.forEach((key) => {
      console.log('key', key)
    console.log('item[key]', item[key])
      if (key === 'link') {
        linkElem.href = item[key][0].innerHTML
      }
      if (key === 'title') {
        linkElem.textContent = item[key][0].innerHTML
      } else {
        linkElem[key] = item[key][0].innerHTML
      }
    })
    li.appendChild(linkElem)

    const button = document.createElement('button')
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm')
    button.textContent = 'Просмотр'
    button.type = 'button'

    li.appendChild(button)

    resUl.appendChild(li)
  })
  console.log('resUl', resUl)
  return resUl
}

export const getStartContainer = () => {
  const divRow = document.createElement('div')
  divRow.classList.add('row')

  const divFeeds = document.createElement('div')
  const divPosts = document.createElement('div')

  divFeeds.classList.add('col-md-10', 'col-lg-4', 'mx-auto', 'order-0', 'order-lg-1', 'feeds')
  divPosts.classList.add('col-md-10', 'col-lg-8', 'order-1', 'mx-auto', 'posts')

  const cardDivFeeds = document.createElement('div')
  const cardDivPosts = document.createElement('div')

  cardDivFeeds.classList.add('card', 'border-0')
  cardDivPosts.classList.add('card', 'border-0')

  const feedDivCardBody = document.createElement('div')
  const postsDivCardBody = document.createElement('div')

  feedDivCardBody.classList.add('card-body')
  postsDivCardBody.classList.add('card-body')

  const ulFeed = document.createElement('ul')
  // const ulPosts = document.createElement('ul')

  ulFeed.classList.add('list-group', 'border-0', 'rounded-0')
  // ulPosts.classList.add('list-group', 'border-0', 'rounded-0')

  const feedHeader = document.createElement('h2')
  const postsHeader = document.createElement('h2')

  feedHeader.classList.add('card-title', 'h4')
  postsHeader.classList.add('card-title', 'h4')

  feedHeader.textContent = 'Фиды'
  postsHeader.textContent = 'Посты'

  feedDivCardBody.appendChild(feedHeader)
  postsDivCardBody.appendChild(postsHeader)

  cardDivFeeds.appendChild(feedDivCardBody)
  cardDivPosts.appendChild(postsDivCardBody)

  cardDivFeeds.appendChild(ulFeed)
  // cardDivPosts.appendChild(ulPosts)

  divFeeds.appendChild(cardDivFeeds)
  divPosts.appendChild(cardDivPosts)

  divRow.appendChild(divFeeds)
  divRow.appendChild(divPosts)

  return divRow
}



export const getFeed = (data) => {
  // теги title description
  const li = document.createElement('li')
  li.classList.add('list-group-item', 'border-0', 'border-end-0')

  const titleTag = data.getElementsByTagName('title')[0]
  const descriptionTag = data.getElementsByTagName('description')[0]
  console.log('title', titleTag)
  console.log('desc', descriptionTag)

  const header3 = document.createElement('h3')
  header3.classList.add('h6', 'm-0')
  header3.textContent = titleTag.innerHTML

  const text = document.createElement('p')
  text.classList.add('m-0', 'small', 'text-black-50')
  text.textContent = descriptionTag.innerHTML

  li.appendChild(header3)
  li.appendChild(text)

  return li
}
