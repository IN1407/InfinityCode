# askusr - ask the user a question and wait for the answer

## how to call it

Write exactly this, nothing else:

<tool><askusr>1qn```YOUR QUESTION HERE```1</askusr></tool>

The ``` parts are three backtick characters. Type all three, with no spaces
between them.

A real call looks like this:

<tool><askusr>1qn```Which database should I use?
A) sqlite
B) postgres```1</askusr></tool>

Stop writing the moment you write </tool>. The system asks the user right then
and waits for them to type. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## the shape of one question

A question has four parts, in this exact order, with nothing between them:

1. the number, then `qn`      ->  1qn
2. three backticks            ->  ```
3. your question text
4. three backticks, then the number  ->  ```1

Put together: 1qn```your question```1

The number at the start and the number at the end must be the SAME number.

WRONG, numbers do not match:
<tool><askusr>1qn```Which one?```2</askusr></tool>

RIGHT:
<tool><askusr>1qn```Which one?```1</askusr></tool>

## always start at 1

The first question must be number 1. If there is no question 1, nothing is
asked at all and you get an error back.

WRONG, starts at 2:
<tool><askusr>2qn```Which one?```2</askusr></tool>

RIGHT:
<tool><askusr>1qn```Which one?```1</askusr></tool>

## asking more than one question

You may ask up to 5. Number them 1, 2, 3, 4, 5 in order(max questions in one tool call is 5), one after another in
the same call:

<tool><askusr>1qn```Which database should I use?
A) sqlite
B) postgres```1 2qn```Should I write tests now?
A) yes
B) later```2</askusr></tool>

Ask as few questions as you can. One clear question is better than five vague
ones.

## give them options when you can

People answer faster when you offer choices. Label them A, B, C, D:

<tool><askusr>1qn```I found two config files. Which one is the real one?
A) config.json
B) settings.json
C) both, they are used for different things```1</askusr></tool>

They can also ignore your options and type anything they want, so read the
answer carefully instead of assuming it is A, B, C or D.

## what you get back

Each question and whatever the user typed under it:

<tool_result>1: Which database should I use?
A) sqlite
B) postgres
Answer: A

2: Should I write tests now?
A) yes
B) later
Answer: later</tool_result>

The answer is the user's decision. Follow it. Do not argue with it and do not
ask the same question again.

## when to use this tool

Use it when you truly cannot continue without the user:
- two ways to do something, and the wrong one wastes a lot of work
- something is about to be deleted or overwritten and you are not sure
- the request can be read in two different ways

Do NOT use it for things you can find out yourself. If the answer is in a
file, read the file. If the answer is in the folder listing, list the folder.

WRONG, you could have just looked:
<tool><askusr>1qn```What files are in the src folder?```1</askusr></tool>

RIGHT:
<tool><command>ls -la src</command></tool>

## common mistakes

WRONG, no backticks:
<tool><askusr>1qn Which one? 1</askusr></tool>

WRONG, missing the closing part:
<tool><askusr>1qn```Which one?</askusr></tool>

WRONG, wrong tag name:
<tool><ask>Which one?</ask></tool>
<tool><askuser>Which one?</askuser></tool>

RIGHT, the tag is `askusr`, no `e` in usr, spelled the same at both ends:
<tool><askusr>1qn```Which one?```1</askusr></tool>
