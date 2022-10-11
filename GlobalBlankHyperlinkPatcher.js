// ==UserScript==
// @name         GlobalBlankHyperlinkPatcher
// @homepageURL  https://github.com/kmou424/TampermonkeyScripts
// @version      0.1
// @description  Globally add blank target for all <a> tags.
// @author       kmou424
// @match        *://*/*
// ==/UserScript==

(function() {
    'use strict';

    // Input domain
    const ALLOWED_DOMAINS = [
        "example.com"
    ];

    const domain = document.domain;

    if (!ALLOWED_DOMAINS.includes(domain)) return;

    setInterval(() => {
        let all_a_tags = document.getElementsByTagName('a');
        for (let i = 0; i < all_a_tags.length; ++i) {
            if (all_a_tags[i] != undefined && !all_a_tags[i].target.includes("_blank")) {
                if (all_a_tags[i].target.length != 0) {
                    all_a_tags[i].target += " _blank";
                } else {
                    all_a_tags[i].target = "_blank";
                }
                if (all_a_tags[i].innerText.length > 0
                    && all_a_tags[i].href.length > 0
                    && all_a_tags[i].href != document.URL
                    && !all_a_tags[i].href.startsWith(document.URL + "#")
                    && !all_a_tags[i].href.startsWith("javascript:void(0)")) {
                    all_a_tags[i].innerText = "[P]" + all_a_tags[i].innerText;
                }
            }
        }
    }, 1000);
})();
