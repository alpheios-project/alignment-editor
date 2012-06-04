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
  Create HTML page for displaying alignment sentence
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace response="http://exist-db.org/xquery/response";
import module namespace aled="http://alpheios.net/namespaces/align-edit"
              at "align-editsentence.xquery";
import module namespace util="http://exist-db.org/xquery/util";
import module namespace alut="http://alpheios.net/namespaces/align-util"
              at "align-util.xquery";
declare namespace svg="http://www.w3.org/2000/svg";

declare option exist:serialize
        "method=xhtml media-type=application/xhtml+xml omit-xml-declaration=no indent=yes 
        doctype-public=-//W3C//DTD&#160;XHTML&#160;1.0&#160;Transitional//EN
        doctype-system=http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd";

let $docName := request:get-parameter("doc","") 
let $data := util:parse(request:get-parameter("sentenceForDisplay",""))
let $doc := alut:svg-to-xml( $data/svg:svg, true() )
let $base := request:get-url()
let $baseResUrl := replace($base,'/xq/.*','')
let $base := substring($base,
                       1,
                       string-length($base) - 
                       string-length(request:get-path-info()))
let $base := substring($base,
                       1,
                       string-length($base) -
                       string-length(tokenize($base, '/')[last()]))
let $dispo := response:set-header("Content-disposition",concat("attachment; filename=",$docName,".xhtml"))                       
return aled:get-display-page($doc/*:sentence,$base,$baseResUrl)
