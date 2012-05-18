(:
  Copyright 2009-2010 Cantus Foundation
  http://alpheios.net

  This file is part of Alpheios.

  Alpheios is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Alpheios is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 :)

(:
  Create HTML page for editing alignment sentence
 :)

module namespace aled="http://alpheios.net/namespaces/align-edit";
declare namespace align = "http://alpheios.net/namespaces/aligned-text";
import module namespace alut="http://alpheios.net/namespaces/align-util"
              at "align-util.xquery";

(:
  Function to create an HTML page for editing a sentence
  from an aligned text document

  Parameters:
    $a_docName     name of aligned text document
    $a_docStem     document stem
    $a_base        base path to current request
    $a_sentId      id of sentence to edit
    $a_saveURL     query to invoked to save sentence
    $a_listURL     query to invoked to list sentences
    $a_editURL     query to invoke to edit new sentence
    $a_editParam   sentence number parameter

  Return value:
    HTML page with SVG for editing sentence alignment
 :)
declare function aled:get-edit-page(
  $a_docName as xs:string,
  $a_docStem as xs:string,
  $a_base as xs:string,
  $a_sentId as xs:integer,
  $a_saveURL as xs:string,
  $a_listURL as xs:string,
  $a_editURL as xs:string,
  $a_exportURL as xs:string,
  $a_editParam as xs:string,
  $a_allowSave as xs:boolean) as element()?
{
  let $doc := doc($a_docName)
  let $maxSentId := count($doc//*:sentence)
  let $sent := ($doc//*:sentence)[$a_sentId]
  let $l1Lang := $sent/../*:language[@*:lnum = "L1"]/@xml:lang
  let $l2Lang := $sent/../*:language[@*:lnum = "L2"]/@xml:lang
  let $l1Dir := if ($l1Lang = ("ara", "ar")) then "rtl" else "ltr"
  let $l2Dir := if ($l2Lang = ("ara", "ar")) then "rtl" else "ltr"

  return
  <html xmlns="http://www.w3.org/1999/xhtml"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xml:lang="{if ($l1Lang='grc') then 'greek' else $l1Lang}"
  >{

  element head
  {
    element title
    {
      "Alpheios:Edit Aligned Sentence",
      data($sent/@*:document_id)
    },

    (: metadata :)
    element meta
    {
      attribute name { "alpheios-param-L1:lang" },
      attribute content { $l1Lang }
    },
    element meta
    {
      attribute name { "alpheios-param-L2:lang" },
      attribute content { $l2Lang }
    },
    element meta
    {
      attribute name { "alpheios-param-L1:direction" },
      attribute content { if ($l1Lang = ("ara", "ar")) then "rtl" else "ltr" }
    },
    element meta
    {
      attribute name { "alpheios-param-L2:direction" },
      attribute content { if ($l2Lang = ("ara", "ar")) then "rtl" else "ltr" }
    },
    element meta
    {
      attribute id { "alpheios-pedagogical-text" },
      attribute name { "alpheios-pedagogical-text" },
      attribute content { "true" }
    },
    if ($doc//*:comment[@*:class = "tbref"])
    then
      let $docId := $doc//*:comment[@*:class = "tbref"]/@*:docid
      return
      (
        element meta
        {
          attribute name { "alpheios-treebank-diagram-url" },
          attribute content
          {
            concat($a_base, "/treebank-getsvg.xq",
                   "?",
                   "f=", $docId,
                   "&amp;",
                   "s=SENTENCE")
          }
        },
        element meta
        {
          attribute name { "alpheios-treebank-url" },
          attribute content
          {
            concat($a_base, "/treebank-getmorph.xq",
                   "?",
                   "f=", $docId,
                   "&amp;",
                   "w=WORD")
          }
        }
      )
    else (),

    element link
    {
      attribute rel { "stylesheet" },
      attribute type { "text/css" },
      attribute href { "../css/alph-align-edit.css" }
    },

    element script
    {
      attribute language { "javascript" },
      attribute type { "text/javascript" },
      attribute src { "../script/alph-align-edit.js" }
    },
    element script
    {
      attribute language { "javascript" },
      attribute type { "text/javascript" },
      attribute src { "../script/alph-edit-utils.js" }
    },
    element script
    {
      attribute language { "javascript" },
      attribute type { "text/javascript" },
      attribute src { "../script/jquery-1.2.6-alph.js" }
    }
  },

  element body
  {
    attribute onkeypress { "Keypress(event)" },

    (: logo :)
    <div class="alpheios-ignore">
      <div id="alph-page-header">
        <img src="../image/alpheios.png"/>
      </div>
    </div>,

    (: controls :)
    element div
    {
      attribute class { "controls alpheios-ignore" },

      (: sentence navigation :)
      if ($maxSentId > 1)
      then
      let $sentId :=
        if ($a_sentId <= 0 or $a_sentId > $maxSentId) then 1 else $a_sentId
      return
      (
        element form
        {
          attribute onsubmit { "return FormSubmit(this)" },
          attribute action { $a_editURL },
          attribute name { "sent-navigation-goto" },

          <input type="hidden" name="doc" value="{ $a_docStem }"/>,
          <input type="hidden" name="ed" value="{ $a_allowSave }"/>,
          <input type="hidden"
                 name="maxSentId"
                 disabled="yes"
                 value="{ $maxSentId }"/>,

          element label { "Go to sentence number" },
          element input
          {
            attribute type { "text" },
            attribute name { $a_editParam },
            attribute size { "5" }
          }
        },

        element form
        {
          attribute onsubmit { "return FormSubmit(this)" },
          attribute action { $a_editURL },
          attribute name { "sent-navigation-buttons" },

          <input type="hidden" name="doc" value="{ $a_docStem }"/>,
          <input type="hidden" name="ed" value="{ $a_allowSave }"/>,
          <input type="hidden"
                 name="maxSentId"
                 disabled="yes"
                 value="{ $maxSentId }"/>,

          element button
          {
            attribute type { "submit" },
            attribute name { $a_editParam },
            attribute value { 1 },
            if ($sentId <= 1)
            then
              attribute disabled { "yes" }
            else (),
            "1&#xA0;&#x25C2;&#x25C2;"
          },
          element button
          {
            attribute type { "submit" },
            attribute name { $a_editParam },
            attribute accesskey { "<" },
            attribute value { $sentId - 1 },
            if ($sentId <= 1)
            then
            (
              attribute disabled { "yes" },
              "1&#xA0;&#x25C2;"
            )
            else
              concat($sentId - 1, "&#xA0;&#x25C2;")
          },
          
          element label { $sentId },

          element button
          {
            attribute type { "submit" },
            attribute name { $a_editParam },
            attribute accesskey { ">" },
            attribute value { $sentId + 1 },
            if ($sentId >= $maxSentId)
            then
            (
              attribute disabled { "yes" },
              concat("&#x25B8;&#xA0;", $maxSentId)
            )
            else
              concat("&#x25B8;&#xA0;", $sentId + 1)
          },
          element button
          {
            attribute type { "submit" },
            attribute name { $a_editParam },
            attribute value { $maxSentId },
            if ($sentId >= $maxSentId)
            then
              attribute disabled { "yes" }
            else (),
            concat("&#x25B8;&#x25B8;&#xA0;", $maxSentId)
          }
        },

        element form
        {
          attribute onsubmit { "return FormSubmit(this)" },
          attribute action { $a_listURL },
          attribute name { "sent-navigation-list" },

          <input type="hidden" name="doc" value="{ $a_docStem }"/>,
          <input type="hidden" name="ed" value="{ $a_allowSave }"/>,

          element button
          {
            attribute type { "submit" },
            "Go to list of sentences"
          }
        },

        <br/>
      )
      else (),

      if ($a_allowSave) then (
      <button id="save-button"
              onclick="ClickOnSave(event)">Save sentence</button>,
      <button id="undo-button"
              onclick="ClickOnUndo(event)">&lt; Undo</button>,
      <button id="redo-button"
              disabled="yes"
              onclick="ClickOnRedo(event)">Redo &gt;</button>)
      else (),
      <form method="post" action="{concat($a_exportURL,'?doc=',$a_docStem)}" id="exportform">
          <button id="export-button"
              onclick="ClickOnExport(event)">Export</button>
          <input type="hidden" name="sentenceForExport" id="sentenceForExport"/>
      </form>,
      <form>
        <label for="interlinear-checkbox">Show interlinear text</label>
        <input id="interlinear-checkbox"
               type="checkbox"
               onclick="ToggleInterlinearDisplay(event)"/>
      </form>
    },

    (: summary statistics :)
    <div class="summary alpheios-ignore">
      <table>
        <tr>
          <th>{ concat("&#xA0;&#xA0;&#xA0;&#xA0;", $l1Lang, ":") }</th>
          <td>
            <span class="heading">&#xA0;&#xA0;&lt;</span>
            <span id="L1:S0">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;=</span>
            <span id="L1:S1">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;&gt;</span>
            <span id="L1:S2">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;&#xD8;</span>
            <span id="L1:S3">0</span>
          </td>
        </tr>
        <tr>
          <th>{ concat("&#xA0;&#xA0;&#xA0;&#xA0;", $l2Lang, ":") }</th>
          <td>
            <span class="heading">&#xA0;&#xA0;&lt;</span>
            <span id="L2:S0">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;=</span>
            <span id="L2:S1">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;&gt;</span>
            <span id="L2:S2">0</span>
          </td>
          <td>
            <span class="heading">&#xA0;&#xA0;&#xD8;</span>
            <span id="L2:S3">0</span>
          </td>
        </tr>
      </table>
    </div>,

    <br/>,

    (: svg of sentence :)
    alut:xml-to-svg(
      $sent,
      <directions><lang lnum="L1" direction="{$l1Dir}"/><lang lnum="L2" direction="{$l2Dir}"/></directions>,
      (
        attribute alph-doc { $a_docStem },
        attribute alph-sentid { $a_sentId },
        attribute alph-saveurl { $a_saveURL },
        attribute onload { "Init(evt)" },
        attribute onmouseover { "EnterLeave(evt)" },
        attribute onmouseout { "EnterLeave(evt)" },
        attribute onclick { "Click(evt)" }
      ))
  }

  }</html>
};
