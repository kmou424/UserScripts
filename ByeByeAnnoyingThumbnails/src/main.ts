// @ts-ignore isolatedModules

import {GM_addStyle} from "$";
import {Crypto} from "../../common/lib/crypto";
import Mutex from "../../common/lib/mutex";
import {BBAT_APP_NAME} from "./const";

const CRYPTO_SUFFIX = Crypto.MD5(BBAT_APP_NAME);
const HIDDEN_CONTAINER_TAG = `hidden-container-${CRYPTO_SUFFIX}`;
const loopingTaskMutex = new Mutex();

const parseUnsetBackgroundImageCSS = (selector: string) => `
${selector} {
background-image: unset !important;
-moz-background-image: unset !important;
-webkit-background-image: unset !important;
-o-background-image: unset !important;
}`;

const getPseudoElementSelectors = (): string[] => {
  const elements = document.querySelectorAll('*');
  const selectors = new Set<string>();

  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const classes = element.classList;
    const id = element.id;

    if (classes && classes.length > 0) {
      classes.forEach(className => {
        selectors.add(`.${className}::before`);
        selectors.add(`.${className}::after`);
      });
    }

    if (id) {
      selectors.add(`#${id}::before`);
      selectors.add(`#${id}::after`);
    }

    selectors.add(`${tagName}::before`);
    selectors.add(`${tagName}::after`);
  });

  return [...selectors];
};

GM_addStyle(`
${parseUnsetBackgroundImageCSS('*')}

img {
filter: opacity(0);
opacity: 0;
}

video {
filter: opacity(0);
opacity: 0;
}

.${HIDDEN_CONTAINER_TAG} {
background-color: rgba(128, 128, 128, 0.5);
border-radius: 4px;
}
`);


window.onload = () => {
  (() => {
    let css = "";
    for (const selector of getPseudoElementSelectors()) {
      css += parseUnsetBackgroundImageCSS(selector);
    }
    GM_addStyle(css);
  })(
    // Add Pseudo Element style
  );
};

const hideInNewContainer = (element: Element) => {
  const div = document.createElement('div');

  div.className = `${HIDDEN_CONTAINER_TAG}`;
  element.setAttribute(HIDDEN_CONTAINER_TAG, '');

  div.appendChild(element.cloneNode(true));

  element.parentNode?.replaceChild(div, element);
};

const loopingTask = () => {
  if (loopingTaskMutex.locked()) return;
  loopingTaskMutex.lock();

  const images = Array.from(document.getElementsByTagName('img'));
  const videos = Array.from(document.getElementsByTagName('video'));

  for (const image of images.filter(v => !v.hasAttribute(HIDDEN_CONTAINER_TAG))) {
    hideInNewContainer(image);
  }

  for (const video of videos.filter(v => !v.hasAttribute(HIDDEN_CONTAINER_TAG))) {
    hideInNewContainer(video);
  }

  loopingTaskMutex.unlock();
};

loopingTask();
setInterval(() => {
  loopingTask();
}, 1000);