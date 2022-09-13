// ==UserScript==
// @name         FC2Hub-Finder
// @namespace    https://kmou424.moe/
// @version      1.0.1
// @description  Give you a better experience to explore fc2.
// @author       kmou424
// @match        https://fc2hub.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fc2hub.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 日志标签
    const LOG_TAG = "FC2Hub-Finder"

    // 插入按钮模板
    const ADDON_BTN_TEMPLATE = '<a href="#url#" class="btn" style="margin-right: 4px;margin-left: 4px;color: #fff;background-color: #FF4081;border-color: #FF4081;" target="_blank">#text#</a>';
    // 如果获取失败的最大重试次数
    const MAX_RETRIES = 3;
    // 是否删除重试后找不到结果的卡片
    const DELETE_CARD_IF_NOT_FOUND = false;

    // 用来记录重试次数的哈希表
    let map = new Map();

    function isNull(obj) {
        return obj == undefined || obj == null;
    }

    function htmlTextConvert(html_text) {
        return new DOMParser().parseFromString(html_text, 'text/html');
    }

    function getElementsByClassName(doc, classname) {
        let classElements = [], allElements = doc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; ++i) {
            if (allElements[i].className == classname ) {
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
            for (let i = 0; i < node.childNodes.length; ++i) {
                if (node.childNodes[i].className == classname) {
                    return node.childNodes[i];
                }
            }
        }
        return undefined;
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
            str = str.replace(fmt[i], rep[i]);
        }
        return str;
    }

    function addChildBefore(root, addon, before) {
        root.insertBefore(addon, before);
    }

    function requestAddonBtn(wrapper, searchKeyword, root, before) {
        if (hasChildIncludeInnerText(root, wrapper.btnKey)) return;
        for (let i = 0; i < wrapper.sites_url.length; ++i) {
            let keyword = searchKeyword.replace("FC2-PPV-", "");
            let site_name = wrapper.sites_name[i];
            let url = formatStr(wrapper.sites_url[i], ["#keyWord#"], [keyword]);
            let retires = 0;
            if (map.has(url)) retires = map.get(url);
            if (retires == -1) continue;
            if (retires > MAX_RETRIES) {
                if (DELETE_CARD_IF_NOT_FOUND) {
                    let child = getParentNode(root, 2);
                    child.parentNode.removeChild(child);
                }
                continue;
            }
            if (retires > 0) {
                console.log(formatStr(
                    "#LOG_TAG#: Start #retires#st retry for \"#searchKeyword#\" on \"#site_name#\"...",
                    ["#LOG_TAG#", "#retires#", "#searchKeyword#", "#site_name#"],
                    [LOG_TAG, retires, searchKeyword, site_name]
                ))
            }
            GM_xmlhttpRequest({
                method: "get",
                url: url,
                data: '',
                headers: {
                    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
                },
                onload: function(res){
                    if (res.status === 200) {
                        let data = res.response;
                        let addon_btn = wrapper.process(data, {keyword: keyword, site_name: site_name, url: url});
                        if (!isNull(addon_btn)) {
                            addChildBefore(root, addon_btn, before);
                            map.set(url, -1);
                            console.log(formatStr(
                                "#LOG_TAG#: \"#searchKeyword#\" has been found on \"#site_name#\".",
                                ["#LOG_TAG#", "#searchKeyword#", "#site_name#"],
                                [LOG_TAG, searchKeyword, site_name]));
                        } else {
                            map.set(url, retires + 1);
                            console.log(formatStr(
                                "#LOG_TAG#: \"#searchKeyword#\" was not found on \"#site_name#\".",
                                ["#LOG_TAG#", "#searchKeyword#", "#site_name#"],
                                [LOG_TAG, searchKeyword, site_name]));
                        }
                    }
                },
            });
        }
    }

    class SearchResult {
        constructor(url, text) {
            this.url = url;
            this.text = text;
        }
    }

    class OnlineWatchWrapper {
        constructor() {
            this.btnKey = "在线";
            this.sites_name = ["supjav"];
            this.sites_url = ["https://supjav.com/?s=#keyWord#"];
            this.sites_enabled = [true];
        }
        process(data, args) {
            let result = undefined;
            if (isNull(data)) return result;
            let res_doc = htmlTextConvert(data);
            if (isNull(res_doc)) return result;
            let archive_t = getFirstElementByClassName(res_doc, "archive-title");
            if (!isNull(archive_t) && !hasChildIncludeInnerText(archive_t, args.keyword + "(0)")) {
                result = new SearchResult(args.url, formatStr("#btnKey#(#siteName#)", ["#btnKey#", "#siteName#"], [this.btnKey, args.site_name]));
            }
            if (isNull(result)) return result;
            let template1 = formatStr(ADDON_BTN_TEMPLATE, ["#url#", "#text#"], [result.url, result.text]);
            return htmlTextConvert(template1).getElementsByTagName('a')[0];
        }
    }

    const btnClass = [OnlineWatchWrapper];

    let interval = setInterval(() => {
        let cb_list = getElementsByClassName(document, 'card-body');
        for (let i = 0; i < cb_list.length; i++) {
            let ct = getFirstElementByClassName(cb_list[i], 'card-title');
            let lchild = getLastBackChild(cb_list[i], 2);
            if (isNull(ct) || isNull(lchild)) continue;
            if (!isNull(lchild.className) && lchild.className.includes("stretched-link")) {
                lchild.className = lchild.className.replace("stretched-link", "");
            }
            let searchKeyWord;
            if (!ct.innerText.includes("FC2-PPV-")) continue;
            else {
                searchKeyWord = ct.innerText;
            }
            if (lchild.innerText == "More...") {
                for (let j = 0; j < btnClass.length; ++j) {
                    requestAddonBtn(new btnClass[j](), searchKeyWord, cb_list[i], lchild);
                }
            }
        }
    }, 4000);
})();
