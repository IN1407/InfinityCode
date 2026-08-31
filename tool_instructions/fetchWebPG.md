# webpg - read a web page

## how to call it

Say the url, then a `|`, then what you are looking for:

<tool><webpg>THE FULL URL | WHAT YOU WANT TO KNOW</webpg></tool>

Example:

<tool><webpg>https://docs.python.org/3/library/asyncio.html | how do I run tasks concurrently</webpg></tool>

Stop writing the moment you write </tool>. One tool call per reply. Never two.

## why you say what you are looking for

A web page is mostly menus, footers and links you do not care about. The part
after the `|` is used to find the passages that actually answer you, and only
those come back. A big page drops from thousands of words to the handful that
matter.

So make it a real question or a description, not a keyword:

GOOD: | how do I run tasks concurrently
GOOD: | what are the arguments to TaskGroup
BAD:  | asyncio
BAD:  | info

The better the question, the better the passages you get.

## getting the whole page instead

Put `--full` at the end and nothing is filtered out:

<tool><webpg>THE FULL URL --full</webpg></tool>

Example:

<tool><webpg>https://example.com --full</webpg></tool>

Use `--full` when:
- the page is short anyway
- you need the whole thing, like a licence, a changelog or a config file
- you do not know yet what you are looking for

Do not reach for `--full` by habit. It costs many times more, and on a long
page most of what comes back is navigation junk.

## examples, copy this shape

<tool><webpg>https://peps.python.org/pep-0008/ | naming conventions for functions</webpg></tool>

<tool><webpg>https://github.com/psf/requests | how do I set a timeout</webpg></tool>

<tool><webpg>https://example.com --full</webpg></tool>

## the url must be complete

Start it with https:// or http://. A bare domain is not a url.

RIGHT: <tool><webpg>https://example.com | what is this site</webpg></tool>
WRONG: <tool><webpg>example.com | what is this site</webpg></tool>

Do not put quotes or square brackets around it.

One url per call. To read three pages, make three separate calls, one per
reply, waiting for each result.

## what you get back

With a question, you get the matching passages, with `...` where text was
skipped:

<tool_result>[5 of 230 passages from https://en.wikipedia.org/wiki/Python_(programming_language), the closest matches for: who created python and in what year]

Python was conceived in the late 1980s by Guido van Rossum at Centrum Wiskunde
& Informatica (CWI) in the Netherlands. Python implementation began in
December 1989. Van Rossum first released it in 1991 as Python 0.9.0.

...

Python 2.0 was released on 16 October 2000, featuring many new features such
as list comprehensions.

[page was 134905 characters]</tool_result>

If nothing was skipped the page was already small enough and you get all of it.

With `--full` you get the page text, cut off if it is very long:

<tool_result>Example Domain Example Domain
This domain is for use in documentation examples without needing permission.
Learn more</tool_result>

If it could not be fetched:

<tool_result>system failed to fetch web page: ...</tool_result>

Check the url is spelled right and starts with https://. If the page really is
gone, search for another one instead of retrying the same url.

## if you forget to say what you want

You are told, and nothing is fetched:

<tool_result>system failed to fetch web page: say what you are looking for, as <tool><webpg>URL | what you want to know</webpg></tool>, or ask for the whole page with <tool><webpg>URL --full</webpg></tool></tool_result>

Add a question after the `|`, or use `--full`.

## this tool needs a url you already have

It reads a page you name. It does not find pages for you. To find a url, search
first:

<tool><websearch>python asyncio task groups</websearch></tool>

then take a URL from the results and read it:

<tool><webpg>https://docs.python.org/3/library/asyncio-task.html | how do I run tasks concurrently</webpg></tool>

## common mistakes

WRONG, no question and no --full:
<tool><webpg>https://example.com</webpg></tool>

RIGHT, one or the other:
<tool><webpg>https://example.com | what is this site about</webpg></tool>
<tool><webpg>https://example.com --full</webpg></tool>

WRONG, question before the url:
<tool><webpg>how do I set a timeout | https://example.com</webpg></tool>

RIGHT, url first, then the question:
<tool><webpg>https://example.com | how do I set a timeout</webpg></tool>

WRONG, wrong tag name:
<tool><webpage>https://example.com --full</webpage></tool>
<tool><fetch>https://example.com --full</fetch></tool>

RIGHT, the tag is all lowercase `webpg`, spelled the same at both ends:
<tool><webpg>https://example.com --full</webpg></tool>

WRONG, a search phrase instead of a url:
<tool><webpg>how to use asyncio | tell me</webpg></tool>

RIGHT, search first, then fetch the url you got:
<tool><websearch>how to use asyncio</websearch></tool>

Do not confuse this tool with openweb. webpg reads a page and gives you the
text. openweb opens it on the user's screen and tells you nothing.
