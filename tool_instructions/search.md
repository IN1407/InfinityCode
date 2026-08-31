# search - find which files contain some text

## how to call it

Write exactly this, nothing else:

<tool><search>TEXT TO LOOK FOR</search></tool>

Stop writing the moment you write </tool>. The system searches right then and
gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><search>def login</search></tool>

<tool><search>API_KEY</search></tool>

<tool><search>TODO</search></tool>

<tool><search>import requests</search></tool>

## what it searches

Every file inside the project folder, including files in sub folders. You do
not give it a path. You only give it the text.

## it is a plain text match

The text you give is matched exactly, character for character. It is not a
regular expression and it is not a wildcard pattern.

- Upper and lower case matter. `login` will not find `Login`.
- `.` means a real dot, not "any character".
- `*` means a real star, not "anything".

WRONG, thinking it is a regex:
<tool><search>def .*login</search></tool>

RIGHT, search for a piece of the real text:
<tool><search>login</search></tool>

Search for something short and exact. If you are looking for a function, search
for its name, not the whole line.

## what you get back

A list of the files that contain your text:

<tool_result>Found in /home/me/myapp/src/auth.py:
Found in /home/me/myapp/tests/test_auth.py:
</tool_result>

If nothing matched:

<tool_result>system failed to search: 'def login' not found in project folder</tool_result>

That means the text is not in the project. It is not an error you can fix by
trying the same search again. Try a shorter or different piece of text.

## it tells you WHERE, not WHAT

You get file names only. You do not get the matching line.

So the order is usually:
1. search for the text, to find which file it is in
2. read that file with readfile, to see the line and its number
3. edit it with editFile

Example, three separate replies:

<tool><search>def login</search></tool>

then after the result comes back:

<tool><readfile>src/auth.py</readfile></tool>

then after that result comes back, edit it.

## common mistakes

WRONG, giving it a path instead of text:
<tool><search>src/auth.py</search></tool>

RIGHT, give it text to look for:
<tool><search>def login</search></tool>

WRONG, wrong tag name:
<tool><Search>login</Search></tool>
<tool><grep>login</grep></tool>

RIGHT, the tag is lowercase `search`, spelled the same at both ends:
<tool><search>login</search></tool>

WRONG, keeping the square brackets:
<tool><search>[login]</search></tool>

RIGHT:
<tool><search>login</search></tool>

Do not confuse this tool with websearch. This one looks inside the project
files on this computer. websearch looks on the internet.
