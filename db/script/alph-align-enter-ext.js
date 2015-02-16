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
var wait_retries = 0;
var max_wait_retries = 20;
var wait_time = 2000;

$(document).ready(function() {

    // try to load text from the supplied uri
    $("input[name='l1uri']").change(function() { load_text('l1'); });
    $("input[name='l2uri']").change(function() { load_text('l2'); });

    // get parameters from call
    var callParams = location.search.substr(1).split("&");
    for (var i in callParams)
    {
        var pair = callParams[i].split(/=/);
        if (pair.length == 2) {
            s_params[pair[0]] = pair[1];
        }
        // right now the only parameter we support in the query string to the form is the l1 and l2 uri
        if (s_params['l1uri']) {
            $("input[name='l1uri']").val(decodeURIComponent(s_params['l1uri']));
            load_text('l1');
        }
        if (s_params['l2uri']) {
            $("input[name='l2uri']").val(decodeURIComponent(s_params['l2uri']));
            load_text('l2');
        }
    }

    // retrieve the l1 text
    $("#l1uri").ctsTypeahead({
      "endpoint" : $("meta[name='cts_repos_url']").attr("content"),
      "version" : 3,
      "inventories": {
        "annotsrc" : "Perseids Sources"
       },
      "retrieve" : "#l1text"
    });

    //  transform l1 xml to plain text
    $("#l1text").ctsXSLT("cts.passage_to_text", {
        "endpoint" : $("meta[name='textizing_service']").attr("data-transform"),
        "xml" : $("#l1text"),
        "driver" : { },
        "trigger" : "language-detected"
    });
  

    // set the l1 tokenization options
    $("#advanced-options-l1").ctsService("llt.tokenizer", {
        "endpoint" : "http://services2.perseids.org/llt/segtok",
        "driver" : {
            "text" : $("#l1text")
        },
        "trigger" : "llt-tokenize",
        "callback" : function(data) {
            $("#l1text").val(data);
        },
        "show" : "toggle-llt-tokenizer",
        "css" : {
            "field-container" : ["row"],
            "field-label" : ["columns", "large-6", "small-6"],
            "field-input-container" : ["columns", "large-6", "small-6"]
        },
        "names" : {
            "xml" : "l1isxml"
        }
    }); 

    // transform l1 tokenized output to alignment template
    $("#advanced-options-l1").ctsXSLT("llt.segtok_to_align", {
        "endpoint" : $("meta[name='tokenization_service']").attr("data-transform"),
        "xml" : $("#l1text"),
        "driver" : {
            "e_lang" : "input[name='lang']:checked",
            "e_dir" : "input[name='direction']:checked",
            "e_docuri" : "input[name='text_uri']",
            "e_appuri" : "input[name='appuri']",
            "e_includepunc" : function() {
              return $("input#l1includepunc").is(":checked");
            }
        },
        "trigger" : "llt-transform",
        "callback" : function(data) {
            $("#l1text").val(data);
            $("#l1text").attr("data-tokenized",true);
            return make_data();
        },
        "css" : {
            "field-container" : ["row"],
            "field-label" : ["columns", "large-6", "small-6"],
            "field-input-container" : ["columns", "large-6", "small-6"]
        }
    });

    // retrieve the l2 text
    $("#l2uri").ctsTypeahead({
      "endpoint" : $("meta[name='cts_repos_url']").attr("content"),
      "version" : 3,
      "inventories": {
        "annotsrc" : "Perseids Sources"
       },
      "retrieve" : "#l2text"
   });

    //  transform l2 xml to plain text
    $("#l2uri").ctsXSLT("cts.passage_to_text", {
        "endpoint" : $("meta[name='textizing_service']").attr("data-transform"),
        "xml" : $("#l1text"),
        "driver" : { },
        "trigger" : "language-detected"
    });



    //UI
    $("#advanced-options-l1-toggle").click(function(){$("#advanced-options-l1").toggle();});

    // set the l2 tokenization options
    $("#advanced-options-l2").ctsService("llt.tokenizer", {
        "endpoint" : "http://services2.perseids.org/llt/segtok",
        "driver" : {
            "text" : $("#l1text")
        },
        "trigger" : "llt-tokenize",
        "callback" : function(data) {
            $("#l1text").val(data);
        },
        "show" : "toggle-llt-tokenizer",
        "css" : {
            "field-container" : ["row"],
            "field-label" : ["columns", "large-6", "small-6"],
            "field-input-container" : ["columns", "large-6", "small-6"]
        },
        "names" : {
            "xml" : "l1isxml"
        }
    }); 

    //Trigger queue
    $(".advanced-options").on("cts-service:llt.tokenizer:done", function() {
        $(this).trigger("llt-transform");
    });
    $("textarea").blur(detect_language_and_type);
    $("#l1uri").on("cts-passage:retrieved",
       function() {
         debugger;
         detect_language_and_type();
         $(this).trigger("language-detected");
    }
    );

    //Error handling
    $("textarea[name='l1text']").on("cts-passage:passage-error", function() {
        CTSError("The passage does not exist",'l1');
    });
    $("textarea[name='l1text']").on("cts-passage:retrieving-error", function() {
        CTSError("Unable to contact the server. Please try again.",'l1');
    });
    $("textarea[name='l2text']").on("cts-passage:passage-error", function() {
        CTSError("The passage does not exist",'#l1text','l1');
    });
    $("textarea[name='l2text']").on("cts-passage:retrieving-error", function() {
        CTSError("Unable to contact the server. Please try again.",'l1');
    });


});

/**
 * Handler for the text_uri input to try to load the text
 */
function load_text(lnum) {
    var uri = $("input[name='" + lnum + "uri']").val();
    if (! uri.match(/^http/)) {
       /** allow non-url identifiers to just pass through **/
        return;
    }
    $("textarea[name='" + lnum + "text']").attr("placeholder","loading...");
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
    // trigger the tokenization
    $(".advanced-options").trigger("llt-tokenize");
}


/**
 * POST the data to the backend storage service
 */
function make_data() {
  // we need to wait for both language text chunks to be tokenized
  // but we don't want to wait forever...
  while (wait_tries++ < max_wait_retries) {
    if (! ($("l1text").attr("tokenized") && $("l2text").attr("tokenized"))) {
      console.log("Waiting for tokenization...(" + wait_tries + ")");
      timeout(wait_time);
    }
  }
  if (! ($("l1text").attr("tokenized") && $("l2text").attr("tokenized"))) {
    alert("Timed out waiting for tokenization to complete.");
    return;
  }

  // okay now we merge the two templates
  var l1 = (new DOMParser()).parseFromString($("#l1text").val());
  var l2 = (new DOMParser()).parseFromString($("#l2text").val());
  
  // we merge language and wds from l2 into l1
  var l2lang = $("language",$l2).clone();
  var l2wds = $("language",$l2).clone();

  $("language",l1).after(l2lang);
  $("wds",l1).after(l2wds);
  put_data(l1);
}

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

/**
 * Handler for inputtext change to detect the language and mimetype of the text
 */
function detect_language_and_type(a_event) {
    var textarea = a_event.currentTarget;
    var lnum = $(textarea).attr('data-lnum');
    
    CTSError(null,lnum);
    // first detect language
    detect_language(lnum);

    // now try to detect type
    var text = $(textarea).val().trim();
    var is_plain_text = true;
    var looks_like_xml = text.match(/<(.*?)>/);
    if (looks_like_xml) {
      try {
        var xml = (new DOMParser()).parseFromString(text,"text/xml");
        if ($("parsererror",xml).length == 0) {
          is_plain_text = false;
        }
      } catch(a_e) {
         // if this fails assume plain text
         // otherwise assume xml which might not be right because it could
         // contain a parse error but there isn't a good cross-browser way 
         // to detect this for sure
         is_plain_text = true;
      }
    }
    $("input[name='"+lnum+"isxml']")[0].checked = !is_plain_text;
}

/**
 * Handler for inputtext change to detect the language of hte text 
 */
function detect_language(a_lnum) {
    // TODO should maybe use a general purpose lib for this
    // these character ranges come from the alpheios beta-uni-utils and arabic-uni-utils transforms
    var text = $("#"+a_lnum+"text").val();
    if (text.match(/[\u1F8D\u1F0D\u1F8B\u1F0B\u1F8F\u1F0F\u1F89\u1F09\u1F8C\u1F0C\u1F8A\u1F0A\u1F8E\u1F0E\u1F88\u1F08\u0386\u1FBA\u1FBC\u1FB9\u1FB8\u0391\u1F85\u1F05\u1F83\u1F03\u1F87\u1F07\u1F81\u1F01\u1F84\u1F04\u1F82\u1F02\u1F86\u1F06\u1F80\u1F00\u1FB4\u03AC\u1FB2\u1F70\u1FB7\u1FB6\u1FB3\u1FB1\u1FB0\u03B1\u0392\u03B2\u039E\u03BE\u0394\u03B4\u1F1D\u1F1B\u1F19\u1F1C\u1F1A\u1F18\u0388\u1FC8\u0395\u1F15\u1F13\u1F11\u1F14\u1F12\u1F10\u03AD\u1F72\u03B5\u03A6\u03C6\u0393\u03B3\u1F9D\u1F2D\u1F9B\u1F2B\u1F9F\u1F2F\u1F99\u1F29\u1F9C\u1F2C\u1F9A\u1F2A\u1F9E\u1F2E\u1F98\u1F28\u0389\u1FCA\u1FCC\u0397\u1F95\u1F25\u1F93\u1F23\u1F97\u1F27\u1F91\u1F21\u1F94\u1F24\u1F92\u1F22\u1F96\u1F26\u1F90\u1F20\u1FC4\u03AE\u1FC2\u1F74\u1FC7\u1FC6\u1FC3\u03B7\u1F3D\u1F3B\u1F3F\u1F39\u1F3C\u1F3A\u1F3E\u1F38\u03AA\u038A\u1FDA\u1FD9\u1FD8\u0399\u1F35\u1F33\u1F37\u1F31\u1F34\u1F32\u1F36\u1F30\u0390\u1FD2\u1FD7\u03CA\u03AF\u1F76\u1FD6\u1FD1\u1FD0\u03B9\u039A\u03BA\u039B\u03BB\u039C\u03BC\u039D\u03BD\u1F4D\u1F4B\u1F49\u1F4C\u1F4A\u1F48\u038C\u1FF8\u039F\u1F45\u1F43\u1F41\u1F44\u1F42\u1F40\u03CC\u1F78\u03BF\u03A0\u03C0\u0398\u03B8\u1FEC\u03A1\u1FE5\u1FE4\u03C1\u03A3\u03C3\u03A4\u03C4\u1F5D\u1F5B\u1F5F\u1F59\u03AB\u038E\u1FEA\u1FE9\u1FE8\u03A5\u1F55\u1F53\u1F57\u1F51\u1F54\u1F52\u1F56\u1F50\u03B0\u1FE2\u1FE7\u03CB\u03CD\u1F7A\u1FE6\u1FE1\u1FE0\u03C5\u03DC\u03DD\u1FAD\u1F6D\u1FAB\u1F6B\u1FAF\u1F6F\u1FA9\u1F69\u1FAC\u1F6C\u1FAA\u1F6A\u1FAE\u1F6E\u1FA8\u1F68\u038F\u1FFA\u1FFC\u03A9\u1FA5\u1F65\u1FA3\u1F63\u1FA7\u1F67\u1FA1\u1F61\u1FA4\u1F64\u1FA2\u1F62\u1FA6\u1F66\u1FA0\u1F60\u1FF4\u03CE\u1FF2\u1F7C\u1FF7\u1FF6\u1FF3\u03C9\u03A7\u03C7\u03A8\u03C8\u0396\u03B6\u1FDE\u0345\u1FDE\u1FDD\u0345\u1FDD\u1FDF\u0345\u1FDF\u02BD\u0345\u02BD\u1FCE\u0345\u1FCE\u1FCD\u0345\u1FCD\u1FCF\u0345\u1FCF\u02BC\u0345\u02BC\u1FEE\u1FED\u1FC1\u00A8\u00B4\u0345\u00B4\u0060\u0345\u0060\u1FC0\u0345\u1FC0\u1FBE\u00AF\u02D8\u02BC\u1FBB\u1F71\u1FC9\u1F73\u1FCB\u1F75\u1FDB\u1F77\u1FD3\u1FF9\u1F79\u03C2\u1FEB\u1F7B\u1FE3\u1FFB\u1F7D\u03C3\u03C2\u00B7]/)) {
       $("#select_"+a_lnum).val('grc');
       $("#"+a_lnum+"-dir-ltr").get(0).checked = true;
    } else if (text.match(/[\u0621\u0622\u0623\u0623\u0624\u0624\u0625\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u0640\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0670\u0671\u067E\u0686\u06A4\u06AF]/)) {
       $("#select_"+a_lnum).val('ara');
       $("#"+a_lnum+"-dir-rtl").get(0).checked = true;
    } else {
       $("#"+a_lnum+"-dir-ltr").get(0).checked = true;
    }
}

/**
 *  Trigger an error message. If message is empty, remove the trigger
 *
 */
function CTSError(error,a_lnum) {
    var $input = $("#"+a_lnum+"text"),
        $error = $("#"+a_lnum+"texterror");
    if(error == null || typeof error === "undefined") {
        $input.removeClass("error");
        $error.hide();
    } else {

        $input.addClass("error");
        $error.text(error).show();
    }

}

