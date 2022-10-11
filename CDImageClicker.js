// ==UserScript==
// @name         CDImageClicker
// @homepageURL  https://github.com/kmou424/TampermonkeyScripts
// @version      0.2
// @description  Skip annoying countdown ads for some image sites
// @author       kmou424
// @match        *://*/*
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    let clicked = false;

    function imgxkhm() {
        let btn = document.getElementById('uhaha');
        if (btn != undefined) {
            $(btn).click();
            clicked = true;
        }
    }

    function pics4you() {
        let inputs = document.getElementsByTagName('input');
        for (let i = 0; i < inputs.length; ++i) {
            if (inputs[i].value == "Continue to image..." && !clicked) {
                $(inputs[i]).click();
                clicked = true;
            }
        }
    }

    function imgsto() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function silverpic() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function fotokiz() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function imgsen() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function picbaron() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function imgbaron() {
        // This website is common with pics4you in layout
        pics4you();
    }

    function picdollar() {
        // This website is common with pics4you in layout
        pics4you();
    }

    const domains = ["imgxkhm.buzz", "pics4you.net", "imgsto.com", "silverpic.com", "fotokiz.com", "imgsen.com", "picbaron.com", "imgbaron.com", "picdollar.com"];
    const domains_func = [imgxkhm, pics4you, imgsto, silverpic, fotokiz, imgsen, picbaron, imgbaron, picdollar];
    const domain = document.domain;

    if (!domains.includes(domain)) return;

    let interval = setInterval(() => {
        domains_func[domains.indexOf(domain)]();
    }, 1000);
})();