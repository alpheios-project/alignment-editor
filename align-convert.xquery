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
  Convert alignment file from old to new format
 :)

module namespace alcv="http://alpheios.net/namespaces/align-convert";

(:
  Function to convert file from old to new

  Parameters:
    $a_doc          document to convert

  Return value:
    converted document
 :)
declare function alcv:convert-file(
  $a_doc as node()) as element()
{
  element aligned-text
  {
    (: add language descriptors before first sentence :)
    element language
    {
      attribute lnum { "L1" },
      attribute xml:lang { ($a_doc//sentence)[1]/wds[@lnum = "L1"]/@lang }
    },
    element language
    {
      attribute lnum { "L2" },
      attribute xml:lang { ($a_doc//sentence)[1]/wds[@lnum = "L2"]/@lang }
    },

    (: for each sentence :)
    for $sent in $a_doc//sentence
      (: convert old xml to new xml :)
      return alcv:convert-sentence($sent)
  }
};

(: convert sentence :)
declare function alcv:convert-sentence(
  $a_sent as element()?) as element()?
{
  if ($a_sent)
  then

  element sentence
  {
    $a_sent/@*,

    (: for each language, create word set :)
    for $lang in ("L1", "L2")
    let $words := $a_sent/*:wds[@lnum eq $lang]/*:w
    where count($words) > 0
    return
    element wds
    {
      attribute lnum { $lang },

      (: for each word in set :)
      for $word in $words
      return
      element w
      {
        attribute n { $word/@n },

        element text { $word/text() },
        if ($word/@mark)
        then
          element comment
          {
            attribute class { "mark" },
            data($word/@mark)
          }
        else (),
        if ($word/@nrefs)
        then
          element refs { attribute nrefs { $word/@nrefs } }
        else ()
      }
    }
  }

  (: if no sentence, return nothing :)
  else ()
};
