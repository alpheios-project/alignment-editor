(:
  Copyright 2014 The Alpheios Project, Ltd.
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
  Query to create a template of parallel text chunks for alignment

:)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace xmldb="http://exist-db.org/xquery/xmldb";
import module namespace util="http://exist-db.org/xquery/util";
import module namespace tan  = "http://alpheios.net/namespaces/text-analysis"
    at "textanalysis-utils.xquery";
import module namespace aled="http://alpheios.net/namespaces/align-edit"
              at "align-editsentence.xquery";    
declare namespace align = "http://alpheios.net/namespaces/aligned-text";
declare namespace rdf ="http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace prov="http://www.w3.org/ns/prov#";
declare namespace cnt="http://www.w3.org/2008/content#";

declare option exist:serialize
        "method=xml";

declare function local:createWords(
  $a_sent as xs:string,$a_s as xs:int, $a_i as xs:int) as element()*
{
  if (string-length($a_sent) eq 0) then ()
  else
    (: this is a ridiculous hack to try to pull punctuation out of the word 
       it should be handled better via a tokenization service when we switch to that
       so this is just a shortterm workarouund -- it checks for punctuation not surrounded
       by spaces and adds spaces to it, since the tokenization algorithm is very simple here 
       and only tokenizes on space 
    :)
    let $sentfix :=
      if (matches($a_sent, '^[^ ",.:;\-—)"]+[",.:;\-—)"]')) 
      then 
        replace($a_sent, '^([^ ",.:;\-—)"]+)([",.:;\-—)"])', concat('$1',' ', '$2'))
      else if (matches($a_sent, '^[",.:;\-—)"][^ ]+'))
      then
        replace($a_sent, '^([",.:;\-—)\?"])([^ ]+)', concat('$1',' ', '$2'))
      else
        $a_sent
    let $word :=
        if (contains($sentfix, ' '))
        then
            substring-before($sentfix, ' ')
        else
        $sentfix
    return
    (
      <w xmlns="http://alpheios.net/namespaces/aligned-text">
      {
        attribute n { concat($a_s,'-',$a_i) },
        <text>{$word}</text>
      }</w>,
      local:createWords(substring-after($sentfix, ' '), $a_s, $a_i + 1)
    )
};

declare function local:createSentence(
  $a_l1 as xs:string,
  $a_l2 as xs:string,
  $a_l1text as xs:string,
  $a_l2text as xs:string,
  $a_l1uri as xs:string,
  $a_l2uri as xs:string,
  $a_l1dir as xs:string,
  $a_l2dir as xs:string,
  $a_docid as xs:string) as element()*
{
    let $l1comment := 
        if ($a_l1uri) then <comment xmlns="http://alpheios.net/namespaces/aligned-text" class="urn">{$a_l1uri}</comment> else ()
    let $l2comment := 
        if ($a_l2uri) then <comment xmlns="http://alpheios.net/namespaces/aligned-text" class="urn">{$a_l2uri}</comment> else ()
    return
	<aligned-text xmlns="http://alpheios.net/namespaces/aligned-text">
        <language lnum="L1" xml:lang="{$a_l1}" dir="{$a_l1dir}"/>
        <language lnum="L2" xml:lang="{$a_l2}" dir="{$a_l2dir}"/>
        <sentence id="1" document_id="{$a_docid}">
            <wds lnum="L1">{ $l1comment,local:createWords($a_l1text,1,1) }</wds>
            <wds lnum="L2">{ $l2comment,local:createWords($a_l2text,1,1) }</wds>
        </sentence>
     </aligned-text>
};

(: Text parameters :)
let $data := request:get-data()
let $l1text := $data//l1text
let $l2text := $data//l2text
let $l1 := $data//*:language[@lnum="L1"]/@xml:lang
let $l2 := $data//*:language[@lnum="L2"]/@xml:lang
let $l1dir := $data//*:language[@lnum="L1"]/@dir
let $l2dir := $data//*:language[@lnum="L2"]/@dir

let $l1Uri := $l1text/@uri
let $l2Uri := $l2text/@uri
let $collection := $data/@uri
let $inlineid := util:uuid()
let $docid := if ($data/@name) then $data/@name else $inlineid 
    
let $doc := local:createSentence($l1,$l2,$l1text,$l2text,$l1Uri,$l2Uri,$l1dir,$l2dir,$docid)

return
 <RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <Annotation xmlns="http://www.w3.org/ns/oa#">
        <memberOf xmlns="http://purl.org/dc/dcam/" rdf:resource="{$collection}"/>
        <hasTarget xmlns="http://www.w3.org/ns/oa#" rdf:resource="{$l1Uri}"/>
        <hasTarget xmlns="http://www.w3.org/ns/oa#" rdf:resource="{$l2Uri}"/>
        <hasBody xmlns="http://www.w3.org/ns/oa#" rdf:resource="{$inlineid}"/>
        <isMotivatedBy xmlns="http://www.w3.org/ns/oa#" rdf:resource="oa:linking_translation"/>
        <ContentAsXML xmlns="http://www.w3.org/ns/oa#" rdf:about="{$inlineid}">
            <cnt:rest rdf:parseType="Literal">
                {$doc}
            </cnt:rest>
        </ContentAsXML>
    </Annotation>
</RDF>
        
        

