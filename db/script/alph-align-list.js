/**
 * @fileoverview alph-align-list - alignment sentence list
 *  
 * Copyright 2009 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//****************************************************************************
// marks
//****************************************************************************

// mouse over element with marks
function ShowMarks(a_elt)
{
  var tip = a_elt.getElementsByClassName("alph-marks")[0];
  tip.style.position = "relative";
  tip.style.visibility = "visible";
};

// mouse out of element with marks
function HideMarks(a_elt)
{
  var tip = a_elt.getElementsByClassName("alph-marks")[0];
  tip.style.position = "absolute";
  tip.style.visibility = "hidden";
};