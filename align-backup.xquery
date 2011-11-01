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

module namespace albu="http://alpheios.net/namespaces/align-backup";
import module namespace xmldb="http://exist-db.org/xquery/xmldb";

(:
  Local function to get timestamp in form to be used in file name

  Return value:
    timestamp in form yyyymmddThhmmss
 :)
declare function local:get-timestamp() as xs:string
{
  (: date (8 chars) + T + time (6 chars), without punctuation :)
  substring(translate(string(current-dateTime()), "-:", ""), 1, 15)
};

(:
  Local function to all file stems matching initial part

  Parameters:
    a_collection      collection to look in
    a_docStem         initial part of stem
    a_includeStem     whether to include the stem by itself

  Return value:
    list of stems (filename without ".xml" extension) that start
    with the specified initial part
    
  Stems are returned in descending order so that stem+timestamp
  will appear with latest timestamps first.
 :)
declare function local:get-doc-stems(
  $a_collection as xs:string,
  $a_docStem as xs:string,
  $a_includeStem as xs:boolean) as xs:string*
{
  (: for each resource in specified collection :)
  for $r in xmldb:get-child-resources($a_collection)
  let $rlen := string-length($r)
  let $rstem := substring($r, 1, $rlen - 4)
  let $rsuff := substring($r, $rlen - 3)
  where ($rlen > 4) and starts-with($r, $a_docStem)
  order by $r descending
  return
    (: if name ends in ".xml" :)
    if ($rsuff eq ".xml")
    then
      (: if including stem or this is not it :)
      if ($a_includeStem or ($rstem ne $a_docStem)) then $rstem else ()
    else ()
};

(:
  Function to create backup/restore page

  Parameters:
    a_collection      collection to look in
    a_docStem         initial part of stem

  Return value:
    HTML page with controls for backing up and restoring versions of file
 :)
declare function albu:get-backup-page(
  $a_collection as xs:string,
  $a_docStem as xs:string) as element()?
{
  (: get potential restorable files :)
  let $docStems := local:get-doc-stems($a_collection,
                                       concat($a_docStem, ".bak"),
                                       false())
  
  return
  <html xmlns="http://www.w3.org/1999/xhtml"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
  >{

  element head
  {
    element title
    {
      "Alpheios:Backup/Restore Aligned Sentence Document",
      data($a_docStem)
    },

    element link
    {
      attribute rel { "stylesheet" },
      attribute type { "text/css" },
      attribute href { "../css/alph-align-list.css" }
    }
  },

  element body
  {
    (: logo :)
    <div class="alpheios-ignore">
      <div id="alph-page-header">
        <img src="../image/alpheios.png"/>
      </div>
    </div>,

    element h2 { concat("Backup/restore for document ", $a_docStem) },

    (: backup controls :)
    <div>
      <form name="backup-form" action="./align-getlist.xq">
        <button type="submit">Backup</button>
        <div>
          <input type="hidden" name="doc" value="{ $a_docStem }"/>
          <input type="hidden" name="ed" value="true"/>
          <input type="hidden" name="backup" value="y"/>
          <label for="usets">Include timestamp in name</label>
          <input type="checkbox" id="usets" name="usets" checked="yes"/>
        </div>
      </form>
      <hr align="left" width="50%"/>
    </div>,

    (: restore controls, if any backups exist :)
    if (count($docStems) > 0)
    then
    <div>
      <form name="restore-form" action="./align-getlist.xq">
        <button type="submit">Restore</button>
        <label>:</label>
        <input type="hidden" name="doc" value="{ $a_docStem }"/>
        <input type="hidden" name="ed" value="true"/>
        <div>{
          for $stem at $i in $docStems
          let $id := concat("restore-", $i)
          return
          (
            element input
            {
              if ($i eq 1) then attribute checked { "yes" } else (),
              attribute id { $id },
              attribute type { "radio" },
              attribute name { "restore" },
              attribute value { $stem }
            },
            element label
            {
              attribute for { $id },
              $stem
            },
            <br/>
          )
        }</div>
      </form>
      <hr align="left" width="50%"/>
    </div>
    else
      <h4>No backups exist.</h4>,

    (: return without doing anything :)
    <div>
      <form name="return" action="./align-getlist.xq">
        <button type="submit">Return to sentence list</button>
        <input type="hidden" name="doc" value="{ $a_docStem }"/>
        <input type="hidden" name="ed" value="true"/>
      </form>
    </div>
  }

  }</html>
};

(:
  Function to perform backup operation

  Parameters:
    a_collection      collection to look in
    a_docStem         stem of document to back up
    a_timeStamp       whether to include timestamp in backup name

  Return value:
    path of new backup if successful, else empty
 :)
declare function albu:do-backup(
  $a_collName as xs:string,
  $a_docStem as xs:string,
  $a_timestamp as xs:boolean) as xs:string?
{
  let $docName := concat($a_collName, $a_docStem, ".xml")
  let $buName := concat($a_docStem,
                        ".bak",
                        if ($a_timestamp)
                        then
                          concat('.', local:get-timestamp())
                        else "",
                        ".xml")
  let $doc := doc($docName)
  return xmldb:store($a_collName, $buName, $doc)
};

(:
  Function to perform restore operation

  Parameters:
    a_collection      collection to look in
    a_docStem         stem of document to restore to
    a_restoreStem     stem of document to restore from

  Return value:
    path of restored document if successful, else empty
 :)
declare function albu:do-restore(
  $a_collName as xs:string,
  $a_docStem as xs:string,
  $a_restoreStem as xs:string) as xs:string?
{
  let $docName := concat($a_docStem, ".xml")
  let $restoreName := concat($a_collName, $a_restoreStem, ".xml")
  let $restore := doc($restoreName)
  return xmldb:store($a_collName, $docName, $restore)
};
