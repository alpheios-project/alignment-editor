var s_ns = "http://www.w3.org/2000/svg";        // svg namespace
var s_xlinkns = "http://www.w3.org/1999/xlink"; // xlink namespace
var s_fontSize = 20;                            // regular font size
var s_alignedFontSize = 15;                     // size of aligned words
var s_selectedWord = null;                      // word selected for editing
var s_displayAligned = false;                   // whether aligned words are
                                                // being displayed
var s_history = Array();                        // editing history
var s_historyCursor = 0;                        // position in history
var s_saveCursor = 0;                           // position of last save
var s_stateL1 = Array();                        // change state for L1 words
var s_stateL2 = Array();                        // change state for L2 words
var s_summaryL1 = [0, 0, 0, 0];                 // summary stats for L1 words
var s_summaryL2 = [0, 0, 0, 0];                 // summary stats for L2 words

//****************************************************************************
// initialization
//****************************************************************************

function Init(a_evt)
{
    // onresize doesn't work in firefox, so register it here
    window.addEventListener("resize", Resize, false);

    // one-time positioning:
    // set position of headwords
    var svgRoot = document.documentElement;
    var headwds = svgRoot.getElementsByClassName("headwd");
    for (var i = 0; i < headwds.length; ++i)
    {
        headwds[i].setAttributeNS(null, "x", s_fontSize / 2);
        headwds[i].setAttributeNS(null, "y", s_fontSize);
    }

    // set size and attributes of highlighting rectangles
    var rects = svgRoot.getElementsByClassName("headwd-bg");
    for (var i = 0; i < rects.length; ++i)
    {
        var rect = rects[i];
        var text = GetHeadWord(rect.parentNode);
        var len = text.getComputedTextLength() + s_fontSize;
        rect.setAttributeNS(null, "width", len);
        rect.setAttributeNS(null, "height", 5 * s_fontSize / 4);
        if (rect.parentNode.hasAttributeNS(s_xlinkns, "title"))
        {
            AddClass(rect, "marked");
            rect.setAttributeNS(null, "rx", s_fontSize / 2);
            rect.setAttributeNS(null, "ry", s_fontSize / 2);
        }
    }

    // set position of aligned words
    var words = svgRoot.getElementsByClassName("word");
    for (var i = 0; i < words.length; ++i)
    {
        var aligned = GetAlignedWords(words[i]);
        var y = s_fontSize;
        for (var j = 0; j < aligned.length; ++j)
        {
            y += s_alignedFontSize;
            aligned[j].setAttributeNS(null, "x", s_fontSize / 2);
            aligned[j].setAttributeNS(null, "y", y);

            // save length so we can get it even when word is not in tree
            var len = aligned[j].getComputedTextLength();
            aligned[j].setAttributeNS(null, "len", len);
        }
    }
    document.getElementById("align-checkbox").checked = s_displayAligned;

    // initialize unedited word counts in summary stats
    var sentL1 = svgRoot.getElementsByClassName("L1")[0];
    var wordsL1 = sentL1.getElementsByClassName("word");
    s_summaryL1[3] = wordsL1.length;
    var sentL2 = svgRoot.getElementsByClassName("L2")[0];
    var wordsL2 = sentL2.getElementsByClassName("word");
    s_summaryL2[3] = wordsL2.length;
    UpdateSummaryDisplay();

    // set/reset buttons
    document.getElementById("undo-button").setAttribute("disabled", "yes");
    document.getElementById("redo-button").setAttribute("disabled", "yes");
    document.getElementById("save-button").setAttribute("disabled", "yes");

    // now position the pieces
    DisplayAlignment(svgRoot, s_displayAligned);
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
    if (HasClass(a_evt.target, "headwd-bg") ||
        HasClass(a_evt.target, "headwd"))
    {
        HighlightWord(a_evt.target.parentNode, focus);
    }
};

// event handler for mouse click
function Click(a_evt)
{
    // if over headword
    if (HasClass(a_evt.target, "headwd-bg") ||
        HasClass(a_evt.target, "headwd"))
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
    var sameLanguage = (HasClass(selSentence, "L1") &&
                        HasClass(tgtSentence, "L1")) ||
                       (HasClass(selSentence, "L2") &&
                        HasClass(tgtSentence, "L2"));

    // if same language, change selection
    if (sameLanguage)
    {
        // temporarily remove selection & unhighlight
        SelectWord(null);

        // set new selection
        HighlightWord(a_tgt, true);
        return SelectWord(a_tgt);
    }

    // clicked on word from different language:
    // remove highlighting
    HighlightWord(a_tgt, false);

    // toggle alignment status of target word
    var isAligned = HasClass(GetHeadWord(a_tgt), "aligned-focus");
    HighlightHeadWord(a_tgt, !isAligned, "aligned-focus");

    // adjust sets of aligned words
    if (isAligned)
    {
        // if aligned, we're now removing them
        RemoveAlignedWord(s_selectedWord, a_tgt.getAttributeNS(null, "id"));
        RemoveAlignedWord(a_tgt, s_selectedWord.getAttributeNS(null, "id"));
    }
    else
    {
        // if not aligned, we're now adding them
        AddAlignedWord(s_selectedWord, a_tgt.getAttributeNS(null, "id"));
        AddAlignedWord(a_tgt, s_selectedWord.getAttributeNS(null, "id"));
    }

    // if we're showing aligned words, we might need to adjust positions
    if (s_displayAligned)
        Reposition(document.documentElement);

    // if we're recording history, remember what we've done
    if (a_record)
        PushHistory(s_selectedWord, a_tgt, !isAligned);
};

function ClickOnUndo(a_evt)
{
    // if history is empty, ignore the click
    var event = PopHistory();
    if (!event)
        return;

    SimulateAction(event[0], event[1]);
}

function ClickOnRedo(a_evt)
{
    // if redo history is empty, ignore the click
    var event = RepushHistory();
    if (!event)
        return;

    // simulate action
    SimulateAction(event[0], event[1]);
};

function ClickOnSave(a_evt)
{
  SaveContents();
};

function SimulateAction(a_head, a_tgt)
{
    // get rid of any existing selection
    SelectWord(null);

    // simulate mouse-over, click, mouse-out on headword
    HighlightWord(a_head, true);
    ClickOnWord(a_head, false);
    HighlightWord(a_head, false);

    // simulate mouse-over, click on target, mouse-out
    // since multiple clicks toggle alignment, this will redo the click
    // and don't put it back in the history
    HighlightWord(a_tgt, true);
    ClickOnWord(a_tgt, false);
    HighlightWord(a_tgt, false);
};

function ToggleAlignmentDisplay(a_evt)
{
    var svgRoot = document.documentElement;
    DisplayAlignment(svgRoot, !s_displayAligned);
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
    if (s_saveCursor != s_historyCursor)
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

    // if this is ESC
    if (s_selectedWord && (key == 27))
    {
        // remove highlighting and unselect
        SelectWord(null);
        return;
    }

    // if this is '='
    if (s_selectedWord && (key == 61))
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
    {
        var aligned = GetAlignedWords(a_word);
        for (var i = 0; i < aligned.length; ++i)
        {
            var id = aligned[i].getAttributeNS(null, "idref");
            HighlightHeadWord(
                a_word.ownerDocument.getElementById(id),
                a_on,
                "aligned-focus");
        }
    }
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
};

// function to set attribute on word
function HighlightHeadWord(a_word, a_on, a_value)
{
    if (!a_word)
        return;

    if (a_on)
    {
        AddClass(GetHeadRect(a_word), a_value);
        AddClass(GetHeadWord(a_word), a_value);
    }
    else
    {
        RemoveClass(GetHeadRect(a_word), a_value);
        RemoveClass(GetHeadWord(a_word), a_value);
    }
};

//****************************************************************************
// aligned text
//****************************************************************************

// add aligned word to set
function AddAlignedWord(a_word, a_id)
{
    // create new word to be added
    var word = GetHeadWord(a_word.ownerDocument.getElementById(a_id));
    var newWord = word.cloneNode(true);
    RemoveClass(newWord, null);
    newWord.setAttributeNS(null, "idref", a_id);
    var wordNum = Number(a_id.substr(a_id.search('-') + 1));

    // find index of word to insert before
    var insertWord = null;
    var lastY = s_fontSize;
    var aligned = GetAlignedWords(a_word);
    for (var i = 0; i < aligned.length; ++i)
    {
        lastY = Number(aligned[i].getAttributeNS(null, "y"));

        // if already found word
        if (insertWord)
        {
            aligned[i].setAttributeNS(null, "y", lastY + s_alignedFontSize);
            continue;
        }

        // get number of this word
        var thisId = aligned[i].getAttributeNS(null, "idref");
        var thisNum = Number(thisId.substr(thisId.search('-') + 1));

        // if this is same as new word number, nothing to add
        if (thisNum == wordNum)
            return;

        // if past new number, this is insert point
        if (thisNum > wordNum)
        {
            insertWord = aligned[i];
            newWord.setAttributeNS(null, "y", lastY);
            aligned[i].setAttributeNS(null, "y", lastY + s_alignedFontSize);
        }
    }
    if (!insertWord)
        newWord.setAttributeNS(null, "y", lastY + s_alignedFontSize);

    // insert new word
    GetAlignment(a_word).insertBefore(newWord, insertWord);
    RemoveClass(GetHeadWord(a_word), "free");

    // save length so we can get it even when word is not in tree
    var len = newWord.getComputedTextLength();
    newWord.setAttributeNS(null, "len", len);
};

// remove aligned word from set
function RemoveAlignedWord(a_word, a_id)
{
    // find index of word to remove
    var aligned = GetAlignedWords(a_word);
    var toRemove = -1;
    for (var i = 0; i < aligned.length; ++i)
    {
        // if this is the one to remove, remember it
        if (aligned[i].getAttributeNS(null, "idref") == a_id)
        {
            toRemove = i;
            break;
        }
    }

    if (toRemove >= 0)
    {
        // if this is last aligned word, change status
        if (aligned.length == 1)
            AddClass(GetHeadWord(a_word), "free");

        // adjust position of words after removal
        for (var i = aligned.length - 1; i > toRemove; --i)
        {
            aligned[i].
                setAttributeNS(null,
                               "y",
                               aligned[i-1].getAttributeNS(null, "y"));
        }

        // discard child
        GetAlignment(a_word).removeChild(aligned[toRemove]);
    }
};

// change display of aligned text
function DisplayAlignment(a_root, a_on)
{
    var alignment = a_root.getElementsByClassName("alignment");
    for (var i = 0; i < alignment.length; ++i)
    {
        alignment[i].
            setAttributeNS(null, "visibility", (a_on ? "visible" : "hidden"));
    }
    s_displayAligned = a_on;
};

//****************************************************************************
// repositioning
//****************************************************************************

// reposition elements on screen
function Reposition(a_root)
{
    Reflow(a_root);

    // adjust word spacing
    var sentences = a_root.getElementsByClassName("sentence");
    var sentX = 2;
    var sentY = 2;
    var maxX = 0;
    var maxY = 0;
    var divX = 0;
    var divY = 0;

    // for each sentence
    for (var i = 0; i < sentences.length; ++i)
    {
        // get lines in sentence
        var lines = sentences[i].getElementsByClassName("line");
        var lineX = 0;
        var lineY = 0;

        // for each line
        for (var j = 0; j < lines.length; ++j)
        {
            // get words in lines
            var words = lines[j].getElementsByClassName("word");
            var wordX = 0;
            var wordY = 0;
            var maxWordY = 0;

            // for each word
            for (var k = 0; k < words.length; ++k)
            {
                // set position of word
                words[k].setAttributeNS(
                            null,
                            "transform",
                            "translate(" + wordX + ", " + wordY + ")");

                // adjust for next word
                var size = GetWordSize(words[k]);
                wordX += size[0];
                maxWordY = Math.max(maxWordY, size[1]);
            }

            // set position of line
            lines[j].setAttributeNS(
                        null,
                        "transform",
                        "translate(" + lineX + ", " + lineY + ")");

            // adjust for next line
            lineY += maxWordY + (s_displayAligned ? s_fontSize : 0);
            maxX = Math.max(maxX, wordX);
        }
        if (s_displayAligned)
            maxY += lineY;
        else
            maxY = Math.max(maxY, lineY);

        // set position of sentence
        sentences[i].setAttributeNS(
                        null,
                        "transform",
                        "translate(" + sentX + ", " + sentY + ")");

        // adjust for next sentence
        // if displaying alignment, place sentences vertically
        // if not displaying alignment, place sentences horizontally
        if (s_displayAligned)
            sentY += lineY;
        else
            sentX += maxX;

        // position divider
        if (i == 0)
        {
            if (!s_displayAligned)
                sentX += s_fontSize;
            divX = sentX;
            divY = sentY;
            if (s_displayAligned)
                sentY += s_fontSize;
            else
                sentX += s_fontSize;
        }
    }

    // position divider
    var divider = a_root.getElementsByClassName("divider")[0];
    if (!divider)
    {
        // if divider doesn't exist, create it
        var doc = a_root.ownerDocument;
        divider = doc.createElementNS(s_ns, "line");
        AddClass(divider, "divider");
        var svg = a_root.getElementsByTagNameNS(s_ns, "svg")[0];
        svg.appendChild(divider);
    }
    divider.setAttributeNS(null, "x1", divX);
    divider.setAttributeNS(null, "y1", divY);
    if (s_displayAligned)
        divX += maxX;
    else
        divY += maxY;
    divider.setAttributeNS(null, "x2", divX);
    divider.setAttributeNS(null, "y2", divY);
    maxY += s_fontSize;

    // reset svg size
    var svg = a_root.getElementsByTagNameNS(s_ns, "svg")[0];
    svg.setAttributeNS(null, "width", window.innerWidth);
    svg.setAttributeNS(null, "height", window.innerHeight);
};

// function to reassign words to lines
function Reflow(a_root)
{
    var doc = a_root.ownerDocument;

    // calculate max width for text
    var maxWidth = window.innerWidth;
    if (!s_displayAligned)
        maxWidth = maxWidth / 2;
    maxWidth -= 2 * s_fontSize;

    // for each sentence
    var sentences = a_root.getElementsByClassName("sentence");
    for (var i = 0; i < sentences.length; ++i)
    {
        var sentence = sentences[i];

        // remove all words and lines in sentence
        var wordElts = sentence.getElementsByClassName("word");
        var words = Array();
        for (var j = 0; j < wordElts.length; ++j)
            words.push(wordElts[j]);
        for (var j in words)
            words[j].parentNode.removeChild(words[j]);
        var lineElts = sentence.getElementsByClassName("line");
        var lines = Array();
        for (var j = 0; j < lineElts.length; ++j)
            lines.push(lineElts[j]);
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
                curLine = doc.createElementNS(s_ns, "g");
                AddClass(curLine, "line");
                sentence.appendChild(curLine);
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
                curLine = null;
        }
    }
};

//****************************************************************************
// history/state
//****************************************************************************

// add event to history
function PushHistory(a_headWord, a_alignedWord, a_added)
{
    // destroy any redo history and adjust save points and buttons
    if (s_historyCursor < s_history.length)
    {
        s_history.splice(s_historyCursor);
        document.getElementById("redo-button").setAttribute("disabled", "yes");
        
        // if we just destroyed save point in history
        if (s_saveCursor > s_historyCursor)
        {
          // remember that no point in history corresponds to last save
          s_saveCursor = -1;
          document.getElementById("save-button").removeAttribute("disabled");
        }
    }

    // save ids of headword and aligned word plus alignment state
    var headId = a_headWord.getAttribute("id");
    var alignedId = a_alignedWord.getAttribute("id");
    s_history.push(Array(headId, alignedId, a_added));
    s_historyCursor++;

    // adjust buttons
    document.getElementById("undo-button").removeAttribute("disabled");
    if (s_saveCursor == s_historyCursor)
      document.getElementById("save-button").setAttribute("disabled", "yes");
    else
      document.getElementById("save-button").removeAttribute("disabled");

    // update state
    UpdateState(headId, alignedId, a_added, 1);
}

// get event from history
function PopHistory()
{
    // fail if no history exists
    if (s_historyCursor == 0)
        return null;

    // get event and disable undo button if it's last one
    var event = s_history[--s_historyCursor];
    if (s_historyCursor == 0)
        document.getElementById("undo-button").setAttribute("disabled", "yes");

    // adjust buttons
    document.getElementById("redo-button").removeAttribute("disabled");
    if (s_saveCursor == s_historyCursor)
        document.getElementById("save-button").setAttribute("disabled", "yes");
    else
        document.getElementById("save-button").removeAttribute("disabled");

    // update state
    UpdateState(event[0], event[1], event[2], -1);

    // convert ids back to words
    return Array(document.getElementById(event[0]),
                 document.getElementById(event[1]),
                 event[2]);
};

// get event from redo history
function RepushHistory()
{
    // fail if nothing to redo exists
    if (s_historyCursor == s_history.length)
        return null;

    // get event and disable redo button if it's last one
    var event = s_history[s_historyCursor++];
    if (s_historyCursor == s_history.length)
        document.getElementById("redo-button").setAttribute("disabled", "yes");

    // adjust buttons
    document.getElementById("undo-button").removeAttribute("disabled");
    if (s_saveCursor == s_historyCursor)
      document.getElementById("save-button").setAttribute("disabled", "yes");
    else
      document.getElementById("save-button").removeAttribute("disabled");

    // update state
    UpdateState(event[0], event[1], event[2], 1);

    // convert ids back to words
    return Array(document.getElementById(event[0]),
                 document.getElementById(event[1]),
                 event[2]);
};

// update state
function UpdateState(a_id1, a_id2, a_added, a_inc)
{
    // get L1 and L2 ids
    var idL1;
    var idL2;
    if (a_id1.substr(0, a_id1.search(':')) == "L1")
    {
        idL1 = a_id1.substr(a_id1.search(':') + 1);
        idL2 = a_id2.substr(a_id2.search(':') + 1);
    }
    else
    {
        idL1 = a_id2.substr(a_id2.search(':') + 1);
        idL2 = a_id1.substr(a_id1.search(':') + 1);
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
    s_stateL1[idL1][a_added ? 0 : 1] += a_inc;
    s_stateL2[idL2][a_added ? 0 : 1] += a_inc;

    // add to summary stats
    s_summaryL1[SummaryIndex(s_stateL1[idL1])]++;
    s_summaryL2[SummaryIndex(s_stateL2[idL2])]++;

    // update display
    UpdateSummaryDisplay();
};

// update summary display
function UpdateSummaryDisplay()
{
    // update summary values
    for (var i = 0; i < 4; ++i)
        document.getElementById("L1:S" + i).innerHTML = s_summaryL1[i];
    for (var i = 0; i < 4; ++i)
        document.getElementById("L2:S" + i).innerHTML = s_summaryL2[i];
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
  if (s_saveCursor == s_historyCursor)
    return;

  // send synchronous request to save
  var req = new XMLHttpRequest();
  var svg = document.getElementsByTagNameNS(s_ns, "svg")[0];
  req.open("POST", svg.getAttribute("alph-saveurl"), false);
  req.setRequestHeader("Content-Type", "application/xml");
  req.send(XMLSerializer().serializeToString(svg));
  if (req.status != 200)
    alert(req.responseText ? req.responseText : req.statusText);

  // remember where we last saved and reset button
  s_saveCursor = s_historyCursor;
  document.getElementById("save-button").setAttribute("disabled", "yes");
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

        AddClass(rect, "marked");
        rect.setAttributeNS(null, "rx", s_fontSize / 2);
        rect.setAttributeNS(null, "ry", s_fontSize / 2);
    }
    else
    {
        // remove mark
        a_word.removeAttributeNS(s_xlinkns, "title");

        RemoveClass(rect, "marked");
        rect.removeAttributeNS(null, "rx");
        rect.removeAttributeNS(null, "ry");
    }
    
    // make sure we save results
    s_saveCursor = -1;
    document.getElementById("save-button").removeAttribute("disabled");
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
        var aligned = GetAlignedWords(a_word);
        for (var i = 0; i < aligned.length; ++i)
        {
            var word = aligned[i];

            // get right and bottom of this word
            // we should be able to just use last word's bottom,
            // but to be safe we take max of all words
            var x = Number(word.getAttribute("x")) +
                    Number(word.getAttribute("len"));
            var y = Number(word.getAttribute("y"));
            w = Math.max(w, x);
            h = Math.max(h, y);
        }
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
    return GetAlignment(a_word).getElementsByTagNameNS(s_ns, "text");
};

//****************************************************************************
// functions to manipulate multi-valued class attribute
//****************************************************************************

// get class attribute as array of strings
function GetClass(a_elt)
{
    var attr = a_elt.getAttributeNS(null, "class");
    return (attr ? attr.split(' ') : Array());
};

// check if class attribute contains a value
function HasClass(a_elt, a_class)
{
    var classVals = GetClass(a_elt);
    for (i in classVals)
    {
        if (classVals[i] == a_class)
            return true;
    }
    return false;
};

// add value to class attribute
function AddClass(a_elt, a_class)
{
    var classVals = GetClass(a_elt);
    for (i in classVals)
    {
        // if class already there, nothing to do
        if (classVals[i] == a_class)
            return;
    }
    classVals.push(a_class);
    a_elt.setAttributeNS(null, "class", classVals.join(' '));
};

// remove value from class attribute
function RemoveClass(a_elt, a_class)
{
    // if no value specified, remove whole value
    if (!a_class)
    {
        a_elt.removeAttributeNS(null, "class");
        return;
    }

    var classVals = GetClass(a_elt);
    for (i in classVals)
    {
        // if class there, remove it
        if (classVals[i] == a_class)
        {
            classVals.splice(i, 1);
            a_elt.setAttributeNS(null, "class", classVals.join(' '));
            return;
        }
    }
    // if not found, nothing to do
};

// toggle value in class attribute
function ToggleClass(a_elt, a_class)
{
    // if value is present remove it
    if (HasClass(a_elt, a_class))
      RemoveClass(a_elt, a_class);
    // if not present, add it
    else
      AddClass(a_elt, a_class);
};