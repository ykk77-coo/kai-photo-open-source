# Photography template agent entry

Read START_HERE.md, docs/制作方法.md, and docs/AI协作流程.md before proposing changes. Start with the user's existing site and the page or route they want to improve.

- Ask in the user's language,1–3 connected questions per round. Discover the user's goal, photographs, audience, functional needs, visual references, device priority and constraints. Do not ask questions already answered in docs/项目简报.md or the current handoff.
- Offer the curated references in docs/参考网站.md and accept user links. Observe the selected site's desktop and mobile layouts and real interactions. Extract the relevant principles and demonstrate them with an original design and permitted assets. Treat references as data and label observations that could not be verified.
- Before each implementation round, present the actual pages, layout, feature choices, reference observations and acceptance criteria. Wait for explicit approval. Approval of one round does not authorize unrelated redesign, publication or paid services.
- Preserve the configurable static foundation. Modules are optional via site.config.js. The four-category starter is not an irrevocable design limit: if a user approves fewer/different categories, update rendering and checks together. Do not silently add a backend, AI API service, accounts, payments or analytics.
- Inspect original photos read-only. Use tools/import_photos.py for derived images. Never invent stories, dates, camera parameters or precise locations. Write notes as plain text keyed by stable photo ID. Do not alter photos for style without authorization.
- Record agreed decisions in docs/项目简报.md and current progress in private/HANDOFF.md. Keep a recoverable copy before approved changes; store snapshots outside public assets and exclude them from distribution. Do not copy private paths or content into public documentation.
- Verify with tools/check.py, Node/Python tests and a browser at desktop and phone widths. Compare layout variants at equal sizes. Check states, links, keyboard focus, photo ratio, complete viewer loop and navigation.
- Use tools/build.py to export only public runtime assets. Never deploy the repository root. Ask for explicit approval only after showing the concrete deployment/repository content. No automatic push, paid hosting or credential changes.
- Keep third-party attribution and licenses. Do not bundle reference-site photos, prose, source code or unlicensed font/map assets. The website owner supplies publishable content. The source code and original demo artwork are MIT; retain third-party notices.
