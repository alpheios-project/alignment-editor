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
  Create HTML page for editing alignment sentence
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace aled="http://alpheios.net/namespaces/align-edit"
              at "align-editsentence.xquery";
declare option exist:serialize
        "method=xhtml media-type=application/xhtml+xml omit-xml-declaration=no indent=yes 
        doctype-public=-//W3C//DTD&#160;XHTML&#160;1.0&#160;Transitional//EN
        doctype-system=http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd";

let $docStem := request:get-parameter("doc", ())
let $docName := concat("/db/repository/alignment/", $docStem, ".xml")
let $sentId := request:get-parameter("s", ())
let $allowSave := xs:boolean(request:get-parameter("ed",false()))
let $saveURL := "./align-savesentence.xq"
let $listURL := "./align-getlist.xq"
let $editURL := "./align-editsentence.xq"
let $base := request:get-url()
let $base := substring($base,
                       1,
                       string-length($base) - 
                       string-length(request:get-path-info()))
let $base := substring($base,
                       1,
                       string-length($base) -
                       string-length(tokenize($base, '/')[last()]))

return aled:get-edit-page($docName,
                          $docStem,
                          $base,
                          number($sentId),
                          $saveURL,
                          $listURL,
                          $editURL,
                          "s",$allowSave)
