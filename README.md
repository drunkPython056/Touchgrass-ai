# TouchGrass 🌿

**A local-first outdoor activity planner powered by open-weight AI.**

Built for the Hacktoberfest **Touch Grass** challenge.

## What it does

TouchGrass asks for a simple outdoor goal—walk, run, hike, garden or birding—then creates a short plan designed to get the user away from the screen quickly.

The important part: the AI runs **locally** through [Ollama](https://ollama.com/) using an open-weight model. The app does not require a cloud AI API. If Ollama is unavailable, TouchGrass automatically falls back to a deterministic offline planner.

## Why open innovation matters

- **Privacy:** activity preferences and planning prompts can stay on the user's computer.
- **Offline resilience:** the app has a no-model fallback and does not depend on a cloud AI service for the basic experience.
- **Model freedom:** change `OLLAMA_MODEL` without changing the application code.
- **Low cost:** local inference avoids per-request API charges.
- **Inspectable behavior:** the prompt and server code are part of the project and can be changed by contributors.

## Run it

### 1. Install Node.js 18+

### 2. Install Ollama

Install Ollama for your operating system, then pull an open-weight model:

```bash
ollama pull qwen2.5:3b
```

You can use another Ollama-compatible model by setting:

```bash
OLLAMA_MODEL=<model-name> npm start
```

### 3. Start TouchGrass

```bash
npm start
```

Open `http://localhost:3000`.

### No AI / no internet mode

You can run the app without Ollama. It will use its built-in planner whenever the local model is unavailable.

## Architecture

```text
Browser
  │
  ▼
Node HTTP server
  │
  ├── local Ollama API ──> open-weight model
  │
  └── deterministic fallback
```

No database. No analytics. No third-party AI API.

## Hacktoberfest demo idea

1. Start the app.
2. Select **Hike**, enter a nearby place and choose 60–90 minutes.
3. Generate the plan.
4. Show the terminal running Ollama locally.
5. Put the laptop/phone away and actually do the activity.
6. In the project post, explain what worked better because the AI was local.

## Limitations

This prototype intentionally does **not** claim to know live trail conditions, weather, wildlife sightings, opening hours or route safety. Those require trusted local data sources. Users should verify local conditions before going outside.

## License

MIT
