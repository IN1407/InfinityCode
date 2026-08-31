# websearch - search the internet

## how to call it

Write exactly this, nothing else:

<tool><websearch>WHAT YOU ARE LOOKING FOR</websearch></tool>

Stop writing the moment you write </tool>. The system searches right then and
gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><websearch>python asyncio task groups</websearch></tool>

<tool><websearch>rust borrow checker explained</websearch></tool>

<tool><websearch>sqlite wal mode</websearch></tool>

That is the whole tool. Everything below is optional. Leave it out unless you
actually need it.

## what you get back

A list of results. For a normal search each one has a title, a link and a
short piece of text:

<tool_result>system successful searched web (text, auto, 2 results)

Title: asyncio - Asynchronous I/O
URL: https://docs.python.org/3/library/asyncio.html
Snippet: asyncio is a library to write concurrent code...

Title: Task Groups in Python 3.11
URL: https://example.com/task-groups
Snippet: Task groups let you run several coroutines...</tool_result>

If nothing was found:

<tool_result>system failed to search web: google returned no results for 'asdkjhaskjd'</tool_result>

Try different words. Do not repeat the exact same search.

## you get links, not pages

The snippet is short. If you need what is actually on the page, take the URL
from a result and read it with the webpg tool:

<tool><webpg>https://docs.python.org/3/library/asyncio.html</webpg></tool>

So the order is: websearch to find the page, webpg to read the page.

## optional: searching for images or places

Add a type marker at the end:

<tool><websearch>YOUR QUERY|type>image<type|</websearch></tool>

The three types are:

text   - the default, gives Title / URL / Snippet
image  - gives Title / Image, where Image is a direct link to the picture
maps   - gives Title / Address / Rating

Examples:

<tool><websearch>mountains at sunrise|type>image<type|</websearch></tool>

<tool><websearch>restaurants near Times Square|type>maps<type|</websearch></tool>

If you leave the type out you get a normal text search. That is what you want
almost every time.

## optional: how many results

<tool><websearch>YOUR QUERY|max>3<max|</websearch></tool>

You get 10 by default. The most you can ask for is 50. Digits only.

<tool><websearch>sqlite wal mode|max>3<max|</websearch></tool>

## optional: choosing the engine

<tool><websearch>YOUR QUERY|engine>ENGINE NAME<engine|</websearch></tool>

Only do this if you have a reason. Leaving it out uses a sensible default.

The engine must be one that exists for the type you are searching. If the
provider set up for this session is serpapi:

text   google, bing, yahoo, duckduckgo, brave, baidu, yandex, naver
image  google_images, bing_images, yahoo_images, yandex_images
maps   google_maps, apple_maps, bing_maps, duckduckgo_maps

If the provider is ddgs:

text   auto, all, google, brave, duckduckgo, mojeek, startpage, wikipedia,
       yahoo, yandex, grokipedia
image  duckduckgo, bing
maps   ddgs has no maps. Do not ask ddgs for maps.

If you pick a wrong one you are told exactly which ones are allowed:

<tool_result>system failed to search web: bing_images is not a serpapi text engine, use one of: google, bing, yahoo, duckduckgo, brave, baidu, yandex, naver</tool_result>

Read that list and pick from it.

## using more than one marker

You can use any of them together, in any order. Do not put spaces between
them, and keep them out of the middle of your query.

<tool><websearch>red pandas|type>image<type||engine>bing<engine||max>5<max|</websearch></tool>

## common mistakes

WRONG, spaces around the markers:
<tool><websearch>red pandas |type>image<type| |max>5<max|</websearch></tool>

RIGHT:
<tool><websearch>red pandas|type>image<type||max>5<max|</websearch></tool>

WRONG, marker in the middle of the query:
<tool><websearch>red|type>image<type| pandas</websearch></tool>

RIGHT, query first, markers after:
<tool><websearch>red pandas|type>image<type|</websearch></tool>

WRONG, words instead of digits for max:
<tool><websearch>red pandas|max>five<max|</websearch></tool>

RIGHT:
<tool><websearch>red pandas|max>5<max|</websearch></tool>

WRONG, wrong tag name:
<tool><web_search>red pandas</web_search></tool>
<tool><searchweb>red pandas</searchweb></tool>

RIGHT, the tag is all lowercase `websearch`, spelled the same at both ends:
<tool><websearch>red pandas</websearch></tool>

Do not confuse this tool with search. websearch looks on the internet. search
looks inside the project files on this computer.
