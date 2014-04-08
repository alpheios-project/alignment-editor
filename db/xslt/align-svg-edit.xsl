<?xml version="1.0" encoding="UTF-8"?>
<!--
  Copyright 2014 The Alpheios Project, Ltd.
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
-->
<!--
  Convert sentence between treebank format and SVG suitable for editing

  xml-to-svg:
  Output is returned as a alignment display in SVG format 
  
  It is the responsibility of the caller to add line, text, and rectangle
  elements as desired and to position the elements for display.

  svg-to-xml:
  Output is returned as a alignment XML
 -->
<xsl:stylesheet xmlns="http://www.w3.org/2000/svg"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns:align= "http://alpheios.net/namespaces/aligned-text"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:exsl="http://exslt.org/common" version="1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  exclude-result-prefixes="xs">

  <xsl:output omit-xml-declaration="yes" method="xml" indent="yes"/>
  <!--
    External parameters:
      e_mode    mode: xml-to-svg  transform treebank xml to svg
                      svg-to-xml  transform svg to treebank xml
      e_app     application ("editor" or "viewer")
  -->
  <xsl:param name="e_mode"/>
  <xsl:param name="e_app" select="'editor'"/>
  <xsl:param name="e_l1dir" select="'ltr'"/>
  <xsl:param name="e_l2dir" select="'ltr'"/>
  <xsl:param name="e_wrapXml" select="true()"/>

  <!--
    Template for external calls
    Calls appropriate template according to mode
  -->
  <xsl:template match="/">
    <xsl:choose>
      <xsl:when test="$e_mode = 'xml-to-svg'">
        <xsl:call-template name="xml-to-svg">
          <xsl:with-param name="a_doc" select="align:aligned-text"/>
          <xsl:with-param name="a_app" select="$e_app"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$e_mode = 'svg-to-xml'">
        <xsl:call-template name="svg-to-xml">
          <xsl:with-param name="a_sent" select="svg:svg"/>
        </xsl:call-template>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!--
    Function to convert sentence from Alignment XML to SVG

    Parameters:
      $a_sentence     alignment sentence
      $a_app          application (viewing or editing)

    Return value:
      svg element containing SVG equivalent of sentence
  -->
  <xsl:template name="xml-to-svg">
    <xsl:param name="a_doc"/>
    <xsl:param name="a_app"/>
    <svg:svg version="1.1"
        baseProfile="full"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:ev="http://www.w3.org/2001/xml-events">
      
        <xsl:call-template name="sentence_to_svg">
          <xsl:with-param name="lang" select="'L1'"/>
          <xsl:with-param name="sentence" select="$a_doc/align:sentence"></xsl:with-param>
          <xsl:with-param name="dir">
            <xsl:choose>
              <xsl:when test="$a_doc/align:language[@lnum='L1']/@dir"><xsl:value-of select="$a_doc/align:language[@lnum='L1']/@dir"/></xsl:when>
              <xsl:otherwise><xsl:value-of select="$e_l1dir"/></xsl:otherwise>
            </xsl:choose>
          </xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="sentence_to_svg">
          <xsl:with-param name="lang" select="'L2'"/>
          <xsl:with-param name="sentence" select="$a_doc/align:sentence"></xsl:with-param>
          <xsl:with-param name="dir">
            <xsl:choose>
              <xsl:when test="$a_doc/align:language[@lnum='L2']/@dir"><xsl:value-of select="$a_doc/align:language[@lnum='L2']/@dir"/></xsl:when>
              <xsl:otherwise><xsl:value-of select="$e_l2dir"/></xsl:otherwise>
            </xsl:choose>
          </xsl:with-param>
          
        </xsl:call-template>
    </svg:svg>
    
  </xsl:template>

  <xsl:template name="svg-to-xml">
    <xsl:param name="a_sent"/>
    <xsl:message><xsl:copy-of select="$a_sent"/></xsl:message>
    <xsl:choose>
      <xsl:when test="$e_wrapXml">
        <xsl:variable name="lang1" select="$a_sent/svg:g[@lnum='L1']/@xml:lang"/>
        <xsl:variable name="lang2" select="$a_sent/svg:g[@lnum='L2']/@xml:lang"/>
        <xsl:variable name="dir1" select="$a_sent/svg:g[@lnum='L1']/@direction"/>
        <xsl:variable name="dir2" select="$a_sent/svg:g[@lnum='L2']/@direction"/>
        
        <aligned-text xmlns="http://alpheios.net/namespaces/aligned-text">
          <language lnum="L1" xml:lang="{$lang1}" dir="{$dir1}"/>
          <language lnum="L2" xml:lang="{$lang2}" dir="{$dir2}"/>
          <sentence xmlns="http://alpheios.net/namespaces/aligned-text">
            <xsl:copy-of select="$a_sent/@document_id"/>
            <xsl:copy-of select="$a_sent/align:desc/*"/>
            <xsl:call-template name="svg_to_sentence">
              <xsl:with-param name="a_sent" select="$a_sent"/>
              <xsl:with-param name="lang" select="'L1'"/>
            </xsl:call-template>
            <xsl:call-template name="svg_to_sentence">
              <xsl:with-param name="a_sent" select="$a_sent"/>
              <xsl:with-param name="lang" select="'L2'"/>
            </xsl:call-template>
          </sentence>
        </aligned-text>
      </xsl:when>
      <xsl:otherwise>
        <sentence xmlns="http://alpheios.net/namespaces/aligned-text">
          <xsl:copy-of select="$a_sent/align:desc/*"/>
          <xsl:copy-of select="$a_sent/desc/*"/>
          <xsl:call-template name="svg_to_sentence">
            <xsl:with-param name="a_sent" select="$a_sent"/>
            <xsl:with-param name="lang" select="'L1'"/>
          </xsl:call-template>
          <xsl:call-template name="svg_to_sentence">
            <xsl:with-param name="a_sent" select="$a_sent"/>
            <xsl:with-param name="lang" select="'L2'"/>
          </xsl:call-template>
        </sentence>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template name="svg_to_sentence">
    <xsl:param name="a_sent"/>
    <xsl:param name="lang"/>
    <xsl:element name="wds" namespace="http://alpheios.net/namespaces/aligned-text">
      <xsl:attribute name="lnum"><xsl:value-of select="$lang"/></xsl:attribute>
      <xsl:copy-of select="$a_sent/svg:g[contains(@class,$lang)]/align:desc/*"/>
      <xsl:for-each select="$a_sent/svg:g[contains(@class,$lang)]//svg:g[@class='word']">
        <xsl:variable name="word" select="."/>
        <xsl:element name="w" namespace="http://alpheios.net/namespaces/aligned-text">
          <xsl:attribute name="n"><xsl:value-of select="substring-after($word/@id,':')"/></xsl:attribute>
          <xsl:element name="text" namespace="http://alpheios.net/namespaces/aligned-text">
            <xsl:choose>
              <xsl:when test="$word/svg:text/@form">
                <xsl:value-of select="$word/svg:text/@form"/>
              </xsl:when>
              <xsl:otherwise><xsl:value-of select="$word/svg:text/text()"/></xsl:otherwise>
            </xsl:choose>
          </xsl:element>
          <xsl:if test="$word/@xlink:title">
            <xsl:element name="comment" namespace="http://alpheios.net/namespaces/aligned-text">
              <xsl:attribute name="class">mark</xsl:attribute>
              <xsl:value-of select="$word/@xlink:title"/>
            </xsl:element>
          </xsl:if>
          <xsl:copy-of select="$word/align:desc/*"/>
          <xsl:variable name="refs" select="$word/svg:g/svg:text[@idref]"/>
          <xsl:if test="$refs">
            <xsl:element name="refs" namespace="http://alpheios.net/namespaces/aligned-text">
              <xsl:attribute name="nrefs">
                <xsl:for-each select="exsl:node-set($refs)">
                  <xsl:value-of select="substring-after(@idref,':')"/>
                  <xsl:if test="position() != last()"><xsl:text> </xsl:text></xsl:if>
                </xsl:for-each>
              </xsl:attribute>
            </xsl:element>
          </xsl:if>
        </xsl:element>
      </xsl:for-each>
    </xsl:element>
  </xsl:template>
  
  
  <xsl:template name="sentence_to_svg">
      <xsl:param name="lang"/>
      <xsl:param name="sentence"/>
      <xsl:param name="dir"/>
      <xsl:variable name="otherLang">
        <xsl:choose>
          <xsl:when test="$lang = 'L1'">L2</xsl:when>
          <xsl:otherwise>L1</xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <xsl:variable name="wordSet" select="$sentence/align:wds[@lnum = $lang]"/>
      <xsl:variable name="otherWords" select="$sentence/align:wds[@lnum = $otherLang]/align:w"/>
      <xsl:variable name="direction" select="$dir"/>
      <xsl:variable name="tbrefs">
        <xsl:if test="$lang='L1'">
          <xsl:copy-of select="$sentence/../align:comment[@class='tbref']/align:match[@as=$sentence/@id]"/>
        </xsl:if>
      </xsl:variable>
      <xsl:if test="$sentence/align:comment">
        <desc xmlns="http://alpheios.net/namespaces/aligned-text">
          <xsl:copy-of select="$sentence/align:comment"/>
        </desc>
      </xsl:if>
      
      <xsl:element name="g">
        <xsl:attribute name="class">sentence <xsl:value-of select="$lang"/></xsl:attribute>
        <xsl:attribute name="lnum"><xsl:value-of select="$lang"/></xsl:attribute>
        <xsl:attribute name="document_id"><xsl:value-of select="$sentence/@document_id"/></xsl:attribute>
        <xsl:attribute name="direction"><xsl:value-of select="$direction"/></xsl:attribute>
        <xsl:attribute name="xml:lang"><xsl:value-of select="$sentence/../align:language[@lnum=$lang]/@xml:lang"/></xsl:attribute>
        <xsl:attribute name="xlink:title"><xsl:value-of select="exsl:node-set($wordSet)/align:comment[@class='uri']"/></xsl:attribute>
        <xsl:if test="exsl:node-set($wordSet)/align:comment">
          <desc xmlns="http://alpheios.net/namespaces/aligned-text">
            <xsl:copy-of select="exsl:node-set($wordSet)/align:comment"/>
          </desc>      
        </xsl:if>
        <xsl:for-each select="exsl:node-set($wordSet)/align:w">
          <xsl:variable name="i" select="position()"/>
          <xsl:variable name="refs">
            <xsl:call-template name="tokenize">
              <xsl:with-param name="remaining" select="align:refs/@nrefs"/>
              <xsl:with-param name="separator" select="' '"/>
            </xsl:call-template>
          </xsl:variable>
          <xsl:variable name="tbref" select="exsl:node-set($tbrefs)/*[@aw &lt;= $i][last()]"/>
          <xsl:variable name="free">
            <xsl:if test="count(exsl:node-set($refs)/*) = 0">free</xsl:if>
          </xsl:variable>
          <xsl:variable name="numRefs">
            <xsl:choose>
              <!-- if @len exists, there is 1-to-1 relation -->
              <xsl:when test="$tbref/@len"><xsl:value-of select="'1'"/></xsl:when>
              <!-- if @lena=1, there is 1-to-many relation -->
              <xsl:when test="$tbref/@lena = '1'"><xsl:value-of select="$tbref/@lent"/></xsl:when> 
              <!-- otherwise, don't know what to do -->
              <xsl:otherwise><xsl:value-of select="'0'"/></xsl:otherwise>
            </xsl:choose>
          </xsl:variable>
          <xsl:element name="g">
            <xsl:attribute name="class">word</xsl:attribute>
            <xsl:attribute name="id"><xsl:value-of select="concat($lang,':',@n)"/></xsl:attribute>
            <xsl:if test="$numRefs &gt; 0">
              <xsl:attribute name="tbrefs">
                <xsl:call-template name="add_tb_ref">
                  <xsl:with-param name="i" select="$i"/>
                  <xsl:with-param name="max" select="$numRefs - 1"/>
                  <xsl:with-param name="tbref" select="$tbref"/>
                </xsl:call-template>
              </xsl:attribute>
            </xsl:if>
            <xsl:if test="align:mark">
              <xsl:attribute name="xlink:title"><xsl:value-of select="align:mark/text()"/></xsl:attribute>
            </xsl:if>
            <xsl:if test="align:comment[@class='mark']">
              <xsl:attribute name="xlink:title"><xsl:value-of select="align:comment[@class = 'mark']/text()"/></xsl:attribute>
            </xsl:if>
            <!-- preserve any word-level comments that aren't marks -->
            <xsl:if test="align:comment[@class != 'mark']">
              <desc xmlns="http://alpheios.net/namespaces/aligned-text">
                <xsl:copy-of select="align:comment[@class != 'mark']"/>
              </desc>
            </xsl:if>
            <!-- highlighting rectangle -->
            <xsl:element name="rect">
              <xsl:attribute name="class">headwd-bg</xsl:attribute> 
            </xsl:element>
            <!-- the word itself -->
            <xsl:element name="text">
                <xsl:attribute name="class">headwd <xsl:value-of select="$free"/></xsl:attribute>
                <xsl:value-of select="align:text/text()"/>
            </xsl:element>
            <!-- aligned words -->
            <xsl:element name="g">
              <xsl:attribute name="class">alignment alpheios-ignore</xsl:attribute>
              <xsl:for-each select="exsl:node-set($refs)/*">
                <xsl:variable name="ref" select="."/>
                <xsl:element name="text">
                  <xsl:attribute name="idref"><xsl:value-of select="concat($otherLang,':',.)"/></xsl:attribute>
                  <xsl:copy-of select="$otherWords[@n=$ref]/align:text/text()"/>
                </xsl:element>
              </xsl:for-each>
            </xsl:element>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
  </xsl:template>
  
  <xsl:template name="add_tb_ref">
    <xsl:param name="i"/>
    <xsl:param name="this" select="'0'"/>
    <xsl:param name="max"></xsl:param>
    <xsl:param name="tbref"/>
    <xsl:value-of select="concat($tbref/@ts,'-',$tbref/@tw + ($i - $tbref/@aw) + $this ,' ')"/>
    <xsl:choose>
      <xsl:when test="$this != $max">
        <xsl:call-template name="add_tb_ref">
          <xsl:with-param name="this" select="$this+1"/>
          <xsl:with-param name="max" select="$max"/>
          <xsl:with-param name="tbref" select="$tbref"/>
        </xsl:call-template>
      </xsl:when>
    </xsl:choose>
    
  </xsl:template>
  
  <xsl:template name="tokenize">
    <xsl:param name="remaining"/>
    <xsl:param name="separator"/>
    <xsl:choose>
      <xsl:when test="contains($remaining,$separator)">
        <ref><xsl:value-of select="substring-before($remaining,$separator)"/></ref>
        <xsl:call-template name="tokenize">
          <xsl:with-param name="remaining" select="substring-after($remaining,$separator)"/>
          <xsl:with-param name="separator" select="$separator"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$remaining">
        <ref><xsl:value-of select="$remaining"/></ref>
      </xsl:when>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
