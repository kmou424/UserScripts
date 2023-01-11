// ==UserScript==
// @name         CDImageClicker
// @homepageURL  https://github.com/kmou424/TampermonkeyScripts
// @version      1.0
// @description  Skip annoying countdown ads for some image sites
// @author       kmou424
// @match        *://*/*
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    let clicked = false;

    const domain = document.domain;

    const IMAGE_SITES_WITH_FUNC = {
        "imgxkhm.buzz": imgxkhm,
        "imagepuitr.buzz": imagepuitr,
        "pics4you.net": pics4you,
        "imgsto.com": pics4you,
        "silverpic.com": pics4you,
        "fotokiz.com": pics4you,
        "imgsen.com": pics4you,
        "picbaron.com": pics4you,
        "imgbaron.com": pics4you,
        "picdollar.com": pics4you,
        "imgstar.eu": pics4you,
        "imgsdi.site": imagepuitr,
        "imgsdi.store": imagepuitr,
        "imgpukxxr.site": imagepuitr,
        "imgsdi.website": imagepuitr
    };

    function imgxkhm() {
        let btn = document.getElementById('uhaha');
        if (btn != undefined) {
            $(btn).click();
            clicked = true;
        }
    }

    function imagepuitr() {
        // This website is common with imgxkhm in layout
        imgxkhm();
        let adblock_layer = document.getElementsByClassName('qzxcdsfds');
        if (adblock_layer.length > 0) {
            adblock_layer[0].parentNode.removeChild(adblock_layer[0]);
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
        // auto roll image
        let roll = document.getElementsByClassName('roll');
        while (roll.length > 0) {
            $(roll[0]).click();
            roll = document.getElementsByClassName('roll');
        }
    }

    if (!Object.keys(IMAGE_SITES_WITH_FUNC).includes(domain)) return;

    let interval = setInterval(() => {
        IMAGE_SITES_WITH_FUNC[domain]();
    }, 500);
})();
