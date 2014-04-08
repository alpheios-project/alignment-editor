(:
  Copyright 2012 The Alpheios Project, Ltd.
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
  Query to send a set of parallel text chunks for alignment

  Request data holds new chunks to align in one of 
    OAC wrapped annotation
    alignment xml
    Plain text
  Where
    doc = an identifier for the supplied text (Optional)
    saveUrl = a url to which to post the aligned chunk (Optional)
    listUrl = a url at which you can list chunks for alignment (optional)
    if XML is sent, it should be POSTED as form data
    if plain text is sent use parameters:
    l1 = language code for language 1
    l1text = language 1 text string
    l2 = language code for language 2
    l2text = language 2 text string
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace xmldb="http://exist-db.org/xquery/xmldb";
import module namespace util="http://exist-db.org/xquery/util";
import module namespace tan  = "http://alpheios.net/namespaces/text-analysis"
    at "textanalysis-utils.xquery";
import module namespace aled="http://alpheios.net/namespaces/align-edit"
              at "align-editsentence.xquery";    
declare namespace align = "http://alpheios.net/namespaces/aligned-text";
declare namespace oac="http://www.openannotation.org/ns/";

declare option exist:serialize
        "method=xhtml media-type=application/xhtml+xml omit-xml-declaration=no indent=yes 
        doctype-public=-//W3C//DTD&#160;XHTML&#160;1.0&#160;Transitional//EN
        doctype-system=http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd";

declare function local:createWords(
  $a_sent as xs:string,$a_s as xs:int, $a_i as xs:int) as element()*
{
  if (string-length($a_sent) eq 0) then ()
  else
    let $word :=
      if (contains($a_sent, ' '))
      then
        substring-before($a_sent, ' ')
      else
        $a_sent
    return
    (
      <w xmlns="http://alpheios.net/namespaces/aligned-text">
      {
        attribute n { concat($a_s,'-',$a_i) },
        <text>{$word}</text>
      }</w>,
      local:createWords(substring-after($a_sent, ' '), $a_s, $a_i + 1)
    )
};

declare function local:getSentence($a_data as node()) as element()* {
    let $dummy := element {QName("http://alpheios.net/namespaces/aligned-text","aligned-text")} {}
    return 
        (: if we've been sent an oac:Annotation, get the treebank data from it :)
        if ($a_data//oac:Annotation)
        then
            tan:get_OACAlignment($a_data)//align:aligned-text
        (: else if we've been sent unwrapped alignment xml, just use it :)
        (: name($a_data) doesn't work here if a prefix for the align namespace has been specified in the input doc :)
        else if (local-name($a_data) = local-name($dummy) and namespace-uri($a_data) = namespace-uri($dummy))
        then
            $a_data
        else ()
};

declare function local:createSentence(
  $a_l1 as xs:string,
  $a_l2 as xs:string,
  $a_l1text as xs:string,
  $a_l2text as xs:string,
  $a_l1urn as xs:string,
  $a_l2urn as xs:string) as element()*
{
    let $l1comment := 
        if ($a_l1urn) then <comment class="urn">{$a_l1urn}</comment> else ()
    let $l2comment := 
        if ($a_l1urn) then <comment class="urn">{$a_l2urn}</comment> else ()
    return
	<aligned-text xmlns="http://alpheios.net/namespaces/aligned-text">
        <language lnum="L1" xml:lang="{$a_l1}"/>
        <language lnum="L2" xml:lang="{$a_l2}"/>
        <sentence>
            <wds lnum="L1">{ $l1comment,local:createWords($a_l1text,1,1) }</wds>
            <wds lnum="L2">{ $l2comment,local:createWords($a_l2text,1,1) }</wds>
        </sentence>
     </aligned-text>
};

(: Text parameters :)
let $data := request:get-data()
let $l1text := normalize-space(request:get-parameter("l1text",""))
let $l2text := normalize-space(request:get-parameter("l2text",""))
let $l1 := request:get-parameter("l1","")
let $l2 := request:get-parameter("l2","")

(: API Parameters :)
let $docId := request:get-parameter('doc','alignment')
let $sentId := 1 (: only one sentence chunk allowed for now :)
let $saveURL := request:get-parameter('saveUrl','')
let $allowSave := if ($saveURL) then true() else false()
let $listURL := request:get-parameter('listUrl','')
let $editURL := ""
let $l1Urn := request:get-parameter('l1urn','')
let $l2Urn := request:get-parameter('l2urn','')


let $exportURL := "./align-export.xq"
let $base := request:get-url()
let $base := substring($base,
                       1,
                       string-length($base) - 
                       string-length(request:get-path-info()))
let $base := substring($base,
                       1,
                       string-length($base) -
                       string-length(tokenize($base, '/')[last()]))
let $newDoc :=                        
  if ($data)
  then
    local:getSentence($data)
  else 
    local:createSentence($l1,$l2,$l1text,$l2text,$l1Urn,$l2Urn)
  
   return 
    aled:get-edit-page(
                $newDoc,
                $docId,
                $base,
                $sentId,
                $saveURL,
                $listURL,
                $editURL,
                $exportURL,
                "s",$allowSave)
    