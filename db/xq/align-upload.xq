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
  Upload alignment files
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace util="http://exist-db.org/xquery/util";
import module namespace albu="http://alpheios.net/namespaces/align-backup"
              at "align-backup.xquery";
declare option exist:serialize "method=xhtml media-type=text/html";

let $hasFile := request:get-uploaded-file-name("newfile")
let $docName := request:get-parameter("doc","")
let $collName := "/db/repository/alignment/"
let $message :=
    if ($hasFile) then
        let $newFile := request:get-uploaded-file-data("newfile")               
        let $newDocString := util:binary-to-string($newFile,"UTF-8")
        let $cleaned := replace($newDocString,'<\?xml version="1.0" encoding="UTF-8"\?>','')
        let $newDoc := util:eval(document { $cleaned }) 
        return
            if ($newDoc) then 
                let $path := albu:do-upload($collName,$docName, $newDoc) 
                return if ($path) then "File uploaded successfully." else "Error uploading file"
            else "Invalid file"
    else "No filename specified"            

return albu:get-backup-page("/db/repository/alignment", $docName, $message)
