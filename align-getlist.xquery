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
  Create HTML page with list of initial parts of aligned sentences
 :)

module namespace alst="http://alpheios.net/namespaces/align-list";

(:
  Function to create an HTML page with a list of sentences
  from an aligned text document

  Parameters:
    $a_docName     name of aligned text document
    $a_docStem     document stem 
    $a_queryBase   query to invoke when sentence is selected
    $a_maxWords    maximum number of words to use from sentence
    $a_maxSents    maximum number of sentences to use from document

  Return value:
    HTML page with a list of initial sentence fragments
 :)
declare function alst:get-list-page(
  $a_docName as xs:string,
  $a_docStem as xs:string,
  $a_queryBase as xs:string,
  $a_maxWords as xs:integer,
  $a_maxSents as xs:integer) as element()?
{
  let $doc := doc($a_docName)
  let $sents := subsequence($doc//*:sentence, 1, $a_maxSents)
  let $docId := substring-before($sents[1]/@*:document_id, ":")
  let $l1Lang := $doc//*:language[@*:lnum = "L1"]/@xml:lang
  let $l2Lang := $doc//*:language[@*:lnum = "L2"]/@xml:lang
  let $l1Dir := if ($l1Lang = ("ar", "ara")) then "rtl" else "ltr"
  let $l2Dir := if ($l2Lang = ("ar", "ara")) then "rtl" else "ltr"

  return
  <html xmlns="http://www.w3.org/1999/xhtml">{
  element head
  {
    element title
    {
      "Alpheios:Aligned Sentence List",
      $docId
    },

    (: metadata for language codes :)
    element meta
    {
      attribute name { "L1:lang" },
      attribute content { $l1Lang }
    },
    element meta
    {
      attribute name { "L2:lang" },
      attribute content { $l2Lang }
    },

    element link
    {
      attribute rel { "stylesheet" },
      attribute type { "text/css" },
      attribute href { "../css/alph-align-list.css" }
    },
    element script
    {
      attribute language { "javascript" },
      attribute type { "text/javascript" },
      attribute src { "../script/alph-align-list.js" }
    }
  },

  element body
  {
    (: logo :)
    <div class="alpheios-ignore">
      <div id="alph-page-header">
        <img src="../image/alpheios.png"/>
      </div>
    </div>,

    element h2
    {
      concat("Sentence list for document ", $docId, " [file ", $a_docName, "]")
    },

    <div>
      <form name="backup" action="./align-backup.xq">
        <button type="submit">Backup/Restore</button>
        <input type="hidden" name="doc" value="{ $a_docStem }"/>
      </form>
    </div>,

    element ol
    {
      (: for each sentence :)
      for $sent at $i in $sents
      let $queryURL := concat($a_queryBase, $i)
      let $l1Words := $sent/*:wds[@*:lnum="L1"]/*:w
      let $l2Words := $sent/*:wds[@*:lnum="L2"]/*:w
      let $marks :=
        for $word in ($l1Words, $l2Words)
        let $mark := ($word/*:mark, $word/*:comment[@*:class = "mark"])
        return
        if (count($mark) > 0)
        then
          element tr
          {
            element td { $word/*:text/text() },
            element td { data($mark) }
          }
        else ()
      return
      (
        element li
        {
          attribute value { $i },
          element a
          {
            attribute href { $queryURL },
            element div
            {
              attribute class
              {
                "sentence",
                if (count($marks) > 0) then "marked" else ()
              },
              if (count($marks) > 0)
              then
              (
                attribute onmouseover { "ShowMarks(this)" },
                attribute onmouseout { "HideMarks(this)" }
              )
              else (),

              element div
              {
                attribute class { "words" },
                attribute dir { $l1Dir },

                (: concatenated words from L1 :)
                for $word at $i in $l1Words
                where $i < $a_maxWords
                return
                  ($word/*:text/text(), ' '),
                if (count($l1Words) > $a_maxWords) then "..." else ""
              },
              element div
              {
                attribute class { "words" },
                attribute dir { $l2Dir },

                (: concatenated words from L2 :)
                for $word at $i in $l2Words
                where $i < $a_maxWords
                return
                  ($word/*:text/text(), ' '),
                if (count($l2Words) > $a_maxWords) then "..." else ""
              },

              if (count($marks) > 0)
              then
              element div
              {
                attribute class { "alph-marks" },
                element table
                {
                  element th { "Word" },
                  element th { "Comment" },
                  $marks
                }
              }
              else ()
            }
          }
        }
      )
    }
  }
  }</html>
};