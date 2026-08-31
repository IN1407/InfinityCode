# playwright - drive a browser yourself

This is InfinityCode's own browser. It is not the user's browser: it has its
own profile and none of their logins. Use `openweb` when the point is to show
the user a page; use this when the point is to read or operate one yourself.

The page stays where you left it between calls, so a later call can carry on
from the page an earlier one opened.

## how to call it

Write exactly this, nothing else:

<tool><playwright>goto https://example.com</playwright></tool>

Stop writing the moment you write </tool>. The system runs it right then and
gives you the answer. Anything you write after </tool> is thrown away.

One tool call per reply. Never two.

## several actions in one call

Put one action per line and they run in order, top to bottom. Prefer this over
one action per call: it is a single step instead of many.

<tool><playwright>
goto https://example.com/login
fill #username ada
fill #password hunter2
click button[type=submit]
wait_for networkidle
text .dashboard
</playwright></tool>

If a line fails, the ones before it have already happened, the ones after it
are skipped, and you are told which line failed. The browser is left on
whatever page it reached, so you can look with `snapshot` and carry on.

## the actions

| action | parameters | what it does |
|---|---|---|
| `goto` | url | Open a url and wait for the document to load. |
| `back` | none | Go back one entry in history. |
| `snapshot` | selector (optional, default `body`) | Print the page as a labelled accessibility outline. |
| `text` | selector (optional, default `body`) | Print the visible text inside a selector. |
| `click` | selector | Click the first element matching the selector. |
| `fill` | selector, value | Replace the contents of an input with value. |
| `press` | selector and key, or just key | Press a key on an element, or on the page. |
| `select` | selector, value | Choose an option in a `<select>`. |
| `wait_for` | selector, load state, or milliseconds | Wait for an element, for `load`/`domcontentloaded`/`networkidle`, or a number of ms. |
| `scroll` | pixels, or a selector | Scroll by an amount, or scroll an element into view. |
| `screenshot` | name (optional) | Save a full-page png into the project folder and print its path. |
| `evaluate` | javascript | Run javascript in the page and print what it returns. |
| `storage_state` | `save` or `load`, then a name | Save the cookies and storage of this session, or restore them. |

## reading a page you have never seen

`snapshot` first. It gives roles and labels, which is what you need to write a
selector. Guessing selectors out of raw html mostly does not work.

## rules

* One action per line. Do not write anything that is not one of the actions
  above -- there is no `if`, no loop, no variables.
* A selector is a css selector, or a playwright text selector such as
  `text=Sign in`. Anything after the selector on a `fill` line is the value,
  spaces and all.
* `screenshot` writes a file. You cannot see the image; it is for the user.
* `evaluate` runs whatever javascript you give it in the page. Use it only
  when no other action will do.
* The browser is headless, so nothing appears on the user's screen.
* If the result says a line failed, it failed. Do not assume it worked.
