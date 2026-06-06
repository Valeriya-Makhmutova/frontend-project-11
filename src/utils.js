export const getUlPosts = (dataObj) => {
  {
    console.log("dataObj", dataObj); // обычный объект

    // {title: 'Нобелевская премия по химии — 2025',
    //   link: 'https://elementy.ru/novosti_nauki/434390/Nobelevskaya_premiya_po_khimii_2025',
    //   pubDate: '03 Nov 2025 15:48:00 +0300'}

    const resUl = document.createElement("ul"); // обертка список

    resUl.classList.add("list-group", "border-0", "rounded-0");

    dataObj.forEach((item) => {
      // console.log('item', item)
      const linkElem = document.createElement("a");
      const li = document.createElement("li");

      li.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-start",
        "border-0",
        "border-end-0",
      );

      linkElem.href = item.link;

      linkElem.textContent = item.title;

      li.appendChild(linkElem);

      const button = document.createElement("button");
      button.classList.add("btn", "btn-outline-primary", "btn-sm");
      button.textContent = "Просмотр";
      button.type = "button";

      li.appendChild(button);

      resUl.appendChild(li);
    });
    // console.log('resUl', resUl)
    return resUl;
  }
};

export const getStartContainer = () => {
  const divRow = document.createElement("div");
  divRow.classList.add("row");

  const divFeeds = document.createElement("div");
  const divPosts = document.createElement("div");

  divFeeds.classList.add(
    "col-md-10",
    "col-lg-4",
    "mx-auto",
    "order-0",
    "order-lg-1",
    "feeds",
  );
  divPosts.classList.add(
    "col-md-10",
    "col-lg-8",
    "order-1",
    "mx-auto",
    "posts",
  );

  const cardDivFeeds = document.createElement("div");
  const cardDivPosts = document.createElement("div");

  cardDivFeeds.classList.add("card", "border-0");
  cardDivPosts.classList.add("card", "border-0");

  const feedDivCardBody = document.createElement("div");
  const postsDivCardBody = document.createElement("div");

  feedDivCardBody.classList.add("card-body");
  postsDivCardBody.classList.add("card-body");

  const feedHeader = document.createElement("h2");
  const postsHeader = document.createElement("h2");

  feedHeader.classList.add("card-title", "h4");
  postsHeader.classList.add("card-title", "h4");

  feedHeader.textContent = "Фиды";
  postsHeader.textContent = "Посты";

  feedDivCardBody.appendChild(feedHeader);
  postsDivCardBody.appendChild(postsHeader);

  cardDivFeeds.appendChild(feedDivCardBody);
  cardDivPosts.appendChild(postsDivCardBody);

  divFeeds.appendChild(cardDivFeeds);
  divPosts.appendChild(cardDivPosts);

  divRow.appendChild(divFeeds);
  divRow.appendChild(divPosts);

  return divRow;
};

export const getUlFeeds = (data) => {
  const ulFeeds = document.createElement("ul");
  ulFeeds.classList.add("list-group", "border-0", "rounded-0");

  data.forEach((pairObj) => {
    const li = document.createElement("li");
    li.classList.add("list-group-item", "border-0", "border-end-0");

    const header = document.createElement("h3");
    header.classList.add("h6", "m-0");
    header.textContent = pairObj.title;

    const text = document.createElement("p");
    text.classList.add("m-0", "small", "text-black-50");
    text.textContent = pairObj.description;

    li.appendChild(header);
    li.appendChild(text);

    ulFeeds.appendChild(li);
  });

  console.log("ulFeeds", ulFeeds);
  return ulFeeds;
};

const getDataFromFeed = (xmlData) => {
  const title = xmlData.querySelector("title");
  const description = xmlData.querySelector("description");
  const lastBuildDate = xmlData.querySelector("lastBuildDate");
  const link = xmlData.querySelector("link");

  return {
    title: title.textContent,
    description: description.textContent,
    lastBuildDate: lastBuildDate.textContent,
    link: link.textContent,
  };
};

const getPostsData = (xmlData) => {
  const resultPostsData = [];
  const items = xmlData.querySelectorAll("item");
  //"title", "link", "pubDate"

  items.forEach((item) => {
    const link = item.querySelector("link");
    const title = item.querySelector("title");
    const pubDate = item.querySelector("pubDate");

    const itemData = {
      title: title.textContent,
      link: link.textContent,
      pubDate: pubDate.textContent,
    };

    resultPostsData.push(itemData);
  });
  return resultPostsData;
};

export const XMLparserByTags = (contents) => {
  const parser = new DOMParser();
  const xmlData = parser.parseFromString(contents, "text/xml"); // строку с сервера в формате xml превращаем в DOM

  // console.log("xmlData", xmlData);

  const feedData = getDataFromFeed(xmlData);
  const postsData = getPostsData(xmlData);
  // console.log("feedData", feedData);
  // console.log("postsData", postsData);

  return { postsData, feedData };
};
