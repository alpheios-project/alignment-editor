<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:oa="http://www.w3.org/ns/oa#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:prov="http://www.w3.org/ns/prov#"
    xmlns:cnt="http://www.w3.org/2008/content#"
    version="1.0">
    
    <!-- this template transforms the output of a tokenization of text/plain
         text by the llt segtok service into a treebank annotation of the 
         specififed format. the annotation is then wrapped as in an OA container.
         
         parameters 
            e_docuri - uri of the document identifier that is the target of the 
                       annotation (i.e. the source of the tokenized text). If it contains a 
                       cts urn with a passage, the passage component will be extracted and 
                       used as the subdoc identifier for all the sentences
            e_format - format you want to use for the treebank file (e.g. 'aldt')
            e_lang   - language of the treebank file (e.g. 'grc','lat', etc.)
            e_agenturi - uri for the software agent that created the tokenization
            e_datetime - the datetime of the serialization
            e_collection - the urn of the CITE collection which the annotation is/will be a member of
    -->
    
    <xsl:param name="e_lang" select="'lat'"/>
    <xsl:param name="e_dir" select="'ltr'"/>
    <xsl:param name="e_docuri" select="'urn:cts:latinLit:tg.work.edition:1.1'"/>
    <xsl:param name="e_agenturi" select="'http://services.perseids.org/llt/segtok'"/>
    <xsl:param name="e_lnum"/>
    <xsl:param name="e_appuri"/>
    <xsl:param name="e_datetime"/>
    <xsl:param name="e_title"/>
    <xsl:param name="e_includepunc" select="true()"/>
    <xsl:param name="e_mergesentences" select="true()"/>
    <xsl:param name="e_collection" select="'urn:cite:perseus:align'"/>
    
    <xsl:output indent="yes"></xsl:output>
    <xsl:key name="segments" match="tei:w|tei:pc|w|pc" use="@s_n" />
    
    <xsl:template match="/">
        
        <!-- a hack to get a uuid for the body -->
        <xsl:variable name="bodyid" select="concat('urn:uuid',generate-id(//llt-segtok))"/>
        <xsl:element name="RDF" namespace="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <xsl:element name="Annotation" namespace="http://www.w3.org/ns/oa#">
                <xsl:element name="memberOf" xmlns="http://purl.org/dc/dcam/">
                    <xsl:attribute name="rdf:resource"><xsl:value-of select="$e_collection"/></xsl:attribute>
                </xsl:element>
                <xsl:element name="hasTarget" namespace="http://www.w3.org/ns/oa#">
                    <xsl:attribute name="rdf:resource"><xsl:value-of select="$e_docuri"/></xsl:attribute>
                </xsl:element>
                <xsl:element name="hasBody" namespace="http://www.w3.org/ns/oa#">
                    <xsl:attribute name="rdf:resource"><xsl:value-of select="$bodyid"/></xsl:attribute>
                </xsl:element>
                <!-- TODO this isn't the best motivation  we are going to need to subclass -->
                <xsl:element name="isMotivatedBy" namespace="http://www.w3.org/ns/oa#">
                    <xsl:attribute name="rdf:resource">oa:linking</xsl:attribute>
                </xsl:element>
                <xsl:element name="serializedBy" namespace="http://www.w3.org/ns/oa#">
                    <xsl:element name="SoftwareAgent" namespace="http://www.w3.org/ns/prov#">
                        <xsl:attribute name="rdf:about"><xsl:value-of select="$e_agenturi"/></xsl:attribute>
                    </xsl:element>
                </xsl:element>
                <xsl:element name="serializedAt" namespace="http://www.w3.org/ns/oa#"><xsl:value-of select="$e_datetime"/></xsl:element>
            </xsl:element>
            <xsl:element name="ContentAsXML" namespace="http://www.w3.org/ns/oa#">
                <xsl:attribute name="rdf:about"><xsl:value-of select="$bodyid"/></xsl:attribute>
                <xsl:element name="cnt:rest">
                    <xsl:attribute name="rdf:parseType">Literal</xsl:attribute>
                    <aligned-text xmlns="http://alpheios.net/namespaces/aligned-text">
                        <language lnum="{$e_lnum}" xml:lang="{$e_lang}" dir="{$e_dir}"/>
                        <xsl:if test="$e_title != ''">
                            <comment class="title"><xsl:value-of select="$e_title"/></comment>    
                        </xsl:if>
                            <xsl:apply-templates/>
                    </aligned-text>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="llt-segtok">
        <xsl:variable name="subdoc">
            <xsl:choose>
                <xsl:when test="contains($e_docuri,'urn:cts:')">
                    <!-- extract the passage component it's the substring after the 4th ':' -->
                    <!-- but note this breaks if individual parts of the urn are namespaced separately from the whole -->
                    <xsl:value-of select="substring-after(substring-after(substring-after($e_docuri,'urn:cts:'),':'),':')"/>
                </xsl:when>
                <xsl:otherwise/>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="doc">
            <xsl:choose>
                <xsl:when test="contains($e_docuri,'urn:cts:') and $subdoc != ''">
                    <!-- extract the passage component it's the substring after the 4th ':' -->
                    <!-- but note this breaks if individual parts of the urn are namespaced separately from the whole -->
                    <xsl:value-of select="substring-before($e_docuri,concat(':',$subdoc))"/>
                </xsl:when>
                <xsl:otherwise><xsl:value-of select="$e_docuri"/></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="$e_mergesentences">
                <xsl:element name="sentence" namespace="http://alpheios.net/namespaces/aligned-text">
                    <xsl:attribute name="id"><xsl:value-of select="'1'"/></xsl:attribute>
                    <xsl:attribute name="document_id"><xsl:value-of select="$e_docuri"/></xsl:attribute>
                    <xsl:call-template name="make_bead">
                        <xsl:with-param name="num" select="'*'"/>
                    </xsl:call-template>
                </xsl:element>
            </xsl:when>
            <xsl:otherwise>
                <xsl:for-each select="//*[generate-id()=generate-id(key('segments',@s_n)[1])]">
                    <xsl:element name="sentence" namespace="http://alpheios.net/namespaces/aligned-text">
                      <xsl:attribute name="id"><xsl:value-of select="@s_n"/></xsl:attribute>
                      <xsl:attribute name="document_id"><xsl:value-of select="$e_docuri"/></xsl:attribute>
                      <xsl:call-template name="make_bead">
                          <xsl:with-param name="num" select="@s_n"/>
                      </xsl:call-template>
                    </xsl:element>
                </xsl:for-each>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="make_bead">
        <xsl:param name="num"/>
        <xsl:element name="wds" namespace="http://alpheios.net/namespaces/aligned-text">
            <xsl:attribute name="lnum"><xsl:value-of select="$e_lnum"/></xsl:attribute>
            <xsl:element name="comment" xmlns="http://alpheios.net/namespaces/aligned-text">
                <xsl:attribute name="class">uri</xsl:attribute>
                <xsl:value-of select="$e_docuri"/>
            </xsl:element>
            <xsl:choose>
                <xsl:when test="$num='*'">
                    <xsl:apply-templates select="//*[@s_n]"></xsl:apply-templates>
                </xsl:when>
                <xsl:otherwise><xsl:apply-templates select="//*[@s_n=$num]"></xsl:apply-templates></xsl:otherwise>
            </xsl:choose>
        </xsl:element>
    </xsl:template>
        
    <xsl:template match="tei:w|w">
        <xsl:element name="w" namespace="http://alpheios.net/namespaces/aligned-text">
            <xsl:attribute name="n"><xsl:value-of select="concat(@s_n,'-',@n)"/></xsl:attribute>
            <xsl:element name="text" namespace="http://alpheios.net/namespaces/aligned-text"><xsl:value-of select="."/></xsl:element>
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="tei:pc|pc">
        <xsl:if test="$e_includepunc">
            <xsl:element name="w" namespace="http://alpheios.net/namespaces/aligned-text">
                <xsl:attribute name="n"><xsl:value-of select="concat(@s_n,'-',@n)"/></xsl:attribute>
                <xsl:element name="text" namespace="http://alpheios.net/namespaces/aligned-text"><xsl:value-of select="."/></xsl:element>
            </xsl:element>
        </xsl:if>
    </xsl:template>
    
    <xsl:template match="@*"/>

    <xsl:template match="*"/>
    
</xsl:stylesheet>