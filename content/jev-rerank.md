# Jev for RAG reranking: better order, and the cost of filtering

<div class="meta">Jev / Retrieval · October 29, 2026 · 9 min read</div>

The idea is appealing: retrieve a wider set of chunks, ask Jev how relevant each one is, then ask whether it belongs at all. Score supplies the ordering; Noul removes noise. If that second judgment is reliable, a larger shortlist might improve recall without filling the answer context with irrelevant material.

I implemented that two-round pipeline and compared it with vector search, Score alone and Noul alone. **Reranking helped both sampled benchmarks. The extra filter removed useful evidence as well as noise.** On a separate set of real documentation, Jev and GPT-6 Luna produced similar rankings, with different observed cost and latency. The complete experiment, including embeddings, cost about **$0.593**.

This is an independent implementation of the idea, not an exact replication of another author's code. It evaluates retrieval and reranking; it does not generate answers or measure final RAG answer correctness.

## A score and a filter make different promises

[Jev Score](https://docs.typesafe.ai/primitives/score) evaluates a document against ordered descriptions. I used four levels: irrelevant, peripheral topic overlap, partially useful evidence, and directly useful evidence. Its fractional result is the expectation over those levels, not a percentage of relevance. [Noul](https://docs.typesafe.ai/primitives/noul) answers a yes/no question with a probability. Here the question was whether the chunk contains useful evidence for the query. For scientific claims, both supporting and refuting evidence count as relevant.

The implementation runs Score over every retrieved candidate, then runs Noul over the same candidates. It sorts survivors by Score, preserves retrieval order for ties, and never backfills rejected chunks. One request batches 25 independent document questions; only the query is shared state. Each question contains its own document. Neither reference answers nor relevance labels are sent to either model.

The primary combined policy chooses its Noul threshold on development data. It maximizes nDCG@10 while retaining at least 95% of the retrieved relevant development documents. The candidate thresholds are 0.0 through 0.9 in steps of 0.1, with ties favoring the smaller threshold. **All three development sets selected 0.0: keep everything.** A fixed 0.5 filter is reported separately so its effect remains visible. That is a diagnostic, not a threshold selected after inspecting test results.

## Two benchmarks, with explicit search boundaries

All groups use `text-embedding-3-small`, 1,536 dimensions, and local exact cosine search. The 10-, 30- and 50-candidate conditions are prefixes of the same cached ranking. The same saved pointwise judgments are reused across depths; smaller-depth latency was not measured separately.

| Group | Development / test queries | Search space and labels |
|---|---:|---|
| JQaRA, Japanese | 16 / 80 | Each query's official candidate pool; answer-bearing passage labels |
| BEIR SciFact, English | 16 / 80 | All 5,183 abstracts; official claim–evidence relevance judgments |
| Python documentation, English | 4 / 20 | 109 chunks from six real tutorial pages; authored section-reference labels |

Queries were sampled with a fixed seed before model judgments. JQaRA uses its official development and test splits; SciFact uses training queries for development and official test queries for evaluation. [JQaRA](https://huggingface.co/datasets/hotchpotch/JQaRA) is a difficult candidate-ranking benchmark, so its result is **not** whole-Wikipedia retrieval recall. [SciFact](https://huggingface.co/datasets/BeIR/scifact) supplies scientific evidence labels rather than ordinary question/answer strings; unjudged documents are treated as nonrelevant. The documentation group has weaker, deliberately disclosed labels and is discussed separately below.

## The ranking benefit survives a matched shortlist

These are test results when rerankers can inspect 50 candidates and return at most 10. Top-1 is the fraction of queries whose first result is labeled relevant. P@10 keeps a denominator of ten even when the filter returns fewer documents. Recall and ideal DCG include known relevant documents outside the retrieved pool.

| Dataset / method | nDCG@10 | Top-1 | P@10 | Recall@10 |
|---|---:|---:|---:|---:|
| JQaRA · vector | 0.3726 | 46.25% | 0.2638 | 0.3098 |
| JQaRA · Score | 0.7881 | 86.25% | 0.5650 | 0.6465 |
| JQaRA · Noul ordering | 0.7969 | 88.75% | 0.5687 | 0.6495 |
| JQaRA · Score + Noul ≥ 0.5 | 0.7184 | 86.25% | 0.4988 | 0.5528 |
| SciFact · vector | 0.6836 | 57.50% | 0.0975 | 0.7975 |
| SciFact · Score | 0.7755 | 67.50% | 0.1050 | 0.8725 |
| SciFact · Noul ordering | 0.7750 | 66.25% | 0.1050 | 0.8725 |
| SciFact · Score + Noul ≥ 0.5 | 0.5873 | 56.25% | 0.0750 | 0.6100 |

The development-selected combined policy equals the Score row because its threshold is zero. Its actual implementation still paid for both rounds; these measurements do not pretend the second call was free.

Score's paired nDCG improvement over vector ranking was **+0.4155** on JQaRA, with a 95% query-bootstrap interval of **[+0.3610, +0.4707]**. On SciFact it was **+0.0919 [+0.0358, +0.1483]**. Each interval uses 5,000 resamples of the 80 test queries. These intervals describe the sampled queries, not uncertainty across model versions, prompt choices or repeated runs.

Wider retrieval matters, but is not the entire explanation. On exactly the vector top ten, Score raises JQaRA nDCG from 0.3726 to 0.4576 and SciFact from 0.6836 to 0.7449. Recall@10 cannot improve when the same ten documents are merely reordered. Moving to fifty candidates gives the reranker additional relevant material to promote: candidate recall rises from 0.3098 to 0.7492 on JQaRA, and from 0.7975 to 0.9000 on SciFact.

<figure><img src="/harness-notes/assets/jev-rerank-en.svg" alt="JQaRA and SciFact nDCG at retrieval depths 10, 30 and 50. Score and Noul improve ordering; a fixed 0.5 Noul filter loses quality, especially on SciFact."><figcaption>Quality at a fixed output depth of ten. The vector line is flat because retrieving more candidates does not change its first ten results. The selected combined policy overlaps Score and is omitted from the figure.</figcaption></figure>

The small differences between Score and Noul ordering do not establish a universal winner. Nor is this a comparison against a specialized cross-encoder reranker. It establishes a useful improvement over this particular embedding baseline.

## Cleaner returned results can conceal lost recall

At depth fifty, the 0.5 filter rejected **132 of 576** retrieved relevant JQaRA passages and **26 of 87** retrieved relevant SciFact documents. It also rejected 3,307 of 3,424 labeled negatives in JQaRA and 3,821 of 3,913 in SciFact. The filter was effective at removing noise; it was insufficiently selective about what else it removed.

The distinction between two precision denominators matters. JQaRA's mean precision among returned top-ten documents rose from 0.5650 with Score to 0.8376 with filtering, while the mean number returned fell from ten to 6.05. SciFact's returned-document precision rose from 0.1050 to 0.4801, while the mean output shrank to 1.66 documents. Empty outputs occurred on 1/80 Japanese queries and 22/80 English queries. Empty outputs count as zero in that mean returned precision.

Those cleaner lists do not contradict the loss in fixed-k precision and recall. They answer a different question. In SciFact, even widening retrieval from ten to fifty barely changes the filtered nDCG: 0.5872 to 0.5873. The filter removes much of the evidence that the wider search was meant to recover.

This run therefore supports widening retrieval and reranking. It does not support treating an uncalibrated Noul threshold as insurance against the costs of widening retrieval.

## Real documentation: compare the judgments, then inspect the labels

The second group uses six [Python 3.12 tutorial](https://docs.python.org/3.12/tutorial/) pages, split within sections into non-overlapping windows of at most 1,800 characters. Twenty test questions ask about concrete behavior such as exception handling, argument passing, collections and virtual environments. Four separate questions provide development data.

GPT-6 Luna receives the same query and document text, the same four-level rubric, and returns a strict JSON score plus a relevance boolean with reasoning disabled. It makes one independent call per document, with eight calls in flight. Jev runs its two batched rounds. Neither model sees the other model's answer.

| Method, 50 candidates | Section-label nDCG@10 | Top-1 | Recall@10 |
|---|---:|---:|---:|
| Vector | 0.8236 | 14/20 | 0.9500 |
| Jev Score | 0.9330 | 18/20 | 1.0000 |
| Jev Noul ordering | 0.9242 | 18/20 | 0.9750 |
| GPT-6 Luna score | 0.9364 | 18/20 | 0.9750 |

Jev Score and Luna chose the same first document on 18/20 queries. Across 1,000 test query–document pairs, their Noul ≥ 0.5 / boolean relevance decisions agreed 97.8% of the time. Their score Pearson correlation was 0.8342, but tied-score Spearman correlation was only 0.4892: agreement on broad relevance does not imply identical fine ordering. Most candidates were negatives, so the binary agreement rate is not a balanced accuracy measure.

Luna's nDCG advantage over Jev Score was only **0.0034**, with a paired 95% bootstrap interval of **[−0.0382, +0.0533]**. This small set does not establish a quality winner. More fundamentally, the reference labels name a target section and count its chunks as relevant. They are not exhaustive, independently adjudicated chunk judgments.

Two cases show why that qualification matters:

- For a question about a positional argument following a keyword argument, a [function-examples chunk](https://docs.python.org/3.12/tutorial/controlflow.html#function-examples) received Jev Score **2.23**, Noul **0.70**, and Luna score **0 / false**. It discusses calling conventions but does not directly establish the requested ordering rule. This is a useful example of topical similarity versus direct evidence.
- For a question about `try`'s `else` clause, the first two chunks of [Handling Exceptions](https://docs.python.org/3.12/tutorial/errors.html#handling-exceptions) carry positive section labels even though the relevant explanation appears later. Jev scored them **0.95 / 0.87**, with Noul **0.11 / 0.06**; Luna assigned both **0 / false**. Penalizing their removal is partly a labeling artifact, not clean evidence of a model error.

I retained the original labels and reported their weakness instead of changing them after seeing model outputs. The standard benchmarks carry the main quality conclusion; the documentation group is most useful for examining real disagreements and pipeline costs.

## Observed cost and latency

| Real-document pipeline, all 24 queries | Rerank cost | Median query time | p95 query time |
|---|---:|---:|---:|
| Jev Score then Noul | $0.048921 | 1.59 s | 1.74 s |
| GPT-6 Luna score + boolean | $0.072281 | 7.48 s | 9.12 s |

Both rows inspect fifty candidates per query. Jev uses four HTTP requests per query and up to four concurrent queries; Luna uses fifty requests per query, eight concurrent document calls, and one query at a time. Both use persistent clients and verified TLS. These are client pipeline measurements across different providers and batching strategies, **not isolated model inference speeds**. Jev's ordering-only ablations reuse decisions from the two-round run; their standalone latency was not measured.

The complete ledger contains 225 embedding requests, 866 Jev requests including two protocol checks, and 1,200 Luna requests. Costs were **$0.076430**, **$0.444532** and **$0.072281**, respectively: **$0.593242 total**, with no unresolved charge reservations. Jev uses API-reported cost; OpenAI costs are token-usage estimates using the [embedding](https://developers.openai.com/api/docs/models/text-embedding-3-small) and [Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) prices checked on the experiment date. They are not invoice reconciliation.

The Luna client needed two parsing repairs: treating `error: null` as success and extracting the final-answer message separately from commentary. Saved responses were reused without paid retries. The two queries affected by resumption remain in quality and cost totals but are excluded from the Luna latency distribution, leaving 22 timing queries. Jev timing includes all 24 documentation queries. Model responses resolved to `typesafe/jev-1.14-20261014` and `gpt-6-luna`.

## What I would carry forward

Jev earned a place as a reranker in these experiments. Both Score and Noul ordering improved a shared vector shortlist, and wider retrieval supplied additional evidence they could promote. The second Noul pass did not earn its cost as a hard filter under this development objective: every selected threshold disabled filtering.

For another corpus, I would first measure ordering, then calibrate rejection against an explicit tolerance for lost evidence and empty answers. A stricter context budget or a different precision–recall objective could justify filtering. This experiment does not establish that objective, and a probability of 0.5 alone does not supply it.

<details class="source-note" markdown="1"><summary>Evidence, reproducibility and limits</summary>

[Download aggregate and anonymous per-query metrics](@/assets/jev-rerank-evidence.json). The evidence includes all three depths, MRR, hit@5, fixed and returned-document precision, bootstrap intervals, threshold trials, filter counts, dataset revisions and accounting. The private study froze its protocol in commit `085fe4d` before benchmark judgments. The public export includes a source-summary hash; source records, complete API envelopes and credentials are not published.

One run per input, one embedding baseline, small development sets, one Japanese and one English benchmark, and no generated-answer evaluation limit generalization. The 4-question documentation development set is particularly small. Prompt/model upgrades and production document collections require fresh calibration. The earlier [Jev decision comparison](@/projects/jev-comparison/) used different model versions and workloads; its timing figures are not pooled with these results.

</details>
