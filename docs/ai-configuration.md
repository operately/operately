# AI Configuration

Alfred (the AI sidebar) only works when Operately can talk to an AI provider **and** the company has the `ai` experimental flag enabled. Use the steps below to wire everything up in a local or self‑hosted environment.

## 1. Choose a provider and set API keys

| Provider | Required env vars | Notes |
| --- | --- | --- |
| OpenAI (default) | `OPENAI_API_KEY` | Optional: set `OPERATELY_AI_OPENAI_MODEL` (defaults to `gpt-5`). |
| Anthropic (Claude) | `ANTHROPIC_API_KEY` and `OPERATELY_AI_PROVIDER=claude` | Uses Claude via LangChain. |

Add the keys to your `.env` file and restart the app (or reload the release).

**OpenAI (GPT)**

```bash
# .env
OPERATELY_AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key
OPERATELY_AI_OPENAI_MODEL=gpt-4o   # optional override (defaults to gpt-5)
```

**Anthropic (Claude)**

```bash
# .env
OPERATELY_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-your-claude-key
```

## 2. Enable the `ai` experimental feature for your company

AI is gated behind the experimental feature system. Every company that should see Alfred needs the flag turned on. You can do this in two ways:

**Option A: Admin panel (site admin)**

1. Sign in as a site admin and open the Admin Panel.
2. Choose the company you want to update.
3. Click the “…” menu in the top-right corner and select **Enable Feature**.
4. Enter `ai` and save.

**Option B: IEx**

```elixir
iex -S mix

company = Operately.Companies.get_company!(company_id)
Operately.Companies.enable_experimental_feature(company, "ai")
```
