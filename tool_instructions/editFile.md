# editFile - change some lines in a file

## read the file first, always

This tool works with line numbers. You get line numbers from the readfile
tool. So the order is always:

1. <tool><readfile>src/main.py</readfile></tool>
2. look at the numbers it gives you
3. edit with editFile using those numbers

Never edit a file you have not just read. You would be guessing.

## how to call it

Write exactly this, nothing else:

<tool><editFile>PATH HERE
lSTART
YOUR NEW LINES HERE
lEND
</editFile></tool>

The path goes on the first line, on its own. Then a line that is just the
letter l and a number. Then your new text. Then another line that is just the
letter l and a number.

Stop writing the moment you write </tool>. The system edits the file right
then and gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## THE TWO NUMBERS ARE LINES YOU KEEP

This is the one thing to understand. The two markers are not the lines you are
replacing. They are the last line you keep above, and the first line you keep
below.

- everything from line 1 down to lSTART stays
- everything from lEND to the end of the file stays
- everything between the two markers is deleted and replaced by your text

## worked example 1, adding lines

Say readfile gave you this:

l:1 print(hi)
l:2 print(welcome)
l:3 print(hellow)
l:4 print(eju)
l:5 print(hhh)

You want to add two lines after line 2, without deleting anything.

Keep line 2 above. Keep line 3 below. So the markers are l2 and l3:

<tool><editFile>test.py
l2
h = "hh"
print(hh)
l3
</editFile></tool>

Nothing sits between line 2 and line 3, so nothing is lost. The file is now:

l:1 print(hi)
l:2 print(welcome)
l:3 h = "hh"
l:4 print(hh)
l:5 print(hellow)
l:6 print(eju)
l:7 print(hhh)

## worked example 2, replacing lines

Now the file is the 7 lines above. You want to throw away lines 5 and 6
(print(hellow) and print(eju)) and put one line there instead.

Keep line 4 above. Keep line 7 below. So the markers are l4 and l7:

<tool><editFile>test.py
l4
print("replaced")
l7
</editFile></tool>

Lines 5 and 6 were between the markers, so they are gone. The file is now:

l:1 print(hi)
l:2 print(welcome)
l:3 h = "hh"
l:4 print(hh)
l:5 print("replaced")
l:6 print(hhh)

## the four special cases

Say the file has 6 lines.

Add at the very top          -> l0 and l1
Add at the very bottom       -> l6 and l7
Replace the whole file       -> l0 and l7
Delete lines without adding  -> put nothing between the markers

l0 means "keep nothing above". For the bottom, use one MORE than the last
line number, because there is no line 7 to keep.

Deleting lines 3 and 4 of a 6 line file, keeping 2 above and 5 below:

<tool><editFile>test.py
l2
l5
</editFile></tool>

## the path

Relative to the project folder, on the first line, on its own.

RIGHT: src/main.py
WRONG: /home/me/myapp/src/main.py

## what you get back

<tool_result>system successful edited file: test.py (2 lines replaced by 1, file is now 6 lines)
l:1 print(hi)
l:2 print(welcome)
l:3 h = "hh"
l:4 print(hh)
l:5 print("replaced")
l:6 print(hhh)</tool_result>

Look at those numbers. They are the NEW numbers.

If it did not work:

<tool_result>system failed to edit file: need an l<start> line before the new text and an l<end> line after it</tool_result>
<tool_result>system failed to edit file: src/main.py not found</tool_result>
<tool_result>system failed to edit file: permission denied</tool_result>

Permission denied means the user refused. Do not try again.

## the numbers move after every edit

Once you edit, every line below your edit has shifted. Your old numbers are
wrong now.

The result above shows you the new numbers. Use those for the next edit. If
you are not sure, read the file again first.

This is the most common way to break a file: making a second edit with the
numbers from before the first edit. Do not do it.

## common mistakes

WRONG, no path on the first line:
<tool><editFile>l2
new stuff
l3
</editFile></tool>

RIGHT:
<tool><editFile>src/main.py
l2
new stuff
l3
</editFile></tool>

WRONG, only one marker:
<tool><editFile>src/main.py
l2
new stuff
</editFile></tool>

RIGHT, always two:
<tool><editFile>src/main.py
l2
new stuff
l3
</editFile></tool>

WRONG, marker not alone on its line:
<tool><editFile>src/main.py
l2 print("x")
l3
</editFile></tool>

RIGHT, the marker line holds nothing but the marker:
<tool><editFile>src/main.py
l2
print("x")
l3
</editFile></tool>

WRONG, wrong tag name. This one has a CAPITAL F:
<tool><editfile>src/main.py
l0
x
l1
</editfile></tool>

RIGHT:
<tool><editFile>src/main.py
l0
x
l1
</editFile></tool>

WRONG, wrapping your new lines in a markdown code fence:
<tool><editFile>src/main.py
l2
```python
print("x")
```
l3
</editFile></tool>

RIGHT, just the lines, exactly as they should appear in the file:
<tool><editFile>src/main.py
l2
print("x")
l3
</editFile></tool>

Write your new lines with the indentation they need in the real file. What you
type between the markers is exactly what lands in the file.
