# Sources and notices

## Study sources

- **Jev RAG reranking**: measurements dated October 29, 2026, independent of the
  September Jev studies. `assets/jev-rerank-evidence.json` contains aggregate and
  anonymous per-query metrics, development threshold trials, filter counts,
  upstream dataset revisions, token accounting and the private source-summary
  SHA-256. Protocol commit `085fe4d` preceded benchmark judgments. The study
  used Jev 1.14 and GPT-6 Luna, with public JQaRA/SciFact labels and a separate
  Python tutorial cohort with authored, coarse section labels. Complete source
  texts, API envelopes and credentials are not published. The review adds
  `baseline-v2.json` (large embeddings and fresh-pool reranking),
  `prompt-probe-v2.json` (matched development language control),
  `calibration-v2.json` (original-pool exploratory confidence-aware calibration),
  and `rerank-review-accounting.json` (version-separated usage costs).
  Native HTML/SVG explorers render these local measured aggregates without
  third-party client libraries. Original Matplotlib figures and first-version
  article downloads remain archival evidence, not the current interactive UI.

- **Compile, Then Act?**: published source at commit
  [01c48be](https://github.com/namanegi/compile-then-act/tree/01c48be05391f6739fc59c88312a2c794cdf60b9).
  The article uses the frozen primary report, not the later reporting-adjusted table.
- **Debate Workbench**: published source at commit
  [f9f8f73](https://github.com/namanegi/multiagent-debate-workbench/tree/f9f8f7347bef1d2b91ad4f5141b658fc7f8a58ca).
  Counts and examples are paraphrased from its published failure-analysis report.
- **Jev**: measurements dated September 20–21, 2026. The public appendix and
  `assets/jev-evidence.json` contain reviewed findings and aggregates. The JSON
  includes source-summary hashes. `assets/jev-cases.json` additionally contains
  selected synthetic input/output fields and tool traces with source-file hashes
  and record selectors. Narratives are editorial summaries; copied fields retain
  their recorded values. Complete requests, response envelopes, private ledgers
  and runners are not distributed, so this is not a complete reproduction package.

All three studies are by namanegi. Their denominators and methods remain
separate. Article interpretations are distinguished from measured results.

## Assets and dependencies

Article prose and the three method diagrams are original work for this site.
The SVG diagrams illustrate experimental designs; they do not encode measured
effect sizes. No Excalidraw, Rough.js, stock artwork or external font files are
bundled. The sketch style uses original SVG paths and system font fallbacks.

Python-Markdown is installed separately to build pages; it is not vendored.
It retains its own license. No client-side third-party scripts, analytics or
remote font resources are loaded.

## External datasets and models

The site reports derived findings involving FRAMES, OlympiadBench, GSM8K,
SVAMP, BBH, BBEH, JQaRA and BEIR SciFact, plus authored questions over Python
documentation. JQaRA's upstream Wikipedia/JAQKET conditions, SciFact's stated
CC BY-SA 4.0 terms and the PSF documentation license remain applicable. It does
not redistribute benchmark records, model weights,
complete provider transcripts or cached pages. Consult the linked research repositories
and their notices for upstream revisions and terms. This site's license does
not grant rights to those external materials.

Model costs are dated observations or estimates from the corresponding study,
not a current price list.

## Publication languages

English and Chinese are jointly authored versions. Each has its own page
metadata, figure labels and alternative text. Shared study data is not
duplicated. The language links preserve the article route.
