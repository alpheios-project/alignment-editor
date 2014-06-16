# 2014-13-06

# Overview

Punctuation splitting seems to work without problem, though with omission (see below).

Hebrew works!

Arabic works!

Persian (Farsi) works!

No more problems with reversal or crunching. Yay!!!!!!!


# Bugs / Improvements

## align-entersentence.xhtml raises this error: 
	
Error creating sentence:

	<?xml version="1.0" ?>

	<exception>

	<path>/db/xq/align-addsentence.xq</path>

	<message>Function tan:get_OACAlignment() is not defined in namespace 'http://alpheios.net/namespaces/text-analysis' [at line 96, column 13]</message>

	</exception>

Commenting out this portion as follows allows it to run, but removes functionality:
	
	return 
        (: if we've been sent an oac:Annotation, get the treebank data from it :)
        if ($a_data//oac:Annotation)
        then

	(:hack to try to debut the error with get_OACAlignment :)
			$a_data

	(:   tan:get_OACAlignment($a_data)//align:aligned-text:)
	(: else if we've been sent unwrapped alignment xml, just use it :)
        (: name($a_data) doesn't work here if a prefix for the align namespace has been specified in the input doc :)
        else if (local-name($a_data) = local-name($dummy) and namespace-uri($a_data) = namespace-uri($dummy))
        then
            $a_data
        else ()

### BMA response 2014-06-16

I completely forgot about this dependency because I always have the textanalysis-utils.xquery in my eXist repo. It can be found in the old Alpheios sourceforge repo at https://svn.code.sf.net/p/alpheios/code/xml_ctl_files/xquery/trunk/textanalysis-utils.xquery. I do want to support upload of an OA annotation but I would do it differently than previously coded here (especially since that uses an obsolete version of the OA specification). I think for now I will just remove this functionality and add an issue to add it back in at some point.

## alph-edit-utils.js is easy to forget to install

It might be a good idea to move it to the same directory as the rest of the code.

Another option would be writing documentation to point the user to alph-edit-utils.js. Otherwise, it's easy to forget to update the script, and the editor fails. 

### BMA response 2014-06-16

Agreed. We should handle this differently. For now I will add installation instructions to the README and include this step as @LFDM did for treebank editor at https://github.com/alpheios-project/treebank-editor/commit/837d32438f7b8be8aee4ae1493958ff17d02ced4

##Punctuation tokenization incomplete

Current hack @6f5d28b ignores question marks, RTL punction, etc. 

	'^[^ ",.:;\-—)"]+[",.:;\-—)"]'

...but this might not cause too many problems if it's only temporary.

### BMA response 2014-06-16

Absolutely not a long term solution. I will add at least the ? for now though.

##Loading sentence from file raises error

align-editsentence.xq?doc=TEST&s=1 raises error 'Can't get SVG transform'

### BMA response 2014-06-16

align-editsentence.xq has now been completely superceded by align-editsentence.xhtml.  i.e. align-editsentence.xhtml?doc=TEST&s=1 should work. I will delete the xq file.

##RTL punctuation gets flipped to beginning

e.g.

.כִּי-הִנֵּה הַסְּתָו, עָבָר; הַגֶּשֶׁם, חָלַף הָלַךְ לוֹ

becomes


כִּי-הִנֵּה הַסְּתָו, עָבָר; הַגֶּשֶׁם, חָלַף הָלַךְ לו .

Although as you can see, it still tokenizes the punctuation correctly!

### BMA response 2014-06-16

This this may be solved by adding the dir attribute on the wrapping g element for the sentence. Will try that.

# Anticipated UI Issues


##Directionality Radio Buttons

It's easy to forget to select the right directionality button below your input, and if you don't select the directionality correctly, the old reversal problem re-occurs. This could perhaps be improved were there a strong reminder within the sentence entry interface. 

### BMA response 2014-06-16

We really should try to autodetect this. I will enter a separate issue for it.

##Single-word Interpolation

Adding an LTR word in the midst of RTL script messes up the directonality in the sentence entry form, but it self-corrects upon entry into the editing UI. This could become a source of confusion. 

e.g.

آن تريک شيرازي بدست آرد دل ماراآرد دل مارا

when interpolated with a single LTR word, becomes 

آن تريک شيرازي(Shirazi) بدست آرد دل مارا مارارد دل مارا

...in the entry form, but reverts to

بدست (Shirazi) شيرازي

...in the editing environment.

### BMA response 2014-06-16

I will enter a separate issue for this.


##Multi-word Interpolation

However, adding multiple LTR words in the midst of RTL script messes up the directonality in both the sentence entry form as well as in the editing UI. There is no way to specify multiple directionalities within one passage. This should be added to the list of long-term desiderata.

e.g.

آن تريک شيرازي بدست آرد دل مارارد دل مارا

when interpolated with multiple LTR words, becomes

آن تريک شيرازي(person from Shiraz) بدست آرد دل مارا

...in the entry form, and

بدست (Shiraz from person)شيرازي 

...in the editing environment.

### BMA response 2014-06-16

I will enter a separate issue for it.





