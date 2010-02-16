/**
 * @fileoverview alph-align-edit - alignment editor
 *  
 * Copyright 2009-2010 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var s_svgns = "http://www.w3.org/2000/svg";     // svg namespace
var s_xlinkns = "http://www.w3.org/1999/xlink"; // xlink namespace
var s_firefox = false;                          // in Firefox
var s_fontSize = 20;                            // regular font size
var s_interlinearFontSize = 15;                 // size of interlinear words
var s_selectedWord = null;                      // word selected for editing
var s_currentWord = null;                       // word mouse is over
var s_displayInterlinear = false;               // whether aligned words are
                                                // being displayed below heads
var s_stateL1 = Array();                        // change state for L1 words
var s_stateL2 = Array();                        // change state for L2 words
var s_summaryL1 = [0, 0, 0, 0];                 // summary stats for L1 words
var s_summaryL2 = [0, 0, 0, 0];                 // summary stats for L2 words
var s_param = [];                               // parameters and metadata

//****************************************************************************
// initialization
//****************************************************************************

function Init(a_evt)
{
    // initialize internal params
    s_param["firebug"] = "no";

    // get parameters from html metadata of form
    //  <meta name="alpheios-param-<name>" content="<value>"/>
    var prefix = "alpheios-param-";
    $("meta[name^='" + prefix + "']", document).each(
    function ()
    {
        var name = $(this).attr("name").substr(prefix.length);
        s_param[name] = $(this).attr("content");
    });

    // get parameters from call
    // Note: processed after parameters in metadata, so that
    // call parameters can override
    var callParams = location.search.substr(1).split("&");
    var numParams = callParams.length;
    for (i in callParams)
    {
        s_param[i] = callParams[i].split("=");
        s_param[s_param[i][0]] = s_param[i][1];
    }
    s_param["numParams"] = numParams;

    // set state variables
    if (navigator.userAgent.indexOf("Firefox") != -1)
        s_firefox = true;

    // clear undo/redo history
    AlphEdit.clearHistory();

    // onresize doesn't work in firefox, so register it here
    window.addEventListener("resize", Resize, false);

    // right-to-left doesn't seem to be working in firefox svg
    // reverse strings by hand
    if (s_firefox && (s_param["L1:direction"] == "rtl"))
    {
        AlphEdit.reverseText(
                    $("g.L1 text.headwd, g.L2 g.alignment text", document),
                    "form");
    }
    if (s_firefox && (s_param["L2:direction"] == "rtl"))
    {
        AlphEdit.reverseText(
                    $("g.L2 text.headwd, g.L1 g.alignment text", document),
                    "form");
    }

    // one-time positioning:
    // set position of headwords
    var svgRoot = document.documentElement;
    var headwds = $(".headwd", svgRoot);
    headwds.each(
    function()
    {
        this.setAttribute("x", s_fontSize / 2);
        this.setAttribute("y", s_fontSize);
    });

    // set size and attributes of highlighting rectangles
    var rects = $(".headwd-bg", svgRoot);
    rects.each(
    function()
    {
        var text = GetHeadWord(this.parentNode);
        var len = text.getComputedTextLength() + s_fontSize;
        this.setAttribute("width", len);
        this.setAttribute("height", 5 * s_fontSize / 4);
        if (this.parentNode.hasAttributeNS(s_xlinkns, "title"))
        {
            AlphEdit.addClass(this, "marked");
            this.setAttribute("rx", s_fontSize / 2);
            this.setAttribute("ry", s_fontSize / 2);
        }
    });

    // set position of aligned words
    var words = $(".word", svgRoot);
    words.each(
    function()
    {
        var y = s_fontSize;
        GetAlignedWords(this).each(
        function()
        {
            y += s_interlinearFontSize;
            this.setAttribute("x", s_fontSize / 2);
            this.setAttribute("y", y);

            // save length so we can get it even when word is not in tree
            var len = this.getComputedTextLength();
            this.setAttribute("len", len);
        });
    });
    $("#interlinear-checkbox", document).get(0).checked = s_displayInterlinear;

    // initialize unedited word counts in summary stats
    s_summaryL1[3] = $(".L1 .word", svgRoot).size();
    s_summaryL2[3] = $(".L2 .word", svgRoot).size();
    UpdateSummaryDisplay();

    // set/reset buttons
    $("#undo-button", document).attr("disabled", "disabled");
    $("#redo-button", document).attr("disabled", "disabled");
    $("#save-button", document).attr("disabled", "disabled");

    // now position the pieces
    DisplayInterlinear(svgRoot, s_displayInterlinear);
    Reposition(svgRoot);
};

//****************************************************************************
// event handlers
//****************************************************************************

// event handler for mouseover/out
function EnterLeave(a_evt)
{
    var focus = (a_evt.type == "mouseover");

    // if over headword
    if ($(a_evt.target).hasClass("headwd-bg") ||
        $(a_evt.target).hasClass("headwd"))
    {
        HighlightWord(a_evt.target.parentNode, focus);
        s_currentWord = (focus ? a_evt.target.parentNode : null);
    }
};

// event handler for mouse click
function Click(a_evt)
{
    // if over headword
    if ($(a_evt.target).hasClass("headwd-bg") ||
        $(a_evt.target).hasClass("headwd"))
    {
        ClickOnWord(a_evt.target.parentNode, true);
    }
};

// handler for click on word
function ClickOnWord(a_tgt, a_record)
{
    // if new selected word
    if (!s_selectedWord)
    {
        // set selection
        return SelectWord(a_tgt);
    }

    // if we clicked on selected word
    if (s_selectedWord == a_tgt)
    {
        // remove highlighting and unselect
        return SelectWord(null);
    }

    // click is on a different word from selection:
    // see if target and selected are the same language
    var selSentence = s_selectedWord.parentNode.parentNode;
    var tgtSentence = a_tgt.parentNode.parentNode;
    var sameLanguage = ($(selSentence).hasClass("L1") &&
                        $(tgtSentence).hasClass("L1")) ||
                       ($(selSentence).hasClass("L2") &&
                        $(tgtSentence).hasClass("L2"));

    // if same language, change selection
    if (sameLanguage)
    {
        // temporarily remove selection & unhighlight
        SelectWord(null);

        // set new selection
        HighlightWord(a_tgt, true);
        return SelectWord(a_tgt);
    }

    // adjust sets of aligned words
    var isAligned = IsAligned(s_selectedWord, a_tgt);
    if (isAligned)
    {
        // if aligned, we're now removing them
        RemoveAlignments(s_selectedWord, a_tgt, a_record);
    }
    else
    {
        // if not aligned, we're now adding them
        AddAlignments(s_selectedWord, a_tgt, a_record);
    }

    // if we're showing aligned words, we might need to adjust positions
    if (s_displayInterlinear)
        Reposition(document.documentElement);
};

function ClickOnUndo(a_evt)
{
    ReplayEvent(AlphEdit.popHistory(UpdateState), false);
}

function ClickOnRedo(a_evt)
{
    ReplayEvent(AlphEdit.repushHistory(UpdateState), true);
};

function ClickOnSave(a_evt)
{
    SaveContents();
};

function ToggleInterlinearDisplay(a_evt)
{
    var svgRoot = document.documentElement;
    DisplayInterlinear(svgRoot, !s_displayInterlinear);
    Reposition(svgRoot);
};

// event handler for window resize
function Resize(a_evt)
{
    // force full repositioning of elements
    Reposition(document.documentElement);
};

// handler for form submission
function FormSubmit(a_form)
{
    // if this is not return to sentence list
    if (a_form.name != "sent-navigation-list")
    {
        // if value is out of bounds
        if ((Number(a_form.s.value) <= 0) ||
            (Number(a_form.s.value) > Number(a_form.maxSentId.value)))
        {
          alert("Sentence must between 1 and " + a_form.maxSentId.value);
          return false;
        }
    }

    // if there are unsaved changes
    if (AlphEdit.unsavedChanges())
    {
        if (confirm("Save changes before going to new sentence?"))
          SaveContents();
    }

    return true;
};

// function for handling key presses
function Keypress(a_evt)
{
    // get event and keypress
    var evt = a_evt ?
                  a_evt :
                  (window.event ?
                      window.event :
                      null);
    if (!evt)
        return;
    var key = evt.charCode ?
                  evt.charCode :
                  (evt.keyCode ?
                      evt.keyCode :
                      (evt.which ?
                          evt.which :
                          0));
    var addons = (evt.shiftKey || evt.altKey || evt.ctrlKey);

    // if this is ESC
    if (s_selectedWord && (key == 27) && !addons)
    {
        // remove highlighting and unselect
        SelectWord(null);
        return;
    }

    // if this is '='
    if (s_selectedWord && (key == 61) && !addons)
    {
        var  comment = null;

        // if word not marked, query user for comment
        if (!HasMark(s_selectedWord))
          comment = prompt("Enter comment:", "");

        // add/remove mark on word
        ToggleMark(s_selectedWord, comment);
        return;
    }
};

//****************************************************************************
// highlighting
//****************************************************************************

// function to set/unset focus on word
function HighlightWord(a_word, a_on)
{
    if (!a_word)
        return;

    // if there's no selected word, we're browsing not editing
    var browsing = !s_selectedWord;

    // set/unset focus on this word
    HighlightHeadWord(a_word, a_on, (browsing? "browse-focus" : "edit-focus"));
    if (!a_on)
    {
        // if removing focus, remove both kinds since we might
        // have just switched modes
        HighlightHeadWord(a_word,
                          false,
                          (browsing? "edit-focus" : "browse-focus"));
    }

    // if browsing, set/unset focus on aligned words
    if (browsing)
        HighlightAlignedWords(a_word, a_on, true);
};

// function to set highlight on words aligned with a given word
function HighlightAlignedWords(a_word, a_on, a_recur)
{
    GetAlignedWords(a_word).each(
    function()
    {
        var id = this.getAttribute("idref");
        var wd = a_word.ownerDocument.getElementById(id);
        HighlightHeadWord(wd, a_on, "aligned-focus");

        // if this is first call, set highlight on words
        // that share this aligned word with original word
        if (a_recur)
            HighlightAlignedWords(wd, a_on, false);
    });
};

// function to set/unset selected word
function SelectWord(a_word)
{
    // if something is already selected, unselect it
    if (s_selectedWord)
    {
        var  temp = s_selectedWord;
        HighlightHeadWord(s_selectedWord, false, "selected");
        s_selectedWord = null;
        HighlightWord(temp, false);
    }

    // install new selection
    s_selectedWord = a_word;

    // if it exists, select it
    if (s_selectedWord)
    {
        HighlightHeadWord(s_selectedWord, true, "selected");
        HighlightWord(s_selectedWord, false);
    }
    // if no selected word, make sure current word gets browse focus
    else
    {
        HighlightWord(s_currentWord, true);
    }
};

// function to set attribute on word
function HighlightHeadWord(a_word, a_on, a_value)
{
    if (!a_word)
        return;

    if (a_on)
    {
        AlphEdit.addClass(GetHeadRect(a_word), a_value);
        AlphEdit.addClass(GetHeadWord(a_word), a_value);
    }
    else
    {
        AlphEdit.removeClass(GetHeadRect(a_word), a_value);
        AlphEdit.removeClass(GetHeadWord(a_word), a_value);
    }
};

//****************************************************************************
// aligned text
//****************************************************************************

// function to find out if two words are aligned
function IsAligned(a_src, a_tgt)
{
    var id = a_src.getAttribute("id");
    var aligned = false;
    GetAlignedWords(a_tgt).each(
    function()
    {
        // if target has aligned word pointing at src, they're aligned
        if (this.getAttribute("idref") == id)
        {
            aligned = true;
            return false;
        }
    });

    // we assume words are always reciprocally aligned
    // so there's no need to check the other direction

    return aligned;
}

// add all alignment between two words
function AddAlignments(a_src, a_tgt, a_record)
{
    // record event for history
    var  event = Array();

    // get word sets containing source and target
    // set[0][0] = a_src and its siblings
    // set[0][1] = words aligned with a_tgt
    // set[1][0] = a_tgt and its siblings
    // set[1][1] = words aligned with a_src
    var set = Array(GetWordSets(a_src, a_tgt), GetWordSets(a_tgt, a_src));

    // cross-connect between the two sets
    // set[0][0] and set[1][1] are already connected
    // as are set[0][1] and set[1][0]
    for (var i = 0; i < 2; ++i)
        for (var j = 0; j < set[0][i].length; ++j)
            for (var k = 0; k < set[1][i].length; ++k)
                if (AddAlignment(set[0][i][j], set[1][i][k], true) && a_record)
                    event.push(Array(set[0][i][j], set[1][i][k]));

    // if set[1][1] is empty, we need to highlight set[0][1]
    if (set[1][1].length == 0)
        for (var i = 0; i < set[0][1].length; ++i)
            HighlightHeadWord(set[0][1][i], true, "aligned-focus");

    // add to history
    if (a_record)
        AlphEdit.pushHistory(Array(event, true), UpdateState);
}

// remove all alignment between two words
function RemoveAlignments(a_src, a_tgt, a_record)
{
    // record event for history
    var  event = Array();

    // get word set containing source
    var srcWordSet = GetWordSets(a_src, null)[0];

    // remove target connections to source set
    for (var i = 0; i < srcWordSet.length; ++i)
        if (RemoveAlignment(srcWordSet[i], a_tgt, true) && a_record)
            event.push(Array(srcWordSet[i], a_tgt));

    // add to history
    if (a_record)
        AlphEdit.pushHistory(Array(event, false), UpdateState);
}

// function to get sets of related words
function GetWordSets(a_src, a_tgt)
{
    // start with the word itself
    var srcSet = Array();
    srcSet.push(a_src);

    // for first aligned word of source
    var wd = GetAlignedWords(a_src)[0];
    if (wd)
    {
        // get aligned words of that word
        var id = wd.getAttribute("idref");
        var tgt = document.getElementById(id);

        // add each word to set
        GetAlignedWords(tgt).each(
        function()
        {
            // if this isn't original word
            var id = this.getAttribute("idref");
            var sibling = document.getElementById(id);
            if (sibling != a_src)
              srcSet.push(sibling);
        });
    }

    // if target specified, get set of its aligned words
    // we'll only get here if a_src and a_tgt are not already aligned
    // so we know anything aligned with a_tgt is not already in the srcSet
    var tgtSet = Array();
    if (a_tgt)
    {
        GetAlignedWords(a_tgt).each(
        function()
        {
            var id = this.getAttribute("idref");
            var sibling = document.getElementById(id);
            tgtSet.push(sibling);
        });
    }

    return Array(srcSet, tgtSet);
}

// add connection between two words
function AddAlignment(a_src, a_tgt, a_highlight)
{
    // for each direction
    var  wd = Array(a_src, a_tgt)
    for (var i = 0; i < 2; ++i)
    {
        var j = 1 - i;

        // create new word to be added
        var id = wd[j].getAttribute("id");
        var word = GetHeadWord(wd[j]);
        var newWord = GetHeadWord(wd[j]).cloneNode(true);
        AlphEdit.removeClass(newWord, null);
        newWord.setAttribute("idref", id);
        var wordNum = Number(id.substr(id.search('-') + 1));

        // find index of word to insert before
        var insertWord = null;
        var foundWord = false;
        var lastY = s_fontSize;
        var aligned = GetAlignedWords(wd[i]);
        aligned.each(
        function()
        {
            lastY = Number(this.getAttribute("y"));

            // if already found insert point
            if (insertWord)
            {
                this.setAttribute("y", lastY + s_interlinearFontSize);
                return true;
            }

            // get number of this word
            var thisId = this.getAttribute("idref");
            var thisNum = Number(thisId.substr(thisId.search('-') + 1));

            // if this is same as new word number, nothing to add
            if (thisNum == wordNum)
            {
                foundWord = true;
                return false;
            }

            // if past new number, this is insert point
            if (thisNum > wordNum)
            {
                insertWord = this;
                newWord.setAttribute("y", lastY);
                this.setAttribute("y", lastY + s_interlinearFontSize);
            }
        });
        // if word already there, we're done without doing anything
        if (foundWord)
            return false;
        // if inserting at end
        if (!insertWord)
            newWord.setAttribute("y", lastY + s_interlinearFontSize);

        // insert new word
        if (aligned.size() == 0)
            AlphEdit.removeClass(GetHeadWord(wd[i]), "free");
        if (a_highlight)
            HighlightHeadWord(wd[i], true, "aligned-focus");
        GetAlignment(wd[i]).insertBefore(newWord, insertWord);

        // save length so we can get it even when word is not in tree
        var len = newWord.getComputedTextLength();
        newWord.setAttribute("len", len);
    }
    
    // success
    return true;
};

// remove connection between two words
function RemoveAlignment(a_src, a_tgt, a_highlight)
{
    // for each direction
    var  wd = Array(a_src, a_tgt)
    for (var i = 0; i < 2; ++i)
    {
        var j = 1 - i;

        // find index of word to remove
        var id = wd[j].getAttribute("id");
        var aligned = GetAlignedWords(wd[i]).get();
        var toRemove = -1;
        for (var k = 0; k < aligned.length; ++k)
        {
            // if this is the one to remove, remember it
            if (aligned[k].getAttribute("idref") == id)
            {
                toRemove = k;
                break;
            }
        }

        // if word found
        if (toRemove != -1)
        {
            // if this is last aligned word, change status
            if (aligned.length == 1)
            {
                AlphEdit.addClass(GetHeadWord(wd[i]), "free");
                if (a_highlight)
                    HighlightHeadWord(wd[i], false, "aligned-focus");
            }

            // adjust position of words after removal
            for (var k = aligned.length - 1; k > toRemove; --k)
            {
                aligned[k].setAttribute("y", aligned[k - 1].getAttribute("y"));
            }

            // discard child
            GetAlignment(wd[i]).removeChild(aligned[toRemove]);
        }
        else
        {
            // alignment not found
            return false;
        }
    }
    
    // success
    return true;
};

// replay event from history
function ReplayEvent(a_event, a_forward)
{
    // if no event, do nothing
    if (!a_event)
        return;

    // get rid of any existing selection and highlighting
    SelectWord(null);
    ClickOnWord(s_currentWord, true);

    // we're adding if the original event was an addition and we're replaying
    // forward, or original event was a removal and we're replaying backwards
    var  adding = (a_event[1] == a_forward);
    var  words = a_event[0];
    for (var i in words)
    {
        if (adding)
            AddAlignment(words[i][0], words[i][1], false);
        else
            RemoveAlignment(words[i][0], words[i][1], false);
    }

    // if we're showing aligned words, we might need to adjust positions
    if (s_displayInterlinear)
        Reposition(document.documentElement);
};

// change display of interlinear text
function DisplayInterlinear(a_root, a_on)
{
    $(".alignment", a_root).each(
    function()
    {
        this.setAttribute("visibility", (a_on ? "visible" : "hidden"));
    });
    s_displayInterlinear = a_on;
};

//****************************************************************************
// repositioning
//****************************************************************************

// reposition elements on screen
function Reposition(a_root)
{
    var maxWidth = Reflow(a_root);

    // adjust word spacing
    var sentX = 2;
    var sentY = 2;
    var maxX = 0;
    var maxY = 0;
    var divX = 0;
    var divY = 0;

    // for each sentence
    $(".sentence", a_root).each(
    function(i)
    {
        var width = maxWidth[i];
        var dir = s_param[$(this).attr("lnum") + ":direction"];

        var lineX = 0;
        var lineY = 0;

        // for each line
        $(".line", this).each(
        function()
        {
            var wordX = 0;
            var wordY = 0;
            var maxWordY = 0;

            // for each word
            $(".word", this).each(
            function()
            {
                var xx = (dir == "rtl") ?
                            (width - 
                             wordX - 
                             $(".headwd", this)[0].getComputedTextLength()) :
                            wordX;

                // set position of word
                this.setAttribute("transform",
                                  "translate(" + xx + ", " + wordY + ")");

                // adjust for next word
                var size = GetWordSize(this);
                wordX += size[0];
                maxWordY = Math.max(maxWordY, size[1]);
            });

            // set position of line
            this.setAttribute("transform",
                              "translate(" + lineX + ", " + lineY + ")");

            // adjust for next line
            lineY += maxWordY + (s_displayInterlinear ? s_fontSize : 0);
            maxX = Math.max(maxX, wordX);
        });
        if (s_displayInterlinear)
            maxY += lineY;
        else
            maxY = Math.max(maxY, lineY);

        // set position of sentence
        this.setAttribute("transform",
                          "translate(" + sentX + ", " + sentY + ")");

        // adjust for next sentence
        // if displaying alignment, place sentences vertically
        // if not displaying alignment, place sentences horizontally
        if (s_displayInterlinear)
            sentY += lineY;
        else
            sentX += maxX;

        // position divider
        if (i == 0)
        {
            if (!s_displayInterlinear)
                sentX += s_fontSize;
            divX = sentX;
            divY = sentY;
            if (s_displayInterlinear)
                sentY += s_fontSize;
            else
                sentX += s_fontSize;
        }
    });

    // position divider
    var divider = $(".divider", a_root).get(0);
    if (!divider)
    {
        // if divider doesn't exist, create it
        var doc = a_root.ownerDocument;
        divider = doc.createElementNS(s_svgns, "line");
        AlphEdit.addClass(divider, "divider");
        var svg = a_root.getElementsByTagNameNS(s_svgns, "svg")[0];
        svg.appendChild(divider);
    }
    divider.setAttribute("x1", divX);
    divider.setAttribute("y1", divY);
    if (s_displayInterlinear)
        divX += maxX;
    else
        divY += maxY;
    divider.setAttribute("x2", divX);
    divider.setAttribute("y2", divY);
    maxY += s_fontSize;

    // reset svg size
    var svg = a_root.getElementsByTagNameNS(s_svgns, "svg")[0];
    svg.setAttribute("width", window.innerWidth);
    svg.setAttribute("height", window.innerHeight);
};

// function to reassign words to lines
function Reflow(a_root)
{
    var doc = a_root.ownerDocument;

    // calculate max width for text
    var maxWidth = window.innerWidth;
    if (!s_displayInterlinear)
        maxWidth = maxWidth / 2;
    maxWidth -= 2 * s_fontSize;
    var width = [];

    // for each sentence
    $(".sentence", a_root).each(
    function(i)
    {
        width[i] = 0;

        // remove all words and lines in sentence
        var words = Array();
        $(".word", this).each(function() { words.push(this); });
        for (var j in words)
            words[j].parentNode.removeChild(words[j]);
        var lines = Array();
        $(".line", this).each(function() { lines.push(this); });
        for (var j in lines)
            lines[j].parentNode.removeChild(lines[j]);

        // assign words to lines
        var curLine = null;
        var x = 0;
        for (var j = 0; j < words.length;)
        {
            // if we don't have a line, create one
            if (!curLine)
            {
                curLine = doc.createElementNS(s_svgns, "g");
                AlphEdit.addClass(curLine, "line");
                this.appendChild(curLine);
                x = 0;
            }

            // try to add this word to line
            x += GetWordSize(words[j])[0];
            if ((x < maxWidth) || !curLine.firstChild)
            {
                // if it fits or it's first word on line
                curLine.appendChild(words[j]);
                ++j;
            }

            // if past line width, we're done with line
            if (x >= maxWidth)
            {
                curLine = null;
            }
        }
        width[i] = Math.max(width[i], x);
    });
    
    return width;
};

//****************************************************************************
// state
//****************************************************************************

// update state
function UpdateState(a_event, a_inc)
{
    var  words = a_event[0];
    var  added = a_event[1];

    // for each pair of words
    for (var i in words)
    {
        // get L1 and L2 ids
        var idL1 = words[i][0].getAttribute("id");
        var idL2 = words[i][1].getAttribute("id");
        if (idL1.substr(0, idL1.search(':')) == "L1")
        {
            idL1 = idL1.substr(idL1.search(':') + 1);
            idL2 = idL2.substr(idL2.search(':') + 1);
        }
        else
        {
            idL1 = idL2.substr(idL2.search(':') + 1);
            idL2 = idL1.substr(idL1.search(':') + 1);
        }

        // data for each word is:
        //  [0] - number of words added during editing
        //  [1] - number of words removed during editing
        // summary date for each language is:
        //  [0] - number of words with net aligned words decreased
        //  [1] - number of words with net aligned words unchanged
        //  [2] - number of words with net aligned words increased
        //  [3] - number of unedited words

        // make sure state for words exists
        if (!s_stateL1[idL1])
            s_stateL1[idL1] = [0, 0];
        if (!s_stateL2[idL2])
            s_stateL2[idL2] = [0, 0];

        // remove from summary stats
        s_summaryL1[SummaryIndex(s_stateL1[idL1])]--;
        s_summaryL2[SummaryIndex(s_stateL2[idL2])]--;

        // update state
        s_stateL1[idL1][added ? 0 : 1] += a_inc;
        s_stateL2[idL2][added ? 0 : 1] += a_inc;

        // add to summary stats
        s_summaryL1[SummaryIndex(s_stateL1[idL1])]++;
        s_summaryL2[SummaryIndex(s_stateL2[idL2])]++;
    }

    // update display
    UpdateSummaryDisplay();
};

// update summary display
function UpdateSummaryDisplay()
{
    // update summary values
    for (var i = 0; i < 4; ++i)
        $(document.getElementById("L1:S" + i)).text(s_summaryL1[i]);
    for (var i = 0; i < 4; ++i)
        $(document.getElementById("L2:S" + i)).text(s_summaryL2[i]);
};

// get index in summary data for state
function SummaryIndex(a_state)
{
    // unedited
    if ((a_state[0] == 0) && (a_state[1] == 0))
        return 3;

    // net decreased
    if (a_state[0] < a_state[1])
        return 0;
    // net unchanged
    else if (a_state[0] == a_state[1])
        return 1;
    // net increased
    return 2;
};

// save contents to database
function SaveContents()
{
  // if nothing has changed, do nothing
  // (shouldn't ever happen because save buttons should be disabled)
  if (!AlphEdit.unsavedChanges())
    return;

  // send synchronous request to save
  var req = new XMLHttpRequest();
  var svg = document.getElementsByTagNameNS(s_svgns, "svg")[0];
  req.open("POST", svg.getAttribute("alph-saveurl"), false);
  req.setRequestHeader("Content-Type", "application/xml");
  req.send(XMLSerializer().serializeToString(svg));
  if (req.status != 200)
    alert(req.responseText ? req.responseText : req.statusText);

  // remember where we last saved and reset button
  AlphEdit.saved();
};

//****************************************************************************
// Marked words
//****************************************************************************

// is word marked?
function HasMark(a_word)
{
  return a_word.hasAttributeNS(s_xlinkns, "title");
};

// mark/unmark a word
function ToggleMark(a_word, a_comment)
{
    // turn corners on/off on rectangle
    var rect = GetHeadRect(a_word);
    if (!HasMark(a_word))
    {
        // save comment
        a_word.setAttributeNS(s_xlinkns,
                              "title",
                              (a_comment ? a_comment : ""));

        AlphEdit.addClass(rect, "marked");
        rect.setAttribute("rx", s_fontSize / 2);
        rect.setAttribute("ry", s_fontSize / 2);
    }
    else
    {
        // remove mark
        a_word.removeAttributeNS(s_xlinkns, "title");

        AlphEdit.removeClass(rect, "marked");
        rect.removeAttributeNS(null, "rx");
        rect.removeAttributeNS(null, "ry");
    }
    
    // make sure we save results
    AlphEdit.unsaved();
};

//****************************************************************************
// utility routines
//****************************************************************************

// get size of word
function GetWordSize(a_word)
{
    var w = 0;
    var h = 0;
    // get size of headword
    var rect = GetHeadRect(a_word);
    var w = Math.max(Number(rect.getAttribute("x")) +
                     Number(rect.getAttribute("width")));
    var h = Math.max(Number(rect.getAttribute("y")) +
                     Number(rect.getAttribute("height")));

    // if aligned words are visible
    if (GetAlignment(a_word).getAttribute("visibility") == "visible")
    {
        GetAlignedWords(a_word).each(
        function()
        {
            // get right and bottom of this word
            // we should be able to just use last word's bottom,
            // but to be safe we take max of all words
            var x = Number(this.getAttribute("x")) +
                    Number(this.getAttribute("len"));
            var y = Number(this.getAttribute("y"));
            w = Math.max(w, x);
            h = Math.max(h, y);
        });
    }

    return Array(w, h);
};

// get headword of word
function GetHeadWord(a_word)
{
    return a_word.getElementsByClassName("headwd")[0];
};

// get rectangle for highlighting headword of word
function GetHeadRect(a_word)
{
    return a_word.getElementsByClassName("headwd-bg")[0];
};

// get alignment group associated with word
function GetAlignment(a_word)
{
    return a_word.getElementsByClassName("alignment")[0];
};

// get aligned words associated with word
function GetAlignedWords(a_word)
{
    return $(GetAlignment(a_word).getElementsByTagNameNS(s_svgns, "text"));
};