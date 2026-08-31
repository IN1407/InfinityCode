# Local chat templates

The browser setup offers chat-template selection for Hugging Face Transformers,
llama.cpp, and MLX. **Model default** is recommended and preserves the runtime's
existing behavior. An override should only be chosen when its family matches the
model; the wrong control tokens can substantially reduce response quality.

Built-in choices are ChatML, Llama 3, Llama 2, Mistral Instruct, Gemma, Qwen,
and Zephyr. A custom template must be UTF-8 Jinja in a `.jinja`, `.jinja2`, or
`.j2` file and no larger than 256 KiB. Setup compiles and test-renders it before
accepting it. Files chosen with the browser picker are copied into
`.infinitycode/chat_templates/`, so the recorded setup remains valid if the
original is later moved.

Templates receive `messages`, `bos_token`, `eos_token`, and
`add_generation_prompt`. Use the common Hugging Face chat-template Jinja subset;
runtime-specific extensions may be rejected with a validation error.

The active template can also be changed from **Settings → Chat template** while
a chat is open. The change starts with the next prompt. It does not reset stored
history: the system message and every retained user/assistant turn are rendered
through the new template together on that next request and subsequent requests.
