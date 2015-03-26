$(window).load(function() {

var betaCodeDict = {
    "betacodeTranslit": {
        "_a": "ā",
        "b": "b",
        "t": "t",
        "_t": "ṯ",
        "^g": "ǧ",
        "j": "ǧ",
        "^c": "č",
        "*h": "ḥ",
        ".h": "ḥ",
        "_h": "ḫ",
        "d": "d",
        "_d": "ḏ",
        "r": "r",
        "z": "z",
        "s": "s",
        "^s": "š",
        "*s": "ṣ",
        ".s": "ṣ",
        "*d": "ḍ",
        ".d": "ḍ",
        "*t": "ṭ",
        ".t": "ṭ",
        "*z": "ẓ",
        ".z": "ẓ",
        "`": "ʿ",
        "*g": "ġ",
        ".g": "ġ",
        "f": "f",
        "*k": "ḳ",
        ".k": "ḳ",
        "q": "ḳ",
        "k": "k",
        "g": "g",
        "l": "l",
        "m": "m",
        "n": "n",
        "h": "h",
        "w": "w",
        "_u": "ū",
        "y": "y",
        "_i": "ī",
        "'": "ʾ",
        "/a": "á",
        ":t": "ŧ",
        "~a": "ã",
        "u": "u",
        "i": "i",
        "a": "a",
        "?u": "ủ",
        "?i": "ỉ",
        "?a": "ả",
        ".n": "ȵ",
        "^n": "ȵ",
        "_n": "ȵ",
        "*n": "ȵ",
        ".w": "ů",
        ".a": "å"
    },
    "translitArabic": {
        "ā": " ا ",
        "b": " ب ",
        "t": " ت ",
        "ṯ": " ث ",
        "ǧ": " ج ",
        "č": " چ ",
        "ḥ": " ح ",
        "ḫ": " خ ",
        "d": " د ",
        "ḏ": " ذ ",
        "r": " ر ",
        "z": " ز ",
        "s": " س ",
        "š": " ش ",
        "ṣ": " ص ",
        "ḍ": " ض ",
        "ṭ": " ط ",
        "ẓ": " ظ ",
        "ʿ": " ع ",
        "ġ": " غ ",
        "f": " ف ",
        "ḳ": " ق ",
        "k": " ك ",
        "g": " گ ",
        "l": " ل ",
        "m": " م ",
        "n": " ن ",
        "h": " ه ",
        "w": " و ",
        "ū": " و ",
        "y": " ي ",
        "ī": " ي ",
        "ʾ": " ء ",
        "á": " ٰى ",
        "ŧ": " ة ",
        "ã": " ٰ ",
        "a": " َ ",
        "u": " ُ ",
        "i": " ِ ",
        "aȵ": " ً ",
        "uȵ": " ٌ ",
        "iȵ": " ٍ ",
        "ů": " و ",
        "å": " ا ",
        "ả": " َ ",
        "ỉ": " ِ ",
        "ủ": " ُ "
    }
}

var sentences = document.getElementsByClassName("sentence");

var testBeta = document.createElement("div");

var araSentence =[]

for (s = 0; s < sentences.length; s++) {
    
    if (sentences[s].getAttribute("xml:lang") === "ara" && sentences[s].getAttribute("direction") === "ltr") {
        
        var words = sentences[s].getElementsByClassName("word");
        for (w = 0; w < words.length; w++) {
            
            var betatext = words[w].getElementsByTagName("text")[0].innerHTML;
            
            var characters = betatext.split("");
            
            var cList =[];
            
            for (c = 0; c < characters.length; c++) {
                if (/[a-z]/i.test(characters[c]) === false) {
                    
                    cList.push(characters[c] + characters[c + 1]);
                }
                
                if (/[a-z]/i.test(characters[c -1]) !== false) {
                    cList.push(characters[c]);
                }
            }
            
            var bList =[];
            
            for (i = 0; i < cList.length; i++) {
                
                bList.push(betaCodeDict[ 'betacodeTranslit'][cList[i]]);
            }
            
            var aList =[];
            
            for (e = 0; e < bList.length; e++) {
                
                aList.push(betaCodeDict[ 'translitArabic'][bList[e]]);
            }

            fixBList = [];

            for (b = 0; b< bList.length; b++) {
                if (bList[b] !== undefined) {
                    fixBList.push(bList[b]);
                }

            }

            fixAList = [];

            for (a = 0; a< aList.length; a++) {
                if (aList[a] !== undefined) {
                    fixAList.push(aList[a]);
                }

            }
            
            var araWord = fixAList.join("").replace(/ /g, '');
            var transWord = fixBList.join("");
            
            words[w].setAttribute("title", araWord);

            words[w].getElementsByTagName("text")[0].setAttribute("title", araWord);

            araSentence.push(araWord);

            var textNode = document.createTextNode(araWord);

            

        }
    }
}

var textNode = document.createTextNode(araSentence.join(" "))

testBeta.appendChild(textNode);

document.getElementsByTagName("body")[0].appendChild(testBeta);

})

