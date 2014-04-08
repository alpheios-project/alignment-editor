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

(: convert files in a collection from old alignment format to new :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace alcv="http://alpheios.net/namespaces/align-convert"
              at "align-convert.xquery";
declare option exist:serialize "method=xhtml media-type=text/html";

let $dirName := request:get-parameter("dir", "alignment")
let $collection := concat("/db/repository/", $dirName)
let $newColl := xmldb:create-collection($collection, "converted")

let $docs :=
  (: for each resource in specified collection :)
  for $r in xmldb:get-child-resources($collection)
  where substring($r, string-length($r) - 3) eq ".xml"
  return $r

return
element html
{
  element body
  {
    for $doc in $docs
    let $newDoc := alcv:convert-file(doc(concat($collection, "/", $doc)))
    let $newName := xmldb:store($newColl, $doc, $newDoc)
    let $num := count($newDoc//sentence)
    return
    (
      concat("Converted ", $doc, ": ", string($num), " sentence(s)"),
      element br {}
    )
  }
}