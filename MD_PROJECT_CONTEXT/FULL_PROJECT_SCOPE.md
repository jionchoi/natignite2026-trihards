# Project Audit: Accessify / natignite

Audit date: May 9, 2026  
Repository: `dev-con-aws`  
Package name: `natignite`  
Current audited commit: `c8a8c26` (`Merge branch 'jion' into main`)  
Audit type: full local repository audit, static code review, dependency review, and attempted build/type validation

## Executive Summary

This project is a Next.js application for AI-assisted accessibility review of physical spaces. The user uploads a photo, provides space context, and receives:

- A Gemini-generated accessibility report.
- A client-side depth-estimated 3D photo mesh.
- Pinned findings on the uploaded photo and 3D mesh.
- An optional low-poly procedural room scene with simulated user personas encountering accessibility barriers.
- A downloadable Markdown report.

The product idea is coherent and technically ambitious. The main `src/` application has a clear user flow and useful domain modeling around issues, severities, categories, room fixtures, and simulation personas. The 3D and report experience is substantially more advanced than a basic upload-and-summary app.

The repo is not currently production-ready. The biggest blockers are:

- Production build fails.
- TypeScript validation fails with many errors because a copied `frontend/` scaffold is included in the root TypeScript program while its dependencies and aliases do not match the root app.
- `next@14.2.18` is flagged by `npm audit` with a critical advisory set.
- Linting is not configured even though a `lint` script exists.
- There are no tests, no CI, no README, and no deployment/AWS infrastructure despite the repository name.
- The public analysis API has no server-side file size/MIME enforcement, authentication, rate limiting, or cost controls.

The highest leverage fix is to decide whether `frontend/` is source code or an archived scaffold. Right now it is both partly active and partly broken: `src/` imports a few `frontend/components/*` files, while the rest of `frontend/` is treated by TypeScript/Tailwind as if it belongs to the app. That ambiguity is the root of many validation failures.

## Validation Results

Commands run during the audit:

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci --ignore-scripts` | Passed after allowing npm to use normal cache/log directories | Installed 238 packages. Reported deprecation and security warnings. |
| `npm audit --audit-level=moderate` | Failed with vulnerabilities | 2 vulnerabilities: 1 critical (`next`) and 1 moderate (`postcss` via Next). |
| `npm run lint` | Failed before linting | Next prompted to configure ESLint, meaning no ESLint config exists. |
| `npx tsc --noEmit` | Failed | Many errors caused mainly by `frontend/` inclusion, missing dependencies, path aliases, casing conflicts, and incompatible copied shadcn components. |
| `npm run build` | Failed | With network blocked, Google Fonts failed. With network allowed, build still failed with repeated webpack `Unexpected end of JSON input` errors. |

Environment observed during validation:

- Node: `v23.2.0`
- npm: `10.9.0`
- Next: `14.2.18`

Important environment note: Node 23 is not a normal LTS deployment target for this stack. The project should pin and validate against Node 20 or Node 22 LTS. The webpack `Unexpected end of JSON input` build failure may be affected by the unsupported/runtime-edge environment, the custom Next config, Terser minification, or the Transformers/ONNX packaging path. It reproduced after moving `.next` out of the way and running a clean-cache build.

## Repository Shape

Top-level files and directories:

| Path | Purpose / audit assessment |
| --- | --- |
| `src/` | Main active Next.js application. This is the primary product implementation. |
| `frontend/` | Copied/imported v0-style frontend scaffold. A few components are actively imported by `src/`, but most of the folder is stale or incompatible with the root app. |
| `package.json` | Root package manifest. Only package manifest in the active project. |
| `package-lock.json` | npm lockfile for the root app. |
| `next.config.mjs` | Custom Next/webpack config for Transformers.js/ONNX/sharp compatibility. |
| `tailwind.config.ts` | Tailwind v3 config scanning both `src/` and `frontend/`. |
| `tsconfig.json` | Root TS config, currently includes every `.ts` and `.tsx` file in the repo. |
| `.env.local.example` | Documents `GOOGLE_API_KEY`. No real secret was found. |
| `.claude/settings.local.json` | Local tool permission config is tracked. Usually this should be local-only unless the team intentionally shares it. |
| `tsconfig.tsbuildinfo` | Generated TypeScript build metadata is tracked. Should usually be ignored. |
| `frontend/tsconfig.tsbuildinfo` | Generated TypeScript build metadata is tracked. Should usually be ignored. |
| `frontend/b_SCgXCXpO9hS.zip` | Archived copy of the imported frontend scaffold. It duplicates many files already present under `frontend/`. |

Source size:

- `src/`: 4,944 lines across TS/TSX/CSS.
- `frontend/`: 8,295 lines across TS/TSX/CSS.
- Total audited source-like files: about 13,254 lines.

The repo currently has no:

- README.
- License.
- CI workflow.
- Test files.
- Test framework config.
- AWS/CDK/SAM/Terraform/Amplify deployment config.
- Dockerfile.
- Production deployment docs.

## Product Summary

The application is an AI accessibility advisor named `Accessify`. Its target user appears to be a business owner, venue operator, or accessibility reviewer who wants quick feedback from a photo of a physical space.

Core product flow:

1. User opens the upload page.
2. User uploads a JPG, PNG, or WebP photo.
3. User chooses a space type such as cafe, restaurant, office, retail, venue, hotel, public space, or other.
4. User optionally adds notes.
5. Client stores the photo and context in an in-memory Zustand session.
6. The analysis page starts two tasks in parallel:
   - Client-side depth estimation using Transformers.js and `onnx-community/depth-anything-v2-small`.
   - Server-side accessibility analysis using Gemini.
7. Gemini returns structured JSON validated by Zod.
8. The UI displays:
   - A 3D displaced photo mesh.
   - Clickable 3D pins for located issues.
   - A pinned 2D photo report.
   - Severity counts and issue detail cards.
   - Downloadable Markdown report.
9. If Gemini also returns a `roomLayout`, the user can open a procedural low-poly scene.
10. The procedural scene can simulate ambulatory, wheelchair, and blind/cane personas moving through the space and reporting related issue zones.

## Active Application Architecture

### Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Upload experience, landing state, context form, photo selection. |
| `/analyze/[id]` | `src/app/analyze/[id]/page.tsx` and `AnalyzeView.tsx` | Runs depth estimation and Gemini analysis, then renders mesh/report. |
| `/analyze/[id]/scene` | `src/app/analyze/[id]/scene/page.tsx` and `SceneView.tsx` | Renders procedural room layout and persona simulation when available. |
| `/api/analyze` | `src/app/api/analyze/route.ts` | Server API for Gemini accessibility analysis. |

### State Model

Session state lives in `src/lib/store.ts` using Zustand:

- `id`
- uploaded `imageDataUrl`
- image dimensions
- user context
- generated `depthDataUrl`
- parsed `analysis`
- stage: `upload`, `depth`, `analyze`, `done`
- error string

This is entirely client memory. There is no persistence layer. Refreshing, sharing, or directly opening `/analyze/[id]` loses the session and shows "No session in progress".

### Analysis API

`src/app/api/analyze/route.ts`:

- Requires `GOOGLE_API_KEY`.
- Accepts JSON with:
  - `imageDataUrl`
  - `spaceType`
  - `notes`
- Converts the image data URL into inline base64.
- Calls Gemini model `gemini-2.5-flash`.
- Requests `application/json` output.
- Parses the raw model text with `JSON.parse`.
- Validates/transforms the result through `AnalysisSchema`.
- Returns the structured analysis to the client.

The API uses a strong system prompt in `src/lib/prompts.ts` that asks for:

- Accessibility overview.
- Severity summary.
- 4-8 issues.
- Categories: mobility, sensory, wayfinding, lighting, signage, communication.
- Severities: critical, high, medium, low, info.
- Optional location pins.
- Optional `relatedFixtureId`.
- Optional low-poly `roomLayout` with floor, walls, and fixtures.

### Depth and 3D Mesh

`src/lib/depth.ts` runs in the browser:

- Uses `@huggingface/transformers`.
- Loads `onnx-community/depth-anything-v2-small`.
- Prefers WebGPU with fp32, then falls back to default pipeline.
- Converts the returned depth tensor/image into a PNG data URL.

`src/components/viewer/MeshViewer.tsx` and related files:

- Render a Three.js canvas with orbit controls.
- Use the uploaded image as a texture.
- Use the depth map as a displacement map.
- Add a "skirt" shell and back wall around the displaced photo plane.
- Place issue pins on the displaced mesh using a CPU depth sampler.
- Provide controls for depth displacement, auto-rotate, wireframe, and reset.

### Procedural Room Scene

If Gemini returns `roomLayout`, `src/components/viewer/SceneViewer.tsx` renders:

- A scaled floor polygon.
- Walls.
- Fixture meshes for doors, toilets, sinks, grab bars, signage, seating, counters, obstacles, columns, ramps, steps, and other objects.
- Issue zones based on `relatedFixtureId`.
- Optional `AgentSimulation` with personas.

Personas are defined in `src/lib/personas.ts`:

- `ambulatory`
- `wheelchair`
- `blind`

Each persona reports different issue categories when entering an issue zone.

## Data Model Review

Primary schemas are in `src/lib/schemas.ts`.

Strengths:

- Zod is used at the API boundary.
- Severity and category enums are explicit.
- Room layout, walls, fixtures, and fixture types are structured.
- The schema has defensive logic to recover from Gemini swapping severity/category.
- If no summary is provided, summary counts are recomputed from the issue list.

Issues and improvement opportunities:

- `SafeCategorySchema` and `SafeSeveritySchema` are defined but unused.
- If Gemini provides a `summary`, the transform accepts it without verifying it matches the issue array.
- `locationHint.x` and `locationHint.y` are only typed as numbers, not constrained to `0..1`.
- `roomLayout` numbers have no upper bounds, so a bad model response can create very large or weird geometry.
- `IssueObjectSchema.passthrough()` keeps unknown fields. That is flexible, but it can hide model drift.
- Generated issue IDs use `Math.random`, which is fine for UI identity but not stable or reproducible.

Recommended schema hardening:

- Enforce `locationHint.x/y` with `z.number().min(0).max(1)`.
- Always recompute summary counts or validate provided counts against the issue array.
- Add reasonable bounds for room dimensions, wall heights, fixture sizes, and fixture counts.
- Decide whether passthrough is needed; otherwise use `.strip()` or strict schemas.
- Generate deterministic fallback IDs from normalized issue content.

## Dependency and Security Audit

### Root Dependencies

Runtime dependencies:

- `next@14.2.18`
- `react@18.3.1`
- `react-dom@18.3.1`
- `@google/generative-ai`
- `@huggingface/transformers`
- `@react-three/fiber`
- `@react-three/drei`
- `three`
- `zustand`
- `zod`
- `lucide-react`
- `clsx`
- `tailwind-merge`

Dev dependencies:

- TypeScript
- Tailwind v3
- PostCSS
- Autoprefixer
- React/Node/Three type packages

### npm install warnings

`npm ci --ignore-scripts` reported:

- `boolean@3.2.0` deprecated.
- `three-mesh-bvh@0.7.8` deprecated due to Three.js version incompatibility.
- `next@14.2.18` has a security vulnerability and should be upgraded.

The Three.js warning matters because this app depends heavily on the Three/Fiber/Drei rendering path.

### npm audit findings

`npm audit --audit-level=moderate` reported:

- Critical: `next` affected by multiple advisories, including DoS, image optimization, middleware, SSRF/request handling, and authorization bypass classes.
- Moderate: `postcss <8.5.10`, XSS via CSS stringify output.
- Suggested fix: `npm audit fix --force`, which would install `next@14.2.35` outside the current exact dependency pin.

Recommended action:

- Upgrade Next to a patched compatible release.
- Re-run `npm audit`.
- Re-run production build, typecheck, and smoke tests.
- Consider upgrading React/Next more broadly only after the app is buildable and test-covered.

## Build and Typecheck Findings

### TypeScript failure

`npx tsc --noEmit` currently fails. The root cause is `tsconfig.json`:

```json
"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
```

Because `**/*.ts` and `**/*.tsx` include `frontend/`, TypeScript attempts to compile the copied scaffold. That scaffold assumes a different project layout and dependency set.

Major TypeScript failure groups:

- Missing packages from copied `frontend/` files:
  - `ai`
  - `@vercel/analytics/next`
  - `jspdf`
  - `next-themes`
  - `class-variance-authority`
  - many `@radix-ui/*` packages
  - `vaul`
  - `cmdk`
  - `embla-carousel-react`
  - `input-otp`
  - `react-day-picker`
  - `react-resizable-panels`
  - `recharts`
  - `sonner`
  - `react-hook-form`
- Alias mismatch:
  - `frontend/*` files import `@/components/...` and `@/lib/utils`, but in the root app `@/*` points to `./src/*`, not `./frontend/*`.
- Casing conflicts:
  - `frontend` imports `@/components/ui/button`.
  - `src` imports `@/components/ui/Button`.
  - On case-insensitive systems this creates `TS1149`/`TS1261` casing conflicts.
- API mismatch:
  - copied shadcn components expect `buttonVariants`, `outline`, `icon`, and `default` button variants/sizes that do not exist in `src/components/ui/Button.tsx`.
- `frontend/app/layout.tsx` imports `Geist_Mono`, which is not exported by the installed `next/font/google` version.

Recommended action:

1. If `frontend/` is archive/scaffold only:
   - Move the reusable pieces (`particle-background`, `floating-room`, maybe `loading-screen`) into `src/components`.
   - Exclude or delete the rest of `frontend/`.
   - Narrow `tsconfig.json` include to `src/**/*.ts`, `src/**/*.tsx`, and required Next generated types.
   - Narrow Tailwind content to active files.
2. If `frontend/` is meant to be a second app:
   - Give it its own `package.json`, `tsconfig.json`, dependencies, and app root.
   - Remove it from the root app's TS/Tailwind scan.
   - Do not let `@/*` mean different roots in the same TypeScript program.

### Lint failure

`npm run lint` runs `next lint`, but Next prompted to configure ESLint. This means the script exists but there is no committed ESLint config.

Recommended action:

- Add an explicit ESLint setup.
- Decide whether to keep `next lint` or migrate to a direct ESLint command, since newer Next versions have changed lint behavior.
- Include React hooks, TypeScript, accessibility, and import/casing rules.

### Production build failure

`npm run build` fails.

Observed sequence:

- Without network access, `next/font/google` failed to fetch:
  - Plus Jakarta Sans
  - Outfit
  - JetBrains Mono
- With network allowed and a clean `.next` cache, those font fetch failures disappeared.
- Build still failed with repeated webpack errors:
  - `Unexpected end of JSON input`
  - Affected app entries included `/api/analyze/route`, `/analyze/[id]`, `/analyze/[id]/scene`, and `/`.

Relevant config risk:

- `next.config.mjs` sets `swcMinify: false`. Next warns this will not be supported in the next major version.
- The trace shows server bundle minification through Terser because SWC minification is disabled.
- The app uses a custom webpack alias for `sharp$` and `onnxruntime-node$`.
- The app imports `@huggingface/transformers` dynamically in a client flow, which brings ONNX/WASM/WebGPU packaging concerns.
- Validation ran under Node `v23.2.0`, which is not a pinned LTS target.

Recommended action:

- Pin Node 20 or 22 LTS with `.nvmrc` and `package.json` engines.
- Re-run build on the pinned version.
- Remove `swcMinify: false` unless there is a proven reason to keep it.
- Investigate whether `@huggingface/transformers` needs a more specific Next/browser bundling configuration.
- Consider self-hosting fonts or switching to local/system fonts to avoid build-time network dependency.

## Frontend Scaffold Audit

The `frontend/` directory appears to be imported from a v0/shadcn-style scaffold:

- It contains its own `app/`, `components/`, `hooks/`, `styles/`, `public/`, and `components.json`.
- It contains a zip archive of the same scaffold: `frontend/b_SCgXCXpO9hS.zip`.
- It includes many UI components that require dependencies not declared in root `package.json`.
- It includes an older/alternate `/api/analyze` route using `streamText` from the `ai` SDK and an Anthropic model string.
- It includes an alternate app page that streams JSON and exports PDF via `jspdf`.
- It includes Tailwind v4-style CSS imports (`@import 'tailwindcss'`) while the root project uses Tailwind v3 config and `@tailwind` directives.

Active imports from `src/` into `frontend/`:

- `@frontend/components/particle-background`
- `@frontend/components/floating-room`
- `Room` from `@frontend/components/floating-room`

Everything else in `frontend/` is either inactive, incompatible, or accidental from the root app's perspective.

Recommended action:

- Keep only the two actively reused visual components, and move them under `src/components`.
- Delete or archive the copied scaffold outside the source tree.
- Remove `frontend/app`, `frontend/components/ui`, stale `frontend/public`, `frontend/styles`, and the zip from production source unless there is a concrete plan for them.

## API Security and Privacy Review

### Strengths

- The real API key is not committed.
- The server checks for `GOOGLE_API_KEY`.
- The client limits uploads to JPG/PNG/WebP and 10 MB.
- Zod validates the AI response before returning it to the client.
- The UI includes an advisory disclaimer that results should be verified by an accessibility consultant.

### Risks

1. Server-side upload validation is too weak.
   - The API only requires `imageDataUrl` to start with `data:`.
   - It does not enforce MIME type.
   - It does not enforce payload size.
   - It does not verify the decoded base64 is a valid image.
   - The client-side 10 MB limit can be bypassed by calling the API directly.

2. Public endpoint can burn model spend.
   - `/api/analyze` has no authentication, rate limiting, abuse protection, or origin controls.
   - Anyone who can reach the deployed endpoint could submit large requests and trigger Gemini calls.

3. Error responses and logs expose model output.
   - On failure, the server logs the first 4,000 chars of raw model output.
   - It returns `rawPreview` to the client.
   - Accessibility photos and notes may contain sensitive business/customer information.

4. User privacy expectations are not fully documented.
   - Photos are sent to the app server and then to Gemini.
   - The depth model is downloaded from Hugging Face in the browser.
   - There is no privacy notice, retention policy, or data handling explanation in the repo.

5. Notes are directly embedded into the prompt.
   - This is normal for LLM apps, but user notes can contain prompt injection text.
   - The system prompt is strong, but output should still be treated as untrusted and validated.

Recommended action:

- Enforce server-side max request size and accepted image MIME types.
- Decode and validate data URLs before sending to Gemini.
- Add rate limiting or authentication before production.
- Remove raw model previews from client errors.
- Reduce logs of user/model content in production.
- Add a privacy/data flow notice in product UI and README.

## Performance and Reliability Review

### Upload and image handling

Current behavior:

- Client reads the entire image into a data URL.
- Image dimensions are measured with an `Image` element.
- The data URL is stored in Zustand.
- The data URL is sent to the API and also passed into the browser depth model.

Risks:

- Data URLs expand binary size by roughly one third.
- A 10 MB compressed photo can still decode into a very large pixel buffer.
- No downscaling is performed before depth estimation or Gemini submission.
- Large images can pressure memory on mobile devices.

Recommended action:

- Downscale images client-side before storing/sending, preserving enough detail for accessibility findings.
- Enforce max dimensions, not just max bytes.
- Show progress and cancellation for depth model loading and inference.

### Browser depth estimation

Current behavior:

- `env.allowLocalModels = false`.
- `env.useBrowserCache = true`.
- First load downloads the Hugging Face model.
- WebGPU is attempted and then a default fallback is used.

Risks:

- First-run latency can be high.
- Corporate/school networks may block model fetches.
- WebGPU support varies.
- Browser memory/GPU limits can break inference.
- Build/bundling around Transformers.js/ONNX is fragile.

Recommended action:

- Add explicit fallback messaging when the model cannot load.
- Consider server-side depth generation for production reliability.
- Consider a model loading progress UI if the library exposes progress callbacks.
- Cache the pipeline carefully and provide a retry/reset path.

### 3D rendering

Strengths:

- The mesh viewer uses lazy/dynamic import with SSR disabled.
- The procedural scene is separated from the main report view.
- Mesh pins sample the same depth map, which keeps pin placement conceptually aligned with the mesh.

Risks:

- `DepthMesh` defaults to `segments = 384`, which creates a heavy plane and shell geometry.
- `DepthMesh` and `MeshPins` both call `useMeshGeometry`, duplicating texture/depth sampling work.
- The shell geometry disposal effect disposes the previous geometry, but the current geometry is not disposed on final unmount.
- Several Three components generate geometry in render paths.
- Canvas-heavy UI may be expensive on mobile.

Recommended action:

- Share mesh geometry/depth sampler between `DepthMesh` and `MeshPins`.
- Make mesh segment count adaptive based on viewport/device performance.
- Fix geometry disposal for the current shell geometry on unmount.
- Add a low-power fallback for mobile.
- Use Playwright or visual smoke tests for nonblank canvas rendering.

### React lifecycle issues

Notable lifecycle issues:

- `frontend/components/particle-background.tsx` adds a resize listener with an anonymous wrapper but removes `resizeCanvas`, so the listener is not actually removed.
- `frontend/components/floating-room.tsx` sets nested timeouts without cleanup on unmount.
- `frontend/components/loading-screen.tsx` also uses nested timers and is currently part of the stale scaffold.

Recommended action:

- Store the actual resize handler in a named function and remove that exact function.
- Clear all pending timers on unmount.

## UX and Accessibility Review

Strengths:

- The upload control supports click, drag/drop, and keyboard activation.
- The client validates file type and file size before upload.
- Results include severity labels and category labels, not only color.
- The report can be exported as Markdown.
- The app clearly states results are advisory and should be verified.

Issues:

- Analysis sessions are not durable; refresh loses everything.
- `/analyze/[id]` looks shareable but is not backed by a stored report.
- The `id` route param is not used to load anything.
- The stage `analyze` exists but is not meaningfully set during the parallel analysis flow.
- Some UI copy uses "customers" and "business owner" framing, while other pieces mention broader public/venue contexts.
- 3D instructions are visible text, but the controls themselves could be more self-describing for nontechnical users.
- The procedural scene depends entirely on model-estimated geometry and should be labeled as approximate in any exported result if decisions depend on it.

Recommended action:

- Either persist analysis by ID or make the route not imply persistence.
- Add save/share/export of the structured JSON analysis.
- Keep disclaimers attached to exported reports.
- Improve error states for API failure, depth failure, and partial completion.
- Add keyboard-accessible alternatives for 3D-only interactions.

## Code Quality Review

### Strengths

- The main `src/` app has a sensible component structure.
- Domain constants are separated into `categories`, `severity`, and `personas`.
- Zod schemas are a good fit for model output validation.
- The prompt is detailed and explicitly asks the model not to invent invisible details.
- Dynamic imports avoid server-rendering Three.js canvases.
- UI primitives in `src/components/ui` are small and locally understandable.

### Issues

- There is no test coverage.
- There is no lint config.
- There is no formatting config.
- The repo mixes semicolon and no-semicolon styles across `src/` and `frontend/`.
- `frontend/` creates a conflicting second style system and dependency universe.
- Generated build metadata is committed.
- The Next build config is carrying fragile aliases and disabled SWC minification.
- Some fallback/error handling is broad and user-facing errors include internal details.

## Infrastructure and Deployment Review

Despite the directory name `dev-con-aws`, the repo currently contains no AWS infrastructure:

- No CDK.
- No SAM.
- No CloudFormation template.
- No Terraform.
- No Amplify config.
- No deployment pipeline.
- No Dockerfile.
- No environment documentation beyond `GOOGLE_API_KEY`.

Minimum production deployment requirements:

- Node LTS version pin.
- Patched Next version.
- Successful `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Environment variable setup for `GOOGLE_API_KEY`.
- Rate limiting/cost protection for `/api/analyze`.
- Outbound network access to Gemini and, if fonts remain remote, Google Fonts at build time.
- If browser depth remains client-side, user browsers need access to Hugging Face model assets.

AWS-specific considerations:

- If deploying on AWS Amplify, add `amplify.yml` and document env vars.
- If deploying on ECS/Lambda, verify Next standalone output and native/browser package behavior for Transformers.js dependencies.
- If storing uploaded images or reports, define S3 retention, encryption, lifecycle, and access policy.
- If exposing public analysis, add API Gateway/WAF/rate limiting or app-level throttling.

## Findings by Severity

### Critical

1. Production build fails.
   - Evidence: `npm run build` fails with webpack `Unexpected end of JSON input`.
   - Impact: Cannot deploy reliably.
   - Likely related areas: Node 23, Next 14.2.18, `swcMinify: false`, Terser path, custom webpack aliases, Transformers/ONNX packaging.

2. Root TypeScript program is broken by `frontend/`.
   - Evidence: `npx tsc --noEmit` produces many errors from `frontend/`.
   - Impact: Type safety cannot be trusted; CI would fail; future changes are risky.

3. Critical dependency vulnerability in Next.
   - Evidence: `npm audit` reports critical advisories for `next`.
   - Impact: Production exposure risk if deployed as-is.

4. Public AI endpoint has no abuse controls.
   - Evidence: `/api/analyze` accepts public POSTs and calls Gemini.
   - Impact: Cost abuse, DoS, and privacy risk.

### High

1. No tests or CI.
   - Impact: Complex AI/3D behavior can regress silently.

2. Lint script is nonfunctional.
   - Evidence: `npm run lint` prompts to configure ESLint.
   - Impact: No automated code quality or hooks validation.

3. No server-side image size/type validation.
   - Impact: Direct API calls can bypass client limits.

4. Raw model output is logged and partially returned on errors.
   - Impact: Potential leakage of user-provided or model-derived sensitive content.

5. Analysis route IDs are not persistent.
   - Impact: URL structure implies shareable state, but refresh/deep links fail.

6. Build depends on remote Google Fonts.
   - Impact: Build failures in locked-down CI/offline environments unless fonts are cached or network is available.

### Medium

1. `frontend/` includes large unused UI surface and a duplicate API.
   - Impact: Confusion, broken typecheck, dead code maintenance burden.

2. Generated artifacts are tracked.
   - Impact: Noisy diffs and accidental cache churn.

3. `DepthMesh` geometry disposal is incomplete.
   - Impact: Potential memory leak during repeated analyses or parameter changes.

4. `ParticleBackground` resize listener cleanup is incorrect.
   - Impact: Minor memory/event leak on unmount/remount.

5. No README or developer onboarding docs.
   - Impact: Harder for another engineer to run, configure, or deploy safely.

6. No explicit browser support policy.
   - Impact: WebGPU/depth/Three.js features may fail unpredictably.

### Low

1. Some schema helpers are unused.
2. Style conventions differ between `src/` and `frontend/`.
3. Some UI components use manual SVG where lucide icons could be used.
4. `Math.random` IDs are fine for UI but not deterministic.
5. Procedural room geometry can look authoritative even though it is approximate.

## Recommended Remediation Roadmap

### Phase 1: Make the repo buildable

1. Decide the fate of `frontend/`.
   - Preferred: move `particle-background` and `floating-room` into `src/components`, then remove or archive the rest outside the app source tree.
   - Alternative: turn `frontend/` into a separate package/app with its own dependencies and tsconfig.

2. Narrow `tsconfig.json`.
   - Replace broad `**/*.ts` and `**/*.tsx` includes with active source paths.
   - Example intent: `src/**/*.ts`, `src/**/*.tsx`, `next-env.d.ts`, `.next/types/**/*.ts`.

3. Pin Node.
   - Add `.nvmrc` with Node 20 or 22 LTS.
   - Add `package.json` engines.
   - Reinstall and rebuild on the pinned version.

4. Upgrade Next.
   - Move off `next@14.2.18`.
   - Use the patched version indicated by audit or a current supported release after compatibility testing.

5. Fix production build.
   - Remove `swcMinify: false` unless required.
   - Re-test Transformers.js/ONNX webpack behavior.
   - Consider local fonts to remove build-time Google Fonts dependency.

### Phase 2: Add safety rails

1. Add ESLint and formatting config.
2. Add CI that runs:
   - `npm ci`
   - lint
   - typecheck
   - unit tests
   - build
3. Add unit tests for:
   - `dataUrlToBase64`
   - `AnalysisSchema`
   - category/severity recovery
   - summary recomputation/validation
   - markdown report generation
4. Add API tests with Gemini mocked.
5. Add at least one Playwright smoke test for:
   - home page renders
   - upload validation
   - analysis error state
   - report rendering from mocked data

### Phase 3: Harden production behavior

1. Protect `/api/analyze`.
   - Rate limit.
   - Server-side size/type validation.
   - Optional auth or usage quotas.
   - Safer error responses.

2. Improve privacy posture.
   - Document that images are sent to Gemini.
   - Avoid logging raw model/user content in production.
   - Add retention/deletion policy if persistence is added.

3. Improve reliability.
   - Downscale images.
   - Add depth model load progress and failure handling.
   - Add cancellation/timeout handling.
   - Store analysis results if routes remain ID-based.

4. Improve 3D performance.
   - Adaptive mesh resolution.
   - Shared texture/depth sampler.
   - Correct geometry cleanup.
   - Mobile fallback.

### Phase 4: Documentation and deployment

1. Add README with:
   - Product overview.
   - Setup.
   - Required env vars.
   - Scripts.
   - Known limitations.
   - Deployment steps.

2. Add deployment docs for the actual target.
   - If AWS: document Amplify/ECS/Lambda choice and required resources.
   - If Vercel: document build env and runtime env.

3. Add architecture diagram or text flow.
4. Add security notes around AI, image handling, and accessibility disclaimers.

## Suggested Target Repository Shape

Recommended simplified structure:

```text
.
├── README.md
├── package.json
├── package-lock.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── src
│   ├── app
│   ├── components
│   │   ├── layout
│   │   ├── processing
│   │   ├── report
│   │   ├── upload
│   │   ├── ui
│   │   └── viewer
│   └── lib
└── tests
```

If `frontend/` must remain:

```text
.
├── package.json
├── src
└── frontend
    ├── package.json
    ├── tsconfig.json
    └── app
```

But the current half-shared state should not remain.

## Final Assessment

The product concept is strong: it combines AI vision, accessibility heuristics, visual issue pinning, 3D reconstruction, and persona simulation into a compelling workflow. The main `src/` code has enough structure to become a maintainable product.

The repository itself is in a transitional state. It looks like a merge of a root Next app, a copied v0 frontend, and newer 3D/procedural-scene work. The active product is understandable, but the build system sees too much stale code, and the validation pipeline is not yet in place.

The fastest path to a healthy project is:

1. Cleanly separate or remove `frontend/`.
2. Upgrade vulnerable dependencies.
3. Pin a supported Node version.
4. Make build/typecheck/lint pass.
5. Harden the analysis API.
6. Add tests and docs.

After those steps, this can be treated as a real production candidate rather than an impressive prototype with brittle edges.
