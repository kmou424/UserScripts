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

    const domain = document.domain;

    const IMAGE_SITES_WITH_FUNC = {
        "imgxkhm.buzz": imgxkhm,
        "imagepuitr.buzz": imagepuitr,
        "pics4you.net": pics4you,
        "imgsto.com": imgsto,
        "silverpic.com": silverpic,
        "fotokiz.com": fotokiz,
        "imgsen.com": imgsen,
        "picbaron.com": picbaron,
        "imgbaron.com": imgbaron,
        "picdollar.com": picdollar
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

    if (!Object.keys(IMAGE_SITES_WITH_FUNC).includes(domain)) return;

    let interval = setInterval(() => {
        IMAGE_SITES_WITH_FUNC[domain]();
    }, 1000);
})();
