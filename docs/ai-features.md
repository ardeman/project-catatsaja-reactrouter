# AI features

Conventions for features that use Gemini. The general rules are in `AGENTS.md`.

- Gemini calls live only in `app/apis/ai/<feature>.ts`, through Firebase AI Logic on the Agent Platform Gemini API (`AgentPlatformBackend`; never an API key in the app), importing `firebase/ai` on demand so it stays out of the main bundle; the model is `geminiModel` in `app/lib/constants/ai.ts`. An AI feature sends data only when the person acts (choosing a photo, pressing a button), through `useAiConsent` and `AiNotice` (the one-time notice; `aiConsent` on the profile, taken back in Settings → Account), shows the result to check before anything is added or changed, and is described in the privacy policy. Check a model's answer with a Zod schema before using it, and add the feature's prompt and a fixed answer to `tests/e2e/ai.test.mjs`.
