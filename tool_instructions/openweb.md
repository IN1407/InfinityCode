# openweb - open a web page in the user's browser

## how to call it

Write exactly this, nothing else:

<tool><openweb>THE FULL URL HERE</openweb></tool>

Stop writing the moment you write </tool>. The browser opens right then and
the system gives you the answer. Anything you write after </tool> is thrown
away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><openweb>https://docs.python.org/3/library/asyncio.html</openweb></tool>

<tool><openweb>http://localhost:8000</openweb></tool>

<tool><openweb>https://github.com/psf/requests</openweb></tool>

## opening it in a new window

Put `new-window` after the url. It is optional. Leave it out and the page
opens in the browser window that is already there.

<tool><openweb>THE URL new-window</openweb></tool>

Example:

<tool><openweb>https://example.com new-window</openweb></tool>

Only that one word is understood. `new-window`, `new window` and `new_window`
all work. Nothing else does.

## this is NOT how you read a page

This tool opens the page on the user's screen, for the user to look at. You do
not get the contents back. You get one line saying it opened.

If you want to READ a page, that is a different tool:

<tool><webpg>https://example.com</webpg></tool>

So:
- you want to know what is on the page  -> webpg
- the user should see the page          -> openweb

Do not call openweb to find something out. It tells you nothing.

## the url must be complete

Start it with https:// or http://. A bare domain is not a url.

RIGHT: <tool><openweb>https://example.com</openweb></tool>
WRONG: <tool><openweb>example.com</openweb></tool>
WRONG: <tool><openweb>www.example.com</openweb></tool>

## except localhost, which you can type bare

A local address does not need the http:// on the front. These all work:

<tool><openweb>localhost:8000</openweb></tool>
<tool><openweb>localhost:3000/dashboard</openweb></tool>
<tool><openweb>127.0.0.1:5000</openweb></tool>

This is the usual way to show the user a dev server you just started:

<tool><command>npm run dev|timer>bg<timer|</command></tool>

then once it is up:

<tool><openweb>localhost:3000 new-window</openweb></tool>

Only a real local address counts. Something that merely starts with the word
localhost does not, and is refused:

WRONG: <tool><openweb>localhost.evil.com</openweb></tool>

Only http:// and https:// are allowed. file:// and javascript: are refused:

<tool_result>system failed to open web page: file:///etc/passwd is not a url, it has to start with https:// or http://</tool_result>

Do not put quotes or square brackets around it.

WRONG: <tool><openweb>"https://example.com"</openweb></tool>
WRONG: <tool><openweb>[https://example.com]</openweb></tool>
RIGHT: <tool><openweb>https://example.com</openweb></tool>

One url per call. To open three pages, make three separate calls, one per
reply, waiting for each result.

## what you get back

If it opened:

<tool_result>system successful opened web page: https://example.com in google-chrome (the current window)</tool_result>

If the user set the web page engine to http instead of picking a browser,
there is no browser to open anything with:

<tool_result>system failed to open web page: no browser was picked at startup, the web page engine is set to http</tool_result>

That is a setting, not a mistake you can fix by trying again. Use webpg if you
only need the contents.

## the user may be asked first

This puts a window on the user's screen, in their own browser, signed in as
them. Unless they turned asking off, they are asked to approve every open. If
they say no you get:

<tool_result>system failed to open web page: permission denied</tool_result>

That means the user refused. Do not open it again and do not try to get around
it by launching the browser through the command tool.

## when to use it

Use it when the user should SEE something:
- a dev server you just started, so they can check it works
- a page of documentation they asked to be shown
- a report or html file you built, served over http

Do not use it to browse for yourself. That is what webpg and websearch are for.

## common mistakes

WRONG, expecting the page contents back:
<tool><openweb>https://example.com</openweb></tool>

RIGHT, if you wanted to read it:
<tool><webpg>https://example.com</webpg></tool>

WRONG, wrong tag name:
<tool><open_web>https://example.com</open_web></tool>
<tool><OpenWeb>https://example.com</OpenWeb></tool>
<tool><browser>https://example.com</browser></tool>

RIGHT, the tag is all lowercase `openweb`, spelled the same at both ends:
<tool><openweb>https://example.com</openweb></tool>

WRONG, a search phrase instead of a url:
<tool><openweb>how to use asyncio</openweb></tool>

RIGHT, search first, then open a real url you got back:
<tool><websearch>how to use asyncio</websearch></tool>
