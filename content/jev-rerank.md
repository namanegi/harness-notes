# Jev for RAG: retrieval, ranking and calibrated filtering

<div class="meta">Jev / Retrieval · October 29, 2026 · Retrieval and reranking study</div>

Retrieve more chunks, let **Score order them, then let Noul decide what to keep**. That idea poses three separate questions: did retrieval find the evidence, did ranking promote it, and did filtering accidentally discard it?

<!-- rerank-flow-diagram -->

<!-- rerank-key-visual -->

The results separate two sources of improvement: stronger embeddings, then Jev Score on the large candidate pool. Japanese JQaRA and English SciFact test each contribution separately; interactive charts expose the metrics and policy details.

## 1 · What do retrieval and reranking each contribute?

Increasing candidate depth from ten to thirty or fifty gives the reranker more evidence to inspect. These are prefixes of the same vector ranking, so directly returning the first ten leaves the vector baseline unchanged. **Candidate recall can rise with N; final top-ten ranking quality measures something else.** The chart provides separate views for each.

<div class="rerank-explorer" data-rerank-panel="retrieval" data-evidence="/harness-notes/assets/jev-rerank-evidence.json" data-baseline="/harness-notes/assets/baseline-v2.json">
<div data-rerank-fallback>Small baseline candidate Recall@10 / 30 / 50: JQaRA 0.3098 / 0.5711 / 0.7492; SciFact 0.7975 / 0.8375 / 0.9000. At 50 candidates, Score nDCG@10 is 0.7881 and 0.7755 respectively. Full data downloads appear below.</div>
</div>

**The stronger embedding materially improves the Japanese baseline.** JQaRA vector nDCG@10 rises from 0.3726 to 0.5382, and candidate Recall@50 from 74.9% to 85.0%. Score on the large pool reaches 0.8252: +0.2870 over the large vector baseline, with a paired 95% interval of [+0.2346, +0.3420]. The gain therefore does not depend entirely on the weaker small retrieval baseline.

For SciFact, large vector reaches 0.7402 and Score 0.8010. The +0.0608 difference has an interval of [−0.0026, +0.1247], crossing zero: this sample cannot confirm an English reranking benefit over the stronger baseline. Switching embeddings in the chart changes the candidate pool and every reranking curve together, avoiding cross-pool comparisons.

The model comparison holds queries, documents, splits, exact cosine search and decision rubrics fixed. `text-embedding-3-small` uses 1,536 dimensions; `text-embedding-3-large` uses its native 3,072. Each large top-50 pool receives independent Score and Noul judgments. This tests the embedding configuration as a whole, not an isolated effect of parameter count or dimensionality.

A small prompt-language control uses eight Japanese development queries and the same ten candidates, with fresh English and manually translated Japanese rubrics. Mean absolute changes are 0.0601 for Score and 0.0316 for Noul, but nDCG does not change on any of the eight queries. This tests language only; it leaves query rewriting, task-specific rubrics and other embeddings as separate hypotheses.

## 2 · Calibrate filtering against evidence retention

Threshold selection depends on the objective. Maximizing nDCG while retaining at least 95% of relevant development candidates, with ties favoring lower thresholds, selects zero on every development set. Deleting noise below rank ten earns no nDCG reward: **a ranking objective may not capture the value of filtering**.

An alternative objective directly maximizes noise rejection, subject to development retention ≥95% and an nDCG@10 loss no greater than 0.005. It searches a finer grid and observed Noul boundaries, plus a joint rule: reject only when Noul is low, Score assigns useful levels probability mass below a fitted cutoff, and the Score decision is sufficiently certain.

<div class="rerank-explorer" data-rerank-panel="threshold" data-rerank-view="v2" data-evidence="/harness-notes/assets/jev-rerank-evidence.json" data-calibration="/harness-notes/assets/calibration-v2.json">
<div data-rerank-fallback>Frozen policies on small pools: the SciFact joint gate keeps 87/87 relevant candidates and removes 42.65% of labeled noise. JQaRA keeps 539/576 (93.58%), missing the 95% test target. Python keeps only 20/30 and is unsuitable for promotion.</div>
</div>

**SciFact supplies a workable example; Japanese results show why acceptance checks matter.** On the small pool, the SciFact joint gate rejects only when `Noul ≤ 0.02`, `P(Score≥2) < 1` and `Score confidence ≥ 0.65`. It removes 42.65% of labeled noise, keeps all 87 retrieved relevant test candidates, preserves nDCG at 0.7755, and produces no empty lists. Its selected entropy ceiling adds no further restriction.

JQaRA selects a Noul boundary of 0.14, but test retention is only 93.58% and nDCG falls from 0.7881 to 0.7750. The Python group's four development questions yield a severely overfit 0.89 boundary. Policies are fitted and frozen on development data, then evaluated on test data. However, the test cohort’s ranking results had been inspected before the calibration study: this is **exploratory analysis on reused test data, not an independent blind evaluation**. These calibrated gates also cannot be transferred directly to the large embedding pool.

Provider probabilities and confidence are decision features, not automatically calibrated real-world correctness rates. Keeping 87/87 describes this sample. Even a bootstrap interval of 100% cannot establish the absence of future failures.

## 3 · An offline recalibration loop

A production version needs labels, acceptance checks and rollback. Real traffic supplies the input distribution; independent relevance judgments or human audits are still needed to identify lost evidence. A model's own score cannot serve as its ground truth.

<ol class="rerank-loop">
<li><b>Collect a window</b><span>Sample real queries, candidates and independent labels; version the data.</span></li>
<li><b>Fit a challenger</b><span>Group by query and trade noise removal against evidence retention.</span></li>
<li><b>Validate separately</b><span>Check retention bounds, ranking loss, empty outputs and noise gains.</span></li>
<li><b>Version the switch</b><span>Promote only after acceptance; record model, retriever and policy versions.</span></li>
<li><b>Monitor and roll back</b><span>Distribution shifts trigger review; quality regressions restore the prior policy.</span></li>
</ol>

The experiment implements `recalibrate()` and `rollback_required()`, including query separation, small-window rejection, interval-based acceptance and drift signals. A caller could run it weekly or after enough new labels arrive. No production traffic or scheduled automation is running here. Embedding, chunking and Jev upgrades should trigger fresh calibration.

## 4 · Jev versus Luna on real documentation

Six Python 3.12 tutorial pages supply 109 chunks, four development questions and twenty test questions. Each query retrieves fifty candidates. Jev makes its two batched passes; GPT-6 Luna uses the same four-level rubric and returns a score plus a relevance boolean.

<div class="rerank-explorer" data-rerank-panel="comparison" data-evidence="/harness-notes/assets/jev-rerank-evidence.json">
<div data-rerank-fallback>Jev Score / Luna: nDCG@10 0.9330 / 0.9364, Top-1 both 18/20. Reranking all 24 questions costs $0.048921 / $0.072281, with median query latency 1.59 / 7.48 seconds.</div>
</div>

Luna's nDCG advantage is just 0.0034, with a paired 95% interval of [−0.0382, +0.0533]; this does not establish a quality winner. Both choose the same first document on 18/20 queries. The reference judgments are **section-level silver labels**, not independent chunk-by-chunk adjudication. Costs and concrete disagreements are more informative than tiny ranking differences.

Latency measures client pipelines: Jev uses four batched requests per query and up to four concurrent queries; Luna uses fifty requests, eight concurrent document calls, and one query at a time. These are not isolated inference speeds. Two resumed Luna queries are excluded from timing distributions but retained in quality and cost totals.

Small-pool retrieval and the Jev–Luna comparison cost $0.5932; large embeddings cost $0.4927, large-pool reranking $0.3949, and the language control $0.0071. **Cumulative cost is $1.4879**, below the $3 budget. Offline calibration adds no API charge; all 3,313 requests have reconciled usage costs and no unresolved charge reservations.

<details class="source-note" markdown="1"><summary>Methods, search boundaries and inspectable evidence</summary>

| Dataset | Development / test | Search space and judgments |
|---|---:|---|
| [JQaRA](https://huggingface.co/datasets/hotchpotch/JQaRA), Japanese | 16 / 80 | Official per-query pools and answer-bearing passage labels; not whole-Wikipedia search |
| [BEIR SciFact](https://huggingface.co/datasets/BeIR/scifact), English | 16 / 80 | All 5,183 abstracts; official evidence supporting or refuting claims |
| [Python tutorial](https://docs.python.org/3.12/tutorial/), English | 4 / 20 | 109 non-overlapping chunks of at most 1,800 characters; authored target-section labels |

Sampling uses a fixed seed. JQaRA keeps official dev/test splits; SciFact uses train for development and test for evaluation. Unjudged documents count as nonrelevant. Search and statistics run locally; embedding, Jev and Luna use hosted APIs. This is not a local GPU inference test. It measures retrieval and reranking, without generated answers or end-to-end RAG correctness.

[Score](https://docs.typesafe.ai/primitives/score) levels mean irrelevant, topic-only, partially useful and directly useful; its fractional value is an expected level. [Noul](https://docs.typesafe.ai/primitives/noul) asks whether useful evidence exists. Twenty-five independent document questions share only the query in state. No answers, labels or candidate IDs are sent. All candidates receive Score, then Noul; survivors sort by Score with retrieval-order ties and no backfill. Jev resolves to `typesafe/jev-1.14-20261014`.

nDCG and recall use complete known relevance sets; P@10 divides by ten, while returned precision divides by actual output count, with empty lists scored zero. Candidate recall precedes filtering. Ranking-quality intervals use 5,000 query resamples; calibration uses 3,000. They do not capture prompt, model-version or repeat-run uncertainty. Searching tens of thousands of joint policies on only sixteen development queries risks overfitting; production acceptance needs larger fresh windows.

A silver-label example: the `try`/`else` explanation appears later in [Handling Exceptions](https://docs.python.org/3.12/tutorial/errors.html#handling-exceptions), but its first two chunks also receive positive section labels. Jev gives them Score 0.95 / 0.87 and Noul 0.11 / 0.06; Luna gives both 0 / false. Rejecting them need not be a model error. Another [function-call chunk](https://docs.python.org/3.12/tutorial/controlflow.html#function-examples) gets Jev 2.23 / 0.70 versus Luna 0 / false, illustrating topic similarity versus direct evidence. Original labels remain unchanged after observing outputs.

The Luna client required repairs for `error: null` and commentary/final-answer parsing. Saved responses were reused without paid retries. Jev API-reported cost and OpenAI token-based estimates are not invoice reconciliation.

Downloads: [benchmark aggregates](@/assets/jev-rerank-evidence.json) · [embedding comparison](@/assets/baseline-v2.json) · [prompt-language probe](@/assets/prompt-probe-v2.json) · [calibration curves and distributions](@/assets/calibration-v2.json) · [accounting audit](@/assets/rerank-review-accounting.json). Public exports omit raw questions, documents and complete API responses. The base protocol was frozen at `085fe4d`; embedding controls and calibration experiments retain separate configurations and results for inspection.

</details>
