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
  Create HTML page with list of initial parts of aligned sentences
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace alst="http://alpheios.net/namespaces/align-list"
              at "align-getlist.xquery";
import module namespace albu="http://alpheios.net/namespaces/align-backup"
              at "align-backup.xquery";
declare option exist:serialize "method=xhtml media-type=text/html";

let $docStem := request:get-parameter("doc", ())
let $collName := "/db/repository/alignment/"
let $docName := concat($collName, $docStem, ".xml")
let $editBase := concat("./align-editsentence.xq",
                        "?doc=",
                        encode-for-uri($docStem),
                        "&amp;s=")

(: see if backup was requested :)
let $backup := request:get-parameter("backup", "n")
let $usets := request:get-parameter("usets", "off")
let $doBackup :=
  if ($backup eq "y")
  then
    albu:do-backup($collName, $docStem, ($usets eq "on"))
  else ()

(: see if restore was requested :)
let $restoreStem := request:get-parameter("restore", ())
let $doRestore :=
  if ($restoreStem)
  then
    albu:do-restore($collName, $docStem, $restoreStem)
  else ()

(: now go get actual list :)
return alst:get-list-page($docName, $docStem, $editBase, 25, 1000)
