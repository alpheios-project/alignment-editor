(:
  Copyright 2009 Cantus Foundation
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
  Utilities for alignment data
 :)

module namespace alut="http://alpheios.net/namespaces/align-util";
declare namespace svg="http://www.w3.org/2000/svg";
declare namespace xlink="http://www.w3.org/1999/xlink";

(:
  Function to convert sentence in alignment XML to displayable SVG

  Parameters:
    $a_sent        alignment sentence
    $a_attrs       attributes to add to <svg> element

  Return value:
    SVG representation of sentence
 :)
declare function alut:xml-to-svg(
  $a_sent as element()?,
  $a_attrs as attribute()*) as element()?
{
  (: if no sentence, return nothing :)
  if ($a_sent)
  then

  <svg:svg version="1.1"
           baseProfile="full"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           xmlns:ev="http://www.w3.org/2001/xml-events"
  >{
    (: include additional attributes :)
    $a_attrs,

    (: preserve any sentence-level comments :)
    if ($a_sent/*:comment)
    then
      <desc xmlns="http://alpheios.net/namespaces/aligned-text">
      {
        $a_sent/*:comment
      }
      </desc>
    else (),

    for $lang in ("L1", "L2")
    let $otherLang := if ($lang eq "L1") then "L2" else "L1"
    let $wordSet := $a_sent/*:wds[@*:lnum eq $lang]
    let $words := $wordSet/*:w
    let $otherWords := $a_sent/*:wds[@*:lnum eq $otherLang]/*:w
    let $tbrefs :=
      if ($lang eq "L1")
      then
        $a_sent/../*:comment[@*:class="tbref"]/*:match[@*:as=$a_sent/@*:id]
      else ()
    return
    element g
    {
      attribute class { "sentence", $lang },
      attribute lnum { $lang },
      attribute xml:lang { $a_sent/../*:language[@*:lnum = $lang]/@xml:lang },

      (: preserve any wordset-level comments :)
      if ($wordSet/*:comment)
      then
        <desc xmlns="http://alpheios.net/namespaces/aligned-text">
        {
          $wordSet/*:comment
        }
        </desc>
      else (),

      for $word at $i in $words
      let $refs := tokenize($word/*:refs/@*:nrefs, ' ')
      let $tbref := $tbrefs[@*:aw <= $i][last()]
      return
      element g
      {
        attribute class { "word" },
        attribute id { concat($lang, ":", $word/@*:n) },
        if ($tbref)
        then
          let $numRefs :=
            (: if @len exists, there is 1-to-1 relation :)
            if (exists($tbref/@*:len)) then 1
            (: if @lena=1, there is 1-to-many relation :)
            else if ($tbref/@*:lena = 1) then xs:integer($tbref/@*:lent)
            (: otherwise, don't know what to do :)
            else 0
          return
          if ($numRefs > 0)
          then
            attribute tbrefs
            {
              string-join(
                let $prefix := concat($tbref/@*:ts, '-')
                for $j in (0 to $numRefs - 1)
                return
                  concat($prefix, $tbref/@*:tw + ($i - $tbref/@*:aw) + $j),
                ' ')
            }
          else ()
        else (),
        if ($word/*:mark)
        then
          attribute xlink:title { $word/*:mark/text() }
        else (),
        if ($word/*:comment[@*:class eq "mark"])
        then
          attribute xlink:title { $word/*:comment[@*:class eq "mark"]/text() }
        else (),

        (: preserve any word-level comments that aren't marks :)
        if ($word/*:comment[@*:class ne "mark"])
        then
          <desc xmlns="http://alpheios.net/namespaces/aligned-text">
          {
            $word/*:comment[@*:class ne "mark"]
          }
          </desc>
        else (),

        (: highlighting rectangle :)
        element rect { attribute class { "headwd-bg" } },

        (: the word itself :)
        element text
        {
          attribute class
          {
            "headwd",
            (: if this has no aligned words, flag it :)
            if (count($refs) eq 0) then "free" else ()
          },
          $word/*:text/text()
        },

        (: aligned words :)
        element g
        {
          attribute class { "alignment", "alpheios-ignore" },
          for $n in $refs
          return
          element text
          {
            attribute idref { concat($otherLang, ":", $n) },
            $otherWords[@*:n eq $n]/*:text/text()
          }
        }
      }
    }
  }</svg:svg>

  else ()
};

(:
  Function to convert sentence in SVG to alignment XML

  Parameters:
    $a_sent        alignment sentence in SVG

  Return value:
    representation of sentence in alignment XML
 :)
declare function alut:svg-to-xml(
  $a_sent as element()?) as element()?
{
  if ($a_sent)
  then
  <sentence xmlns="http://alpheios.net/namespaces/aligned-text">
  {
    (: copy any comments :)
    $a_sent/desc/*,

    for $lang in ("L1", "L2")
(: following has problems in eXist 1.2.5: :)
(:  let $svgWordSet := $a_sent/*:g[tokenize(@*:class, ' ') = $lang] :)
(: so instead do: :)
    let $svgWordSet :=
      for $g in $a_sent/*:g
      return if (tokenize($g/@*:class, ' ') = $lang) then $g else ()
    let $words := $svgWordSet/*:g/*:g
    return
    element wds
    {
      attribute lnum { $lang },

      (: copy any comments :)
      $svgWordSet/*:desc/*,

      for $word in $words
      return
      element w
      {
        (: id of this word :)
        attribute n { substring-after($word/@*:id, ':') },

        (: text of this word :)
        element text
        {
          if ($word/*:text/@*:form)
          then
            string($word/*:text/@*:form)
          else
            $word/*:text/text()
        },

        (: copy mark, if any :)
        if ($word/@xlink:title)
        then
          element comment
          {
            attribute class { "mark" },
            data($word/@xlink:title)
          }
        else (),

        (: copy any remaining comments :)
        $word/*:desc/*,

        (: references to aligned words :)
        let $refs :=
          for $aligned-word in $word/*:g/*:text
          return
            substring-after($aligned-word/@*:idref, ':')
        return
          if (count($refs) > 0)
          then
            element refs
            {
              attribute nrefs { string-join($refs, ' ') }
            }
          else ()
      }
    }
  }
  </sentence>

  else ()
};

(:
  Function to convert namespace

  Parameters:
    $a_data         content to change namespace in
    $a_ns           new namespace

  Return value:
    data with all elements in specified default namespace
 :)
declare function alut:set-default-namespace(
  $a_data as node()*,
  $a_ns as xs:string) as node()*
{
  for $node in $a_data
  return
    if ($node instance of element())
    then
    element { QName($a_ns, local-name($node)) }
    {
      $node/@*,
      alut:set-default-namespace($node/node(), $a_ns)
    }
    else $node
};
