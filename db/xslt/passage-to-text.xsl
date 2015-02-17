<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="2.0"
    xmlns:cts="http://chs.harvard.edu/xmlns/cts3"
    xmlns:cts-x="http://alpheios.net/namespaces/cts-x"
    xmlns:tei="http://www.tei-c.org/ns/1.0" 
    exclude-result-prefixes="tei cts-x cts">
    
    <xsl:output method="xml" encoding="UTF-8"/>
    
    <xsl:variable name="nontext">
        <nontext xml:lang="grc"> “”—&quot;‘’,.:;&#x0387;&#x00B7;?!\[\]\{\}\-</nontext>
        <nontext xml:lang="greek"> “”—&quot;‘’,.:;&#x0387;&#x00B7;?!\[\]\{\}\-</nontext>
        <nontext xml:lang="ara"> “”—&quot;‘’,.:;?!\[\]\{\}\-&#x060C;&#x060D;</nontext>
        <nontext xml:lang="*"> “”—&quot;‘’,.:;&#x0387;&#x00B7;?!\[\]()\{\}\-</nontext>
    </xsl:variable>
    
    <xsl:template match="/">
        <xsl:variable name="text"><xsl:apply-templates select="//tei:text//text()[not(ancestor::tei:note) and not(ancestor::tei:bibl)]"/></xsl:variable>
        <text><xsl:value-of select="normalize-space($text)"/></text>
    </xsl:template>
	
	<xsl:template match="text()">
		<xsl:copy/>
	</xsl:template>
    	    
    <xsl:template match="*"/>
</xsl:stylesheet>