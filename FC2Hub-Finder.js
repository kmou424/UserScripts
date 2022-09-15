// ==UserScript==
// @name         FC2Hub-Finder
// @homepageURL  https://github.com/kmou424/TampermonkeyScripts
// @version      1.0.5
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
    const ADDON_BTN_TEMPLATE = [
        '<a href="#url#" class="btn" style="margin-right: 4px;margin-left: 4px;color: #fff;background-color: #FF4081;border-color: #FF4081;" target="_blank">#text#</a>',
        '<div class="col-12" style="padding-bottom: 10px;"><a href="#url#" target="_blank" class="btn btn-block" style="color: #fff;background-color: #FF4081;border-color: #FF4081;" target="_blank">#text#</a></div>'
    ];
    // 如果获取失败的最大重试次数
    const MAX_RETRIES = 3;
    // 是否删除重试后找不到结果的卡片
    const DELETE_CARD_IF_NOT_FOUND = false;

    // 用来记录重试次数的哈希表
    let map = new Map();
    // 记录任务是否正在处理中(防止出现上一次任务未被处理完又开始处理下一个任务的情况)
    let processing = new Map();

    function isNull(obj) {
        return obj == undefined || obj == null;
    }

    function htmlTextConvert(html_text) {
        return new DOMParser().parseFromString(html_text, 'text/html');
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
            str = str.replace(fmt[i], rep[i]);
        }
        return str;
    }

    function addChildBefore(addon, before) {
        before.parentNode.insertBefore(addon, before);
    }

    function isNotFoundOnAllSites(retries) {
        for (let i = 0; i < retries.length; ++i) {
            if (AddonBtnBuilder.sites_enabled[i] && retries[i] <= MAX_RETRIES) return false;
        }
        return true;
    }


    function requestAddonBtn(wrapper, searchKeyword, root, before, btnTempl) {
        let keyword = searchKeyword.replace("FC2-PPV-", "");
        for (let i = 0; i < AddonBtnBuilder.sites_name.length; ++i) {
            if (!AddonBtnBuilder.sites_enabled[i]) continue;
            if (hasChildIncludeInnerText(root, formatStr("#btnKey#(#siteName#)", ["#btnKey#", "#siteName#"], [AddonBtnBuilder.sites_btnKey[i], AddonBtnBuilder.sites_name[i]]))) continue;
            let site_name = AddonBtnBuilder.sites_name[i];
            let url = formatStr(AddonBtnBuilder.sites_url[i], ["#keyWord#"], [keyword]);
            if (processing.has(url)) continue;
            else processing.set(url, 1);
            let retries = (new Array(AddonBtnBuilder.sites_name.length)).fill(0);
            if (map.has(searchKeyword)) {
                retries = map.get(searchKeyword);
            } else {
                map.set(searchKeyword, retries);
            }
            if (retries[i] > MAX_RETRIES) {
                if (DELETE_CARD_IF_NOT_FOUND && isNotFoundOnAllSites(retries)) {
                    let child = getParentNode(root, 2);
                    if (!isNull(child) && !isNull(child.parentNode)) {
                        child.parentNode.removeChild(child);
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
                timeout: 6000,
                headers: {
                    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.33'
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
            let result = undefined;
            if (isNull(data)) return result;
            let res_doc = htmlTextConvert(data);
            if (isNull(res_doc)) return result;
            let widget_title = getFirstElementByClassName(res_doc, "widget-title");
            if (!isNull(widget_title) && !hasChildIncludeInnerText(widget_title, "Nothing found")) {
                result = new SearchResult(args);
            }
            return result;
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
            "https://www3.bestjavporn.com/search/#keyWord#",
            "https://sukebei.nyaa.si/?f=0&c=0_0&q=#keyWord#",
            "https://m.zhongzilou.com/list/#keyWord#/1"
        ];

        make(result, btnTempl) {
            if (isNull(result)) return result;
            let btnTemplate = ADDON_BTN_TEMPLATE[btnTempl];
            let fmtTemplate = formatStr(btnTemplate, ["#url#", "#text#"], [result.url, result.text]);
            let newBtn, newDom = htmlTextConvert(fmtTemplate);
            switch (btnTempl) {
                case 0:
                    newBtn = newDom.getElementsByTagName('a')[0];
                    break;
                case 1:
                    newBtn = newDom.getElementsByTagName('div')[0];
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
            if (lchild.innerText == "More...") btnTempl = 0;
            else if (lchild.innerText.includes("Watch This Videos on FC2 Market")) btnTempl = 1;
            if (isNull(btnTempl)) continue;

            for (let j = 0; j < btnClass.length; ++j) {
                requestAddonBtn(new btnClass[j](), searchKeyWord, cb_list[i], lchild, btnTempl);
            }
        }
    }, 1000);
})();
