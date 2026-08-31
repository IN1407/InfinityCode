# subagent - hand a job to another agent

A subagent is a second agent that works for you. It has its own system prompt,
its own memory, and the same tools you have, in the same project folder. Use
one when a job is big enough to be worth handing over whole.

There are five things you can do. Each one is a different thing to put inside
the tags.

## how to call it

Write exactly this, nothing else:

<tool><subagent>WHAT YOU WANT</subagent></tool>

Stop writing the moment you write </tool>. Anything you write after </tool> is
thrown away. One tool call per reply. Never two.

A subagent may take a while, because it does the whole job before answering.

## 1. make a subagent and give it its first job

<tool><subagent>{create>NAME
sys>THE SYSTEM PROMPT FOR IT<sys
usr>THE JOB YOU WANT DONE<usr
<create|</subagent></tool>

Four parts, in this order:

- the NAME on the first line, on its own
- sys> then its system prompt, then <sys
- usr> then the job, then <usr
- <create| at the end

Real example:

<tool><subagent>{create>tester
sys>You write and run pytest tests. You never change source files, only files
under tests/. When you are done, say which tests you added and whether they
pass.<sys
usr>Write tests for the login function in src/auth.py and run them.<usr
<create|</subagent></tool>

The name must be letters, numbers, dot, dash or underscore. No spaces.

If a subagent with that name already exists, it is NOT made again. Its system
prompt is replaced with the new one, its memory is kept, and it gets the new
job. So this is also how you re-brief one.

## 2. see what subagents you have

<tool><subagent>list</subagent></tool>

You get back how many there are, the system prompt of each one, and whether it
is active. Active means it has been given at least one job. A subagent you just
made but never used is not active yet.

<tool_result>system successful listed subagents: 2 of unlimited, running on gpt-oss-120b

name: reviewer
state: not active, never given a prompt
system prompt: You review code for bugs and say what you found.

name: tester
state: active, 4 messages of history
system prompt: You write and run pytest tests.</tool_result>

Use this when you are not sure what already exists, before making a new one.

## 3. give more work to one you already have

<tool><subagent>NAME>THE JOB</subagent></tool>

Example:

<tool><subagent>tester>Now do the same for the logout function.</subagent></tool>

It remembers everything from its earlier jobs, so you do not have to explain
again what you already told it.

If the name does not exist you are told, along with the names that do:

<tool_result>system failed to run subagent: there is no subagent called testr. subagents that exist: reviewer, tester</tool_result>

Read that list and use a real name. Do not invent one.

## 4. make one forget its history

<tool><subagent>NAME clear</subagent></tool>

Example:

<tool><subagent>tester clear</subagent></tool>

The subagent stays and keeps its system prompt. Only its memory of past jobs
goes. Do this when it is carrying old context that is now wrong or in the way.

## 5. get rid of one for good

<tool><subagent>delete: NAME</subagent></tool>

Example:

<tool><subagent>delete: tester</subagent></tool>

Gone, with its history. Do this when you are finished with it, or when you are
at the limit and need room for another.

## what you get back

Whatever the subagent said at the end of its work. You do not see its whole
conversation in your result, only its answer, so a good system prompt tells it
to report clearly.

## how to write a good system prompt for one

Say what it is, what it may touch, and what to report. Short and firm.

GOOD:
sys>You review python code for bugs. You read files but never change them.
List each bug with the file and line, worst first.<sys

BAD, too vague to be useful:
sys>You are helpful.<sys

## rules

1. A subagent cannot make or call other subagents. Only you can.
2. There may be a limit on how many you can have. If you hit it, delete one.
3. Give one job per call and wait for the answer.
4. Do not make a new subagent for something you can just do yourself. A single
   file read is not worth a subagent.
5. Prefer re-using an existing subagent over making a near-identical one.

## common mistakes

WRONG, name not on its own line:
<tool><subagent>{create>tester sys>does testing<sys
usr>test it<usr
<create|</subagent></tool>

RIGHT, name alone on the first line:
<tool><subagent>{create>tester
sys>does testing<sys
usr>test it<usr
<create|</subagent></tool>

WRONG, missing the closing <create|:
<tool><subagent>{create>tester
sys>does testing<sys
usr>test it<usr
</subagent></tool>

WRONG, wrong tag name:
<tool><sub_agent>list</sub_agent></tool>
<tool><SubAgent>list</SubAgent></tool>

RIGHT, the tag is all lowercase `subagent`, spelled the same at both ends:
<tool><subagent>list</subagent></tool>

WRONG, trying to run one that was never made:
<tool><subagent>helper>do the thing</subagent></tool>

RIGHT, make it first, which also gives it its first job:
<tool><subagent>{create>helper
sys>You do the thing.<sys
usr>do the thing<usr
<create|</subagent></tool>
