# temppy - write some python and run it straight away

## how to call it

Write exactly this, nothing else:

<tool><temppy>YOUR PYTHON CODE HERE</temppy></tool>

Stop writing the moment you write </tool>. The system saves your code and runs
it right then. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><temppy>print(2 + 2)</temppy></tool>

Several lines are fine. Write them normally, with real newlines and real
indentation:

<tool><temppy>import json

with open("package.json") as f:
    data = json.load(f)

print(data["name"])
print(data["version"])</temppy></tool>

<tool><temppy>import os

for name in sorted(os.listdir("src")):
    print(name)</temppy></tool>

## you must print what you want to see

You only get back what the code prints. A value on its own line shows nothing,
because this is a script, not an interactive python shell.

WRONG, shows nothing:
<tool><temppy>2 + 2</temppy></tool>

RIGHT:
<tool><temppy>print(2 + 2)</temppy></tool>

WRONG, shows nothing:
<tool><temppy>data = load_config()</temppy></tool>

RIGHT:
<tool><temppy>data = load_config()
print(data)</temppy></tool>

## where the code runs

It runs from the project folder, so open files by their path relative to the
project folder, exactly like the other tools.

RIGHT: open("src/main.py")
WRONG: open("/home/me/myapp/src/main.py")

## what you get back

Whatever your code printed:

<tool_result>system successful executed command
4</tool_result>

If your code crashed you get the python traceback, and you should read it:

<tool_result>system failed to execute command (exit code 1)
Traceback (most recent call last):
  File "temp.py", line 3, in <module>
    print(data["nmae"])
KeyError: 'nmae'</tool_result>

Fix the code and send it again. Do not send the same broken code twice.

## it is thrown away each time

Every call overwrites the previous code. Nothing is kept between calls.

So if you need a variable in a later step, you cannot rely on it still being
there. Put everything you need into one script.

WRONG, two calls, expecting x to survive:
<tool><temppy>x = 10</temppy></tool>
then later
<tool><temppy>print(x)</temppy></tool>

RIGHT, one call:
<tool><temppy>x = 10
print(x)</temppy></tool>

## temppy or command?

Use temppy when the job is easier in python: reading json, counting things,
comparing two files, any real logic.

Use command when the job is a normal shell job: ls, cat, git, pytest, pip.

Do not use temppy just to run a shell command. This is the long way round:

WRONG:
<tool><temppy>import os
os.system("ls")</temppy></tool>

RIGHT:
<tool><command>ls</command></tool>

## common mistakes

WRONG, wrong tag name:
<tool><tempPY>print(1)</tempPY></tool>
<tool><python>print(1)</python></tool>

RIGHT, the tag is all lowercase `temppy`, spelled the same at both ends:
<tool><temppy>print(1)</temppy></tool>

WRONG, wrapping the code in a markdown code fence:
<tool><temppy>```python
print(1)
```</temppy></tool>

RIGHT, just the code:
<tool><temppy>print(1)</temppy></tool>
