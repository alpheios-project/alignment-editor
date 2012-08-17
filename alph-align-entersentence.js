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
    } else {
        return true;
    }
}