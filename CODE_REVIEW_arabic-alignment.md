# 2014-06-06

# Overview

# Bugs / Improvements

## align-entersentence.xhtml raises this error: 
	
Error creating sentence:

	<?xml version="1.0" ?>

	<exception>

	<path>/db/xq/align-addsentence.xq</path>

	<message>Function tan:get_OACAlignment() is not defined in namespace 'http://alpheios.net/namespaces/text-analysis' [at line 96, column 13]</message>

	</exception>

## alph-edit-utils.js is easy to forget

Perhaps it should be moved to the same directory as the rest of thte code.

Alternatively, we could consider writing documentation to point the user to alph-edit-utils.js. Otherwise, it's easy to forget to update the script, and the editor fails. 

##Punctuation tokenization incomplete



Current hack @6f5d28b ignores question marks, RTL punction, etc. 

	'^[^ ",.:;\-—)"]+[",.:;\-—)"]'

...but this might not cause too many problems if it's only temporary.


##Loading sentence generates error

align-editsentence.xq?doc=TEST&s=1 raises error 'Can't get SVG transform'

