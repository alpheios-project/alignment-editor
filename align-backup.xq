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
  Backup and restore alignment files
 :)

import module namespace request="http://exist-db.org/xquery/request";
import module namespace albu="http://alpheios.net/namespaces/align-backup"
              at "align-backup.xquery";
declare option exist:serialize "method=xhtml media-type=text/html";

let $docStem := request:get-parameter("doc", ())[1]

return albu:get-backup-page("/db/repository/alignment", $docStem)
