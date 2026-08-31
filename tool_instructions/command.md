# command - run a terminal command

## how to call it

Write exactly this, nothing else:

<tool><command>YOUR COMMAND HERE</command></tool>

Stop writing the moment you write </tool>. The system runs the command right
then and gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><command>ls -la</command></tool>

<tool><command>cat README.md</command></tool>

<tool><command>python3 -m pytest tests/</command></tool>

<tool><command>mkdir -p src/utils</command></tool>

<tool><command>git status</command></tool>

## you are already in the project folder

The system does `cd` into the project folder for you before every command.
Use paths relative to the project folder.

RIGHT: <tool><command>cat src/main.py</command></tool>
WRONG: <tool><command>cd /home/me/project && cat src/main.py</command></tool>

## the timer: how long to wait for it

If the default wait is not right, add a timer at the end of the command:

<tool><command>YOUR COMMAND|timer>VALUE<timer|</command></tool>

There are four things you can put as VALUE.

### 1. a number of seconds

Wait that many seconds, then give up on it.

<tool><command>python3 -m pytest tests/|timer>300<timer|</command></tool>

### 2. inf

Wait however long it takes, with no limit. Use this when you know it will
finish but you cannot guess when.

<tool><command>pip install -r requirements.txt|timer>inf<timer|</command></tool>

Careful: nothing else happens until it finishes. If it never finishes, you are
stuck. If it might never finish, use bg instead.

### 3. bg

Start it and carry straight on. You get a short note back immediately, and the
real output arrives on its own later, once the command exits.

<tool><command>npm run build|timer>bg<timer|</command></tool>

You get back:

<tool_result>system started command 1 in the background: npm run build
its output comes back when it exits</tool_result>

Then keep working. Later, attached to some other result, you will see:

<tool_result>background command 1 finished (exit code 0): npm run build
built in 4.2s</tool_result>

### 4. infibg: SECONDS

For a command that never stops on its own, like a dev server. It starts in the
background, and you watch its output for SECONDS, then carry on.

<tool><command>uvicorn main:app --reload|timer>infibg: 10<timer|</command></tool>

You get back the first 10 seconds of output:

<tool_result>system started command 2 in the background: uvicorn main:app --reload
first 10s of output, it is still running:
INFO:     Uvicorn running on http://127.0.0.1:8000</tool_result>

That is usually enough to see whether it started or crashed. Use
`infibg: 0` if you do not want to wait at all.

### timer rules

1. Put it at the end, right after the command.
2. Use ONE of: a number, `inf`, `bg`, or `infibg: NUMBER`. Nothing else.
3. Leave it out entirely if the default is fine. Most commands do not need it.

WRONG: <tool><command>sleep 10|timer>30s<timer|</command></tool>
WRONG: <tool><command>sleep 10|timer>five<timer|</command></tool>
WRONG: <tool><command>sleep 10|timer>soon<timer|</command></tool>
RIGHT: <tool><command>sleep 10|timer>30<timer|</command></tool>

If you write something else you are told so and nothing runs:

<tool_result>system failed to execute command: soon is not a timer, use a number of seconds, or inf, or bg, or infibg: <seconds></tool_result>

### which one do I want?

Finishes quickly            -> no timer at all
Slow but it does finish     -> a number, or inf
Slow and you want to work   -> bg
Never stops by itself       -> infibg: 10

## what you get back

If it worked:

<tool_result>system successful executed command
total 12
drwxr-xr-x 3 user user 4096 Jan  1 10:00 src
-rw-r--r-- 1 user user  220 Jan  1 10:00 README.md</tool_result>

If it failed, you get the exit code and the error text:

<tool_result>system failed to execute command (exit code 1)
cat: nope.txt: No such file or directory</tool_result>

If it ran too long:

<tool_result>system failed to execute command: timed out after 120s. if it needs longer use |timer>SECONDS<timer|, or |timer>bg<timer| to let it run in the background</tool_result>

Do exactly what that says. Run it again with a bigger timer, not the same one.

Read the result before deciding what to do next. Do not repeat a command that
just succeeded.

## what you are allowed to do

You are inside a sandbox.

- You CAN create, edit and delete files inside the project folder.
- You CAN write to /tmp.
- You CAN use the network (pip install, curl, git clone).
- You CANNOT write anywhere else. The rest of the disk is read-only.

If you try to write outside the project folder you get:

<tool_result>system failed to execute command (exit code 1)
/bin/bash: line 1: /etc/thing: Read-only file system</tool_result>

That is the sandbox, not a mistake you can fix by trying again. Do not retry
the same write. Put the file inside the project folder instead.

## the user may be asked first

For commands that can destroy things (rm, sudo, mv, cp, git push, chmod,
chown) the user is asked to approve. If they say no you get:

<tool_result>system failed to execute command: permission denied</tool_result>

That means the user refused. Do not run it again. Do something else, or use
the askusr tool to ask them what they want.

## common mistakes

WRONG, two calls in one reply:
<tool><command>ls</command></tool>
<tool><command>pwd</command></tool>

RIGHT, one call, then wait for the result:
<tool><command>ls</command></tool>

WRONG, keeping the square brackets:
<tool><command>[ls -la]</command></tool>

RIGHT:
<tool><command>ls -la</command></tool>

WRONG, wrong tag name:
<tool><cmd>ls</cmd></tool>
<tool><Command>ls</Command></tool>

RIGHT, the tag is lowercase `command`, spelled the same at both ends:
<tool><command>ls</command></tool>

## your default timeout right now
