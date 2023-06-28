// ==UserScript==
// @name         FC2Hub-Finder
// @homepageURL  https://github.com/kmou424/TampermonkeyScripts
// @version      1.1.4
// @description  Give you a better experience to explore fc2.
// @author       kmou424
// @match        https://fc2hub.com/*
// @icon         https://fc2hub.com/images/ico.png
// @grant        GM_xmlhttpRequest
// @require      https://ghproxy.com/https://raw.githubusercontent.com/leancloud/javascript-sdk/dist/dist/av-min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js
// ==/UserScript==

(function() {
    'use strict';

    const { Query, User } = AV;

    const FC2 = AV.Object.extend('FC2');

    let AVInited = false;
    const appId = "";
    const appKey = "";
    const serverURL = "";

    if (!isEmpty(appId) && !isEmpty(appKey) && !isEmpty(serverURL)) {
        AV.init({
            appId: appId,
            appKey: appKey,
            serverURL: serverURL
        });
        AVInited = true;
    }

    // 日志标签
    const LOG_TAG = "FC2Hub-Finder";

    // 用户代理
    const BROWSER_USER_AGENT = navigator.userAgent;

    // 插入按钮模板
    const ADDON_BTN_TEMPLATE = [
        '<a href="#url#" class="btn" style="margin-right: 4px;margin-left: 4px;color: #fff;background-color: #FF4081;border-color: #FF4081;" target="_blank">#text#</a>',
        '<div class="col-12" style="padding-bottom: 10px;"><a href="#url#" target="_blank" class="btn btn-block" style="color: #fff;background-color: #FF4081;border-color: #FF4081;" target="_blank">#text#</a></div>'
    ];

    // 模态框模板
    const MODAL_TEMPLATE = '<div id="#modal_id#" class="modal" tabindex="-1">'+
          '<div class="modal-dialog">'+
          '<div class="modal-content">'+
          '<div class="modal-header">'+
          '<h5 class="modal-title">#modal_title#</h5>'+
          '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
          '<span aria-hidden="true">&times;</span>'+
          '</button>'+
          '</div>'+
          '<div class="modal-body">'+
          '<p>#modal_text#</p>'+
          '</div>'+
          '<div class="modal-footer">'+
          '<button type="button" class="btn btn-secondary" data-dismiss="modal">#modal_button_text#</button>'+
          '</div>'+
          '</div>'+
          '</div>'+
          '</div>\n'

    // 已访问过的卡片提示文字
    const VISITED_CARD_BADGE_TITLE = 'Visited'
    // 未找到结果的卡片提示文字
    const NOT_FOUND_CARD_BADGE_TITLE = 'Not Found'

    // 已访问过的卡片模板
    const VISITED_CARD_BADGE_TEMPLATE = `<h4><span class="badge badge-pill badge-success">${VISITED_CARD_BADGE_TITLE}</span></h4>`
    // 未找到结果的卡片模板
    const NOT_FOUND_CARD_BADGE_TEMPLATE = `<h4><span class="badge badge-pill badge-danger">${NOT_FOUND_CARD_BADGE_TITLE}</span></h4>`

    // 如果获取失败的最大重试次数
    const MAX_RETRIES = 3;
    // 超时时间(毫秒)
    const MAX_TIMEOUT = 6000;
    // 是否删除重试后找不到结果的卡片
    const DELETE_CARD_IF_NOT_FOUND = false;

    // 用来记录重试次数的哈希表
    let map = new Map();
    // 记录任务是否正在处理中(防止出现上一次任务未被处理完又开始处理下一个任务的情况)
    let processing = new Map();
    // 记录访问过的
    let visitedHashMap = new Map();

    function isNull(obj) {
        return obj == undefined || obj == null;
    }

    function isEmpty(obj) {
        return obj == "";
    }

    function htmlTextConvert(html_text) {
        return new DOMParser().parseFromString(html_text, 'text/html');
    }

    function htmlTextToNode(html_text, tagname) {
        return htmlTextConvert(html_text).getElementsByTagName(tagname)[0];
    }

    function getAllElementsInNode(node) {
        let ret = [];
        let tmpArr = [...node.childNodes];
        while (tmpArr.length > 0) {
            let front = tmpArr[0];
            tmpArr.shift();
            ret.push(front);
            if (front.childNodes.length > 0) {
                for (let i = front.childNodes.length - 1; i >= 0; i--) {
                    tmpArr.unshift(front.childNodes[i]);
                }
            }
        }
        return ret;
    }

    function getElementsByClassName(doc, classname) {
        let classElements = [], allElements = doc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; ++i) {
            if (allElements[i].className == classname) {
                classElements[classElements.length] = allElements[i];
            }
        }
        return classElements;
    }

    function getFirstElementByClassName(node, classname) {
        if (node instanceof Document) {
            let elements = getElementsByClassName(node, classname);
            if (elements.length > 0) {
                return elements[0];
            }
        } else if (node instanceof Node) {
            let elements = getAllElementsInNode(node);
            for (let i = 0; i < elements.length; ++i) {
                if (elements[i].className == classname) {
                    return elements[i];
                }
            }
        }
        return undefined;
    }

    function getElementsByIncludeInnerText(node, text) {
        let ret = [];
        let elements = [];
        if (node instanceof Document) {
            elements = node.getElementsByTagName('*');
        } else if (node instanceof Node) {
            elements = getAllElementsInNode(node);
        }
        for (let i = 0; i < elements.length; ++i) {
            if (!isNull(elements[i].innerText) && elements[i].innerText.includes(text)) {
                ret.push(elements[i]);
            }
        }
        return ret;
    }

    function getFirstElementByIncludeInnerText(node, text) {
        let elements = getElementsByIncludeInnerText(node, text);
        if (elements.length == 0) return undefined;
        return elements[0];
    }

    function getLastBackChild(node, cnt) {
        if (node.childNodes.length - cnt >= 0 && node.childNodes.length - cnt < node.childNodes.length) {
            return node.childNodes[node.childNodes.length - cnt];
        }
        return undefined;
    }

    function getFirstFrontChild(node, cnt) {
        if (cnt - 1 >= 0 && cnt - 1 < node.childNodes.length) {
            return node.childNodes[cnt - 1];
        }
        return undefined;
    }

    function getParentNode(node, level) {
        for (let i = 0; i < level; ++i) {
            node = node.parentNode;
        }
        return node;
    }

    function hasChildIncludeInnerText(node, text) {
        for (let i = 0; i < node.childNodes.length; ++i) {
            if (!isNull(node.childNodes[i].innerText) && node.childNodes[i].innerText.includes(text)) {
                return true;
            }
        }
        return false;
    }

    function formatStr(str, fmt, rep) {
        if (fmt.length != rep.length) return str;
        for (let i = 0; i < fmt.length; ++i) {
            while (str.indexOf(fmt[i]) != -1) {
                str = str.replace(fmt[i], rep[i]);
            }
        }
        return str;
    }

    function addChildBefore(addon, root) {
        root.parentNode.insertBefore(addon, root);
    }

    function addChildAfter(addon, root) {
        let rootParent = root.parentNode;
        if (rootParent.lastChild == root) {
            rootParent.appendChild(addon);
        } else {
            rootParent.insertBefore(addon, root.nextSibling);
        }
    }

    function isNotFoundOnAllSites(retries) {
        for (let i = 0; i < retries.length; ++i) {
            if (AddonBtnBuilder.sites_enabled[i] && retries[i] <= MAX_RETRIES) return false;
        }
        return true;
    }


    function checkVisited(ctitle, keyword, isBigMainCard) {
        let task = "checkVisited";
        if (processing.has(task)) return;
        if (visitedHashMap.has(keyword) && !isBigMainCard) return;
        processing.set(task, 1);
        const fc2query = new Query('FC2');
        fc2query.equalTo("videoId", keyword);
        fc2query.count().then((count) => {
            let found = count >= 1;
            visitedHashMap.set(keyword, found);
            if (found) {
                console.log(`${LOG_TAG}: checkVisited: Keyword ${keyword} has been visited`)
            }
            if (!ctitle.parentNode.innerText.includes(VISITED_CARD_BADGE_TITLE) && found) {
                addChildAfter(htmlTextToNode(VISITED_CARD_BADGE_TEMPLATE, 'h4'), ctitle)
            }
            if (isBigMainCard) {
                if (!found) {
                    const putfc2query = new FC2();
                    putfc2query.set("videoId", keyword);
                    putfc2query.save().then(res => {
                        visitedHashMap.set(keyword, true);
                        $(document.getElementById('visitSavedModal')).modal('show');
                        processing.delete(task);
                    });
                }
            } else {
                processing.delete(task);
            }
        }).catch(err => {
            processing.delete(task);
            console.log(`${LOG_TAG}: checkVisited: Query for keyword ${keyword} failed: ${err}`);
        });
    }


    function requestAddonBtn(wrapper, searchKeyword, root, before, btnTempl, ct) {
        let keyword = searchKeyword.replace("FC2-PPV-", "");
        for (let i = 0; i < AddonBtnBuilder.sites_name.length; ++i) {
            if (!AddonBtnBuilder.sites_enabled[i]) continue;
            let retries = (new Array(AddonBtnBuilder.sites_name.length)).fill(0);
            if (!isNotFoundOnAllSites(retries)) {
                if (AVInited) checkVisited(ct, keyword, btnTempl == 1)
            }
            if (hasChildIncludeInnerText(root, formatStr("#btnKey#(#siteName#)", ["#btnKey#", "#siteName#"], [AddonBtnBuilder.sites_btnKey[i], AddonBtnBuilder.sites_name[i]]))) continue;
            let site_name = AddonBtnBuilder.sites_name[i];
            let url = formatStr(AddonBtnBuilder.sites_url[i], ["#keyWord#"], [keyword]);
            if (processing.has(url)) continue;
            else processing.set(url, 1);
            if (map.has(searchKeyword)) {
                retries = map.get(searchKeyword);
            } else {
                map.set(searchKeyword, retries);
            }
            if (retries[i] > MAX_RETRIES) {
                if (isNotFoundOnAllSites(retries) && btnTempl != 1) {
                    if (DELETE_CARD_IF_NOT_FOUND) {
                        let child = getParentNode(root, 2);
                        if (!isNull(child) && !isNull(child.parentNode)) {
                            child.parentNode.removeChild(child);
                        }
                    } else {
                        if (!ct.parentNode.innerText.includes(NOT_FOUND_CARD_BADGE_TITLE)) {
                            addChildAfter(htmlTextToNode(NOT_FOUND_CARD_BADGE_TEMPLATE, 'h4'), ct);
                        }
                    }
                }
            }
            if (retries[i] == -1 || retries[i] > MAX_RETRIES) {
                continue;
            }
            if (retries[i] > 0) {
                console.log(formatStr(
                    "#LOG_TAG#: Start #retries#st retry for \"#searchKeyword#\" on \"#site_name#\"...",
                    ["#LOG_TAG#", "#retries#", "#searchKeyword#", "#site_name#"],
                    [LOG_TAG, retries[i], searchKeyword, site_name]
                ))
            }
            GM_xmlhttpRequest({
                method: "get",
                url: url,
                data: '',
                timeout: MAX_TIMEOUT,
                headers: {
                    'user-agent': BROWSER_USER_AGENT
                },
                onload: function(res) {
                    if (res.status === 200) {
                        let data = res.response;
                        let result = AddonBtnBuilder.sites_process[i](data, {keyword: keyword, index: i, url: url});
                        let addon_btn = wrapper.make(result, btnTempl);
                        if (!isNull(addon_btn)) {
                            addChildBefore(addon_btn, before);
                            retries[i] = -1;
                            map.set(searchKeyword, retries);
                            console.log(formatStr(
                                "#LOG_TAG#: \"#searchKeyword#\" has been found on \"#site_name#\".",
                                ["#LOG_TAG#", "#searchKeyword#", "#site_name#"],
                                [LOG_TAG, searchKeyword, site_name]));
                        }
                    }
                    retries[i] += 1;
                    map.set(searchKeyword, retries);
                    console.log(formatStr(
                        "#LOG_TAG#: \"#searchKeyword#\" was not found on \"#site_name#\".",
                        ["#LOG_TAG#", "#searchKeyword#", "#site_name#"],
                        [LOG_TAG, searchKeyword, site_name]));
                    if (processing.has(url)) {
                        processing.delete(url);
                    }
                },
                ontimeout: function(event) {
                    retries[i] += 1;
                    map.set(searchKeyword, retries);
                    console.log(formatStr(
                        "#LOG_TAG#: Request timeout while searching \"#searchKeyword#\" on \"#site_name#\".",
                        ["#LOG_TAG#", "#searchKeyword#", "#site_name#"],
                        [LOG_TAG, searchKeyword, site_name]));
                    if (processing.has(url)) {
                        processing.delete(url);
                    }
                }
            });
        }
    }

    class SearchResult {
        constructor(args) {
            this.url = args.url;
            this.text = formatStr("#btnKey#(#siteName#)", ["#btnKey#", "#siteName#"], [AddonBtnBuilder.sites_btnKey[args.index], AddonBtnBuilder.sites_name[args.index]]);
        }
    }

    class AddonBtnProcess {
        static supjav(data, args) {
            let result = undefined;
            if (isNull(data)) return result;
            let res_doc = htmlTextConvert(data);
            if (isNull(res_doc)) return result;
            let archive_t = getFirstElementByClassName(res_doc, "archive-title");
            if (!isNull(archive_t) && !hasChildIncludeInnerText(archive_t, args.keyword + "(0)")) {
                result = new SearchResult(args);
            }
            return result;
        }

        static bestjavporn(data, args) {
            return new SearchResult(args);
        }

        static sukebei(data, args) {
            let result = undefined;
            if (isNull(data)) return result;
            if (!data.includes("No results found")) {
                result = new SearchResult(args);
            }
            return result;
        }

        static zhongziso(data, args) {
            let result = undefined;
            if (isNull(data)) return result;
            let res_doc = htmlTextConvert(data);
            if (isNull(res_doc)) return result;
            let panel_body = getFirstElementByClassName(res_doc, "panel-body");
            if (!isNull(panel_body) && hasChildIncludeInnerText(panel_body, args.keyword)) {
                result = new SearchResult(args);
            }
            return result;
        }
    }

    class AddonBtnBuilder {
        static sites_btnKey = ["在线", "在线", "下载", "下载"];
        static sites_enabled = [true, true, false, true];
        static sites_name = ["Supjav", "BestJavPorn", "Sukebei", "种子搜"];
        static sites_process = [
            AddonBtnProcess.supjav,
            AddonBtnProcess.bestjavporn,
            AddonBtnProcess.sukebei,
            AddonBtnProcess.zhongziso
        ];
        static sites_url = [
            "https://supjav.com/?s=#keyWord#",
            "https://www4.bestjavporn.com/video/fc2-ppv-#keyWord#/",
            "https://sukebei.nyaa.si/?f=0&c=0_0&q=#keyWord#",
            "https://m.zhongzilou.com/list/#keyWord#/1"
        ];

        make(result, btnTempl) {
            if (isNull(result)) return result;
            let btnTemplate = ADDON_BTN_TEMPLATE[btnTempl];
            let fmtTemplate = formatStr(btnTemplate, ["#url#", "#text#"], [result.url, result.text]);
            let newBtn;
            switch (btnTempl) {
                case 0:
                    newBtn = htmlTextToNode(fmtTemplate, 'a');
                    break;
                case 1:
                    newBtn = htmlTextToNode(fmtTemplate, 'div');
                    break;
            }
            return newBtn;
        }
    }

    const btnClass = [AddonBtnBuilder];

    class Hacks {
        static setAllATagBlank() {
            // Hack: 使所有a标签在新窗口打开
            let a_list = document.getElementsByTagName('a');
            for (let i = 0; i < a_list.length; ++i) {
                // 如果是页面切换组件, 则跳过不设置
                if (!isNull(a_list[i].className) && a_list[i].className.includes("page-link")) {
                    continue;
                }
                if (!isNull(a_list[i]) && a_list[i].target != "_blank") {
                    a_list[i].target = "_blank";
                }
            }
        }
    }

    class Modals {
        static modals_ids = ["visitSavedModal"];
        static modals_titles = ["Information"];
        static modals_texts = ["Visit history has been stored"];
        static modals_button_texts = ["OK"];

        static addModals() {
            let container = getFirstElementByClassName(document, 'container');
            if (isNull(container)) container = getFirstElementByClassName(document, 'container-fluid');
            if (isNull(container)) return;
            let firstDiv = container.getElementsByTagName("div")[0];
            for (let i = 0; i < Modals.modals_ids.length; ++i) {
                let modal = htmlTextToNode(formatStr(MODAL_TEMPLATE,
                                                     ["#modal_id#", "#modal_title#", "#modal_text#", "#modal_button_text#"],
                                                     [Modals.modals_ids[i], Modals.modals_titles[i], Modals.modals_texts[i], Modals.modals_button_texts[i]]
                                                    ), 'div');
                addChildBefore(modal, firstDiv);
            }
        }
    }

    /* Add Default Modals begin */
    Modals.addModals();
    /* Add Default Modals end */

    let interval = setInterval(() => {
        /* Hack begin */
        Hacks.setAllATagBlank();
        /* Hack end */

        let cb_list = getElementsByClassName(document, 'card-body');
        for (let i = 0; i < cb_list.length; i++) {
            // Small card
            let ct = getFirstElementByClassName(cb_list[i], 'card-title');
            let lchild = getLastBackChild(cb_list[i], 2);
            if (isNull(ct) || isNull(lchild)) {
                // Big main card
                let cb_row = getFirstElementByClassName(cb_list[i], 'row');
                if (isNull(cb_row)) continue;
                ct = getFirstElementByClassName(cb_row, 'card-title fc2-id');
                lchild = getFirstElementByIncludeInnerText(cb_row, 'Watch This Videos on FC2 Market');
                if (isNull(lchild)) lchild = getFirstElementByIncludeInnerText(cb_row, 'Watch This Videos on LAXD Market')
                // Small card and Big main card are not found
                if (isNull(ct) || isNull(lchild)) continue;
            }
            if (!isNull(lchild.className) && lchild.className.includes("stretched-link")) {
                lchild.className = lchild.className.replace("stretched-link", "");
            }
            let searchKeyWord;
            if (!ct.innerText.includes("FC2-PPV-")) continue;
            else {
                searchKeyWord = ct.innerText;
            }

            // Get button template argument
            let btnTempl = undefined;
            if (lchild.innerText == "More...") {
                btnTempl = 0;
                lchild.addEventListener("click", function() {
                    // Dirty add visited badge manually
                    let keyword = searchKeyWord.replace("FC2-PPV-", "");
                    if (!visitedHashMap.has(keyword) || (visitedHashMap.has(keyword) && !visitedHashMap.get(keyword))) {
                        visitedHashMap.set(keyword, true);
                        addChildAfter(htmlTextToNode(VISITED_CARD_BADGE_TEMPLATE, 'h4'), ct)
                    }
                });
            } else if (lchild.innerText.includes('Watch This Videos on FC2 Market') || lchild.innerText.includes('Watch This Videos on LAXD Market')) {
                btnTempl = 1;
            }
            if (isNull(btnTempl)) continue;

            for (let j = 0; j < btnClass.length; ++j) {
                requestAddonBtn(new btnClass[j](), searchKeyWord, cb_list[i], lchild, btnTempl, ct);
            }
        }
    }, 1000);
})();
