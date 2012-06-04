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
  Convert SVG to XML alignment format and save
 :)

module namespace alsv="http://alpheios.net/namespaces/align-save";
import module namespace alut="http://alpheios.net/namespaces/align-util"
              at "align-util.xquery";

(:
  Function to save SVG in alignment document

  Parameters:
    $a_collection  collection to put document in
    $a_data        SVG data

  Return value:
    HTML page with status/error
 :)
declare function alsv:save-sentence(
  $a_collection as xs:string,
  $a_data as element()?) as element()?
{
  if ($a_data)
  then
    let $docName := concat($a_collection, $a_data/@alph-doc, ".xml")
    let $sentId := $a_data/@alph-sentid
    let $doc := doc($docName)
    let $oldSentence := subsequence($doc//*:sentence, $sentId, 1)
    return
    if ($oldSentence)
    then
      let $newData := alut:svg-to-xml($a_data, false())
      return
      if ($newData)
      then
        (: build content in namespace of existing sentence :)
        let $ns := namespace-uri($oldSentence)
        let $newSentence :=
          element { QName($ns, "sentence") }
          {
            $oldSentence/@*,
            alut:set-default-namespace($newData/*, $ns)
          }
        let $empty := update replace $oldSentence with $newSentence
        return element message { "Sentence saved" }
      else
        element error { "Error converting sentence" }
    else
      element error { "Error retrieving sentence to update" }
  else
    element error { "No data found" }
};