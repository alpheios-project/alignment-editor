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
    
     // get input form and URL to use to add sentence
    var form = $("form[name='input-form']", document);
    var url = $("meta[name='url']", document).attr("content");
    var l1dir = $("#l1-dir-buttons input:checked",form).val();
    var l2dir = $("#l2-dir-buttons input:checked",form).val();

    var data = "<data>" + 
        "<l1text>" + $('textarea[name="l1text"]',form).val() + '</l1text><l2text>' + $('textarea[name="l2text"]',form).val() + '</l2text>' +
        '<language lnum="L1" xml:lang="' + $('input[name="l1"]').val() + '" dir="' + l1dir + '"/>' +
        '<language lnum="L2" xml:lang="' + $('input[name="l2"]').val() + '" dir="' + l2dir + '"/>' +
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
    // save values from return in submit form
    form = $("form[name='submit-form']", document);
    $("input[name='doc']", form).attr("value", root.attr("doc"));
    $("input[name='s']", form).attr("value", root.attr("s"));
    return true;
}