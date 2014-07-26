/**
 * @fileoverview alph-align-enter-ext - enter sentence for external back-end
 *
 *
 * Copyright 2014 The Alpheios Project, Ltd.
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
var s_params = {};

$(document).ready(function() {

    // try to load text from the supplied uri
    $("input[name='l1_uri']").change(function() { load_text('l1'); });
    $("input[name='l2_uri']").change(function() { load_text('l2'); });

    // get parameters from call
    var callParams = location.search.substr(1).split("&");
    for (var i in callParams)
    {
        var pair = callParams[i].split(/=/);
        if (pair.length == 2) {
            s_params[pair[0]] = pair[1];
        }
        // right now the only parameter we support in the query string to the form is the l1 and l2 uri
        if (s_params['l1_uri']) {
            $("input[name='l1_uri']").val(decodeURIComponent(s_params['l1_uri']));
            load_text('l1');
        }
        if (s_params['l2_uri']) {
            $("input[name='l2_uri']").val(decodeURIComponent(s_params['l2_uri']));
            load_text('l2');
        }
    }
});

/**
 * Handler for the text_uri input to try to load the text
 */
function load_text(lnum) {
    $("textarea[name='l1text']").attr("placeholder","loading...");
    var uri = $("input[name='" + lnum + "_uri']").val();
    if (uri.match(/^http/)) {
        $.ajax({
            url: uri,
            type: 'GET',
            async: true,
            success: function(a_data,a_status){
                var content_type = a_data.contentType;
                var content = a_data;
                if (content_type == 'application/xml' || content_type == 'text/xml') {
                    try {
                        content = new XMLSerializer().serializeToString(a_data);
                        // TODO mime_type and xml should really be merged into one input param
                        // separate for now because the different tokenization services require
                        // different value types
                        $("input[name='" + lnum + "mime_type']").val("text/xml");
                        $("input[name='" + lnum + "xml']").val("true");
                    } catch (a_e) {
                         $("textarea[name='" + lnum + "text']").attr("placeholder","Unable to process text: " + a_e);
                    }
                } else {
                    // TODO could eventually suppport other input formats
                    $("input[name='" + lnum + "mime_type']").val("text/plain");
                    $("input[name='" + lnum + "xml']").val("false");
                }
                $("textarea[name='" + lnum + "text']").val(content);
                detect_language();
            },
            error: function(a_req,a_text,a_error) {
               $("textarea[name='" + lnum + "text']").attr("placeholder","ERROR loading " + uri  +" : " + a_text);
            }
        });
    }
}

/**
 * Submit handler for the text entry form
 */
function EnterSentence() {
    var l1 = $('select[name="select_l1"]');
    var l2 = $('select[name="select_l2"]')
    if (l1.val() == 'other' || $('input[name="other_l1"]').val()) {
        $('input[name="l1"]').val($('input[name="other_l1"]').val())
    } else {
        $('input[name="l1"]').val(l1.val())
    }
    if (l2.val() == 'other' || $('input[name="other_l2"]').val()) {
        $('input[name="l2"]').val($('input[name="other_l2"]').val())
    }
    else {
       $('input[name="l2"]').val(l2.val())
    } 
    if ($('input[name="l1"]').val() == '' || $('input[name="l2"]').val()  == '') {
        alert('You must specify a valid language code for both sentences.');
        return false;
    } 
    
     // get input form and URL to use to make template
    var form = $("form[name='input-form']", document);
    var url = $("meta[name='templateurl']", document).attr("content");
    var l1dir = $("#l1-dir-buttons input:checked",form).val();
    var l2dir = $("#l2-dir-buttons input:checked",form).val();
    var l1=  $('input[name="l1"]').val();
    var l2 = $('input[name="l2"]').val();
    var l1uri =  $('input[name="l1uri"]').val();
    var l2uri = $('input[name="l2uri"]').val();
        var data = '<data uri="urn:cite:perseus:align" name="' + $("input[name='docname']").val() + '">' + 
        '<l1text uri="' + l1uri + '">' + $('textarea[name="l1text"]',form).val() + '</l1text>' + 
        '<l2text uri="' + l2uri + '">' + $('textarea[name="l2text"]',form).val() + '</l2text>' +
        '<language lnum="L1" xml:lang="' + l1 + '" dir="' + l1dir + '"/>' +
        '<language lnum="L2" xml:lang="' + l2 + '" dir="' + l2dir + '"/>' +
        '</data>';
    // send synchronous request to add
    var req = new XMLHttpRequest();
    req.open("POST", url, false);
    req.setRequestHeader("Content-Type", "application/xml");
    req.send(data);
    var root = $(req.responseXML.documentElement);
    if ((req.status != 200) || root.is("error"))
    {
        var msg = root.is("error") ? root.text() :
                                     "Error creating sentence:" +
                                       (req.responseText ? req.responseText :
                                                           req.statusText);
        alert(msg);
        throw(msg);
    }
    return put_data(req.responseXML);
}


/**
 * POST the data to the backend storage service
 */
function put_data(data) {
    // a bit of a hack -- may need to ping the api get the cookie
    // not actually needed at runtime when we come from there
    // but was useful for testing
    var pingUrl = $("meta[name='pingurl']").attr("content");
    if (pingUrl) {
        var req = new XMLHttpRequest();
        req.open("GET", pingUrl, false);
        req.send(null);
    }

    // get the url for the post
    var url = $("meta[name='url']", document).attr("content");
    var resp;
    try {
        // another hack to make AlphEdit think we've done something
        // so that I can reuse the AlphEdit.putContents code
        AlphEdit.pushHistory(["create"],null);
        // send synchronous request to add
        resp = AlphEdit.putContents(data, url, '' , '');
    } catch (a_e) {
        alert(a_e);
        return false;
    }

    // save values from return in submit form
    var form = $("form[name='submit-form']", document);
    var lang = $("#lang-buttons input[name='lang']:checked").val();
    var dir = $("#dir-buttons input[name='direction']:checked").val();
    $("input[name='inputtext']",form).attr("dir",dir);

    var doc = $(resp).text();
    var s = 1;
    $("input[name='doc']", form).attr("value",doc);
    $("input[name='s']", form).attr("value", s);
    return true;
}

/**
 * Start the read of the uploaded file
 * HTML5 processing of input type=file
 */
function startRead(evt) {
    var file = document.getElementById("file").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = fileLoaded;
    }
}

/**
 * On finish reading of a file, put it to the storage service and
 * submit the form
 */
function fileLoaded(evt) {
    var xml = (new DOMParser()).parseFromString(evt.target.result,"text/xml");
    var annotation = null;
    try {
        // TODO could really switch this to a jquery ajax call -- it's just cut and paste code
        var transformUrl = $("meta[name='oa_wrapper_transform']").attr("content");
        var transformProc = loadStylesheet(transformUrl);
        transformProc.setParameter(null,"e_datetime",new Date().toDateString());
        annotation = transformProc.transformToDocument(xml);
    } catch (a_e) {
        alert(a_e);
        return false;
    }
    if (put_data(annotation)) {
        $("form[name='submit-form']", document).submit();
    }
}

/**
 * Send an synchronous request to load a stylesheet
 * @param a_url the url of the styleshset
 * @return an XSLTProcessor with the stylesheet imported
 * @throw an error upon failure to load the stylesheet
 */
function loadStylesheet(a_url) {
    var req = new XMLHttpRequest();
    if (req.overrideMimeType) {
        req.overrideMimeType('text/xml');
    }
    req.open("GET", a_url, false);
    req.send(null);
    if (req.status != 200)
    {
        var msg = "Can't get transform at " + a_url;
        alert(msg);
        throw(msg);
    }
    var transformDoc = req.responseXML;
    var transformProc= new XSLTProcessor();
    transformProc.importStylesheet(transformDoc);
    return transformProc;
}

/**
 * Click handler responds to a selection of the text direction input item
 * to set the text direction of the corresponding text entry box
 */
function SetTextDir() {
   var l = $(this).attr('name').substr(1,1);
   var dir = $(this).val();
   $("textarea[name='l" + l + "text']").attr("dir",dir);
}
