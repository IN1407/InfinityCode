# mcp - call a tool on a connected mcp server

## how to call it

Write exactly this, nothing else:

<tool><mcp>server.tool {"argument": "value"}</mcp></tool>

Stop writing the moment you write </tool>. The system runs the call right then
and gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## the shape

* `server` is the name of a connected server, exactly as listed below.
* `tool` is one of that server's tools.
* what follows is the arguments, as one json object. Leave it out entirely if
  the tool takes none.

## examples, copy this shape

<tool><mcp>blender.get_scene_info</mcp></tool>

<tool><mcp>blender.create_object {"type": "CUBE", "location": [0, 0, 0]}</mcp></tool>

## rules

* Use only a server and tool named in the list below. Anything else fails.
* The arguments must be one json object on the same call, matching the
  argument list shown for that tool. Send required arguments; leave optional
  ones out unless you need them.
* An mcp server runs outside the sandbox, on the real machine, so it can touch
  things the command tool cannot. The user is asked before a server is used
  for the first time.
* If the result says the call failed, it failed. Do not assume it worked.
