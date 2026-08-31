# readFile - read a file and see its line numbers

## THE TAG IS ALL LOWERCASE

The tag is `readfile`. All lowercase. Even though the tool is called readFile,
the tag has a small f.

RIGHT: <tool><readfile>src/main.py</readfile></tool>
WRONG: <tool><readFile>src/main.py</readFile></tool>
WRONG: <tool><ReadFile>src/main.py</ReadFile></tool>

Get this wrong and nothing happens. Read it twice before you write it.

## how to call it

Write exactly this, nothing else:

<tool><readfile>PATH HERE</readfile></tool>

Stop writing the moment you write </tool>. The system reads the file right
then and gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><readfile>README.md</readfile></tool>

<tool><readfile>src/main.py</readfile></tool>

<tool><readfile>tests/test_auth.py</readfile></tool>

## the path

The path is relative to the project folder. Do not put the project folder
name in front of it.

RIGHT: <tool><readfile>src/main.py</readfile></tool>
WRONG: <tool><readfile>/home/me/myapp/src/main.py</readfile></tool>

One file per call. There are no wildcards.

WRONG: <tool><readfile>src/*.py</readfile></tool>
WRONG: <tool><readfile>a.py b.py</readfile></tool>

## what you get back

Every line comes back with its line number in front, like `l:1`, `l:2`, `l:3`:

<tool_result>l:1 import os
l:2
l:3 def main():
l:4     print("hello")
l:5
l:6 main()</tool_result>

The `l:1 ` part is NOT in the file. It is added so you can count lines. The
real first line is `import os`.

## why the line numbers matter

The editFile tool needs line numbers. Those numbers come from here.

So the order is always:
1. read the file with readfile
2. look at the numbers
3. edit it with editFile using those numbers

Never edit a file you have not read. You would be guessing at the numbers.

## the numbers change after every edit

Once you edit a file, the old numbers are wrong. Everything below your edit
has shifted.

The editFile result shows you the new numbers. Use those. If you are unsure,
read the file again before the next edit.

## if the file is not there

Check the real names first with the command tool:

<tool><command>ls -la src</command></tool>

Then read the one that actually exists. Do not guess file names.

## common mistakes

WRONG, capital F in the tag:
<tool><readFile>a.py</readFile></tool>

RIGHT:
<tool><readfile>a.py</readfile></tool>

WRONG, keeping the square brackets:
<tool><readfile>[a.py]</readfile></tool>

RIGHT:
<tool><readfile>a.py</readfile></tool>

WRONG, spaces around the path:
<tool><readfile> a.py </readfile></tool>

RIGHT:
<tool><readfile>a.py</readfile></tool>

Note: when you ask for these instructions with the get tool, THAT name has the
capital F: <tool><get>readFile</get></tool>. Only the tag is lowercase.
