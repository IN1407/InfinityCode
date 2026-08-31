# delete - move a file or folder to the trash

## how to call it

Write exactly this, nothing else:

<tool><delete>PATH HERE</delete></tool>

Stop writing the moment you write </tool>. The system deletes it right then
and gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## examples, copy this shape

<tool><delete>old_notes.txt</delete></tool>

<tool><delete>backend/text.py</delete></tool>

<tool><delete>frontend</delete></tool>

<tool><delete>tests/old/test_legacy.py</delete></tool>

## the path

The path is relative to the project folder. Do not put the project folder
name in front of it.

If the project folder is /home/me/myapp and you want to delete
/home/me/myapp/src/old.py, then write:

RIGHT: <tool><delete>src/old.py</delete></tool>
WRONG: <tool><delete>/home/me/myapp/src/old.py</delete></tool>
WRONG: <tool><delete>myapp/src/old.py</delete></tool>

Do not put spaces between the tags and the path.

WRONG: <tool><delete> src/old.py </delete></tool>
RIGHT: <tool><delete>src/old.py</delete></tool>

One path per call. To delete three files, make three separate calls, one per
reply, waiting for each result.

WRONG: <tool><delete>a.txt b.txt</delete></tool>
WRONG: <tool><delete>a.txt, b.txt</delete></tool>
RIGHT: <tool><delete>a.txt</delete></tool>

Folders are deleted with everything inside them. Be sure before you do it.

There are no wildcards. `*.log` is a shell pattern, and this tool does not use
a shell, so it will simply not be found.

WRONG: <tool><delete>*.log</delete></tool>

## nothing is destroyed

The file is MOVED to the system trash, not erased. The user can get it back.
That is why you should use this tool instead of running `rm` through the
command tool. `rm` is permanent, this is not.

## what you get back

If it worked:

<tool_result>system successful deleted file/folder: src/old.py</tool_result>

If the path does not exist:

<tool_result>system failed to delete file/folder: src/old.py not found</tool_result>

If that happens, do not guess another path. Use the command tool to list the
folder and see the real names:

<tool><command>ls -la src</command></tool>

## the user may be asked first

Unless the user turned that off, they are asked to approve every delete. If
they say no you get:

<tool_result>system failed to delete file/folder: permission denied</tool_result>

That means the user refused. Do not try to delete it again, and do not try to
get around it with `rm` through the command tool. Ask them why with the askusr
tool, or move on.

## common mistakes

WRONG, wrong tag name:
<tool><Delete>a.txt</Delete></tool>
<tool><delete_file>a.txt</delete_file></tool>

RIGHT, the tag is lowercase `delete`, spelled the same at both ends:
<tool><delete>a.txt</delete></tool>

WRONG, keeping the square brackets:
<tool><delete>[a.txt]</delete></tool>

RIGHT:
<tool><delete>a.txt</delete></tool>
