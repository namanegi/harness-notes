# Jev experiment appendix

<div class="meta">Measurements: September 20–21, 2026 · Jev 1.13 · GPT-5.6 Luna</div>

This appendix preserves the separate cohorts behind the Jev series: [Choice capability and candidate scores](@/projects/jev-choices/), [matched Jev–Luna decisions](@/projects/jev-comparison/), and [complete workflows](@/projects/jev/). Results are exploratory: samples are small, several tasks are synthetic, and repeated measurements are not independent benchmark samples.

[Download the aggregate data](@/assets/jev-evidence.json). It includes source-summary hashes and grouped counts, not the private runner, raw requests or a complete reproduction package.

## Measurement

Jev used the official OpenRouter Python SDK Decisions interface; Luna used the OpenAI SDK with strict JSON, and ReAct used the Agents SDK. SDK batches used TLS verification, connection reuse and no automatic retries. The resolved Jev model was `typesafe/jev-1.13-20260917`; Luna requests used `gpt-5.6-luna`.

Jev cost is API-reported; Luna cost is estimated from input, cache and output usage. Neither was reconciled against provider invoices. Wall time includes local and network overhead. Structure validity, correct choice, goal state and explicit stopping were separate observations.

Benchmark inputs came from pinned [BBH](https://github.com/suzgunmirac/BIG-Bench-Hard/tree/9ee07bd481feebf959a6b59d61ea57bdcf30964d) and [BBEH](https://github.com/google-deepmind/bbeh/tree/80d12ca916b7158f22293fcf3144f4d3d854d4be) revisions. Questions were sampled before calls; selected BBH boolean and swap labels were also checked in code. Training overlap is unknown. Benchmark records are not redistributed here.

## 1. Single decisions

### Standalone synthetic probes

These calls precede the matched Jev–Luna comparisons. The policy probe and later comparison reuse the same design but have separate call batches.

| Probe | Design | Jev valid / correct |
|---|---|---:|
| Short actions and rules | Six task families, twelve variants, two calls each | 24/24 valid; 24/24 correct |
| Separate option-order diagnostic | Three semantic-choice variants with the correct answer moved last, two calls each | 6/6 valid; 6/6 correct |
| Policy applicability | Four evidence-applicability states, two wordings, three calls each | 24/24 valid; 24/24 correct |

The short-rule probe varies action descriptions and whether a rule's conclusion is stated explicitly. The order diagnostic is not merged into that primary denominator. The policy probe holds document count and metadata fixed while changing search-summary and opened-text applicability; all user facts are supplied. It tests action selection, not retrieval or final answer generation. API-reported costs were $0.000452088, $0.000104496 and $0.000895104, respectively. Aggregate entries are `single_rule_actions`, `single_rule_order_diagnostic` and `single_policy_applicability`. No competitive code baseline was run; a parser specialized to these rule forms could solve them.

### Distinct action states and public reasoning


| Cohort | Jev correct | Luna correct |
|---|---:|---:|
| 14 distinct short-rule action states | 14/14 | none effort: 14/14 |
| BBH, six questions in each of three families | 17/18 | none: 11/18; low + step prompt: 17/18 |
| Original six BBEH five-choice questions | 2/6 | low / 1,024 tokens: 2/6; low / 4,096: 4/6 |

For the 14 action states, Jev cost $0.000305592 in total, with median request time 485 ms. Luna cost $0.000882800, with median 1,470 ms and zero cache reads or writes. The requests were distinct.

The BBH follow-up changed effort, prompt and output allowance together, partly across batches. It does not isolate reasoning effort. The original BBEH Luna limit produced only three valid answers; the higher allowance was applied to all six questions, restoring six valid answers.

The 28-choice character probe used two English words, with repeated position judgments: 8/12 correct with the target hidden, 10/12 with it supplied. End-of-word STOP was counted separately. This does not establish a language-wide effect or identify the model architecture.

## 2. Conditional handoff

After exploratory work on separate questions, the rule accepted Jev when its maximum choice weight was at least 0.90, otherwise calling Luna. A new batch contained six BBH and six BBEH questions, excluding previously used indices. Independent always-Luna calls alternated order with the pipeline. Both Luna paths used low effort and a 4,096-token allowance; cache reads and writes were zero.

| New cohort | Jev | Handoff | Independent Luna | Handoff cost | Luna cost |
|---|---:|---:|---:|---:|---:|
| BBH, six | 5/6 | 5/6 | 6/6 | $0.000550038 | $0.001723400 |
| BBEH, six | 2/6 | 3/6 | 2/6 | $0.007627226 | $0.004370600 |
| Deliberate mixture, 12 | 7/12 | 8/12 | 8/12 | $0.008177264 | $0.006094000 |

Three answers were accepted directly, all correct; nine were handed off. Fallback repaired three Jev errors and spoiled two correct answers. Every BBEH question was handed off, so differences between those two Luna samples cannot be attributed to filtering. Choice weights were not established as calibrated success probabilities.

A separate top-two shortlist on six new BBEH questions retained the correct answer in 4/6 and achieved 3/6 final correctness. Estimated standalone policy cost was $0.007917426; the experiment reused existing Jev distributions without paying twice.

## 3. DOM navigation

An early seven-state cohort gave flat selection 7/7 and greedy tree navigation 6/7. Later work added local rejection, backtracking and verification. Two early missing-target pages had inconsistent titles and paths; they retain scoring ambiguity. A separate four-page cohort used consistent facts and physically removed absent targets.

| Consistent four-page cohort | Correct terminal result | Calls | Total cost |
|---|---:|---:|---:|
| Flat Jev | 4/4 | 4 | $0.000183498 |
| Local navigation + backtracking + verification | 2/4 | 20 | $0.000378672 |

Both missing-target failures clicked a near match, despite full ancestor paths reaching the verifier. A separate exact-title missing-target probe exhausted 15 calls without resolving the task. That is different from correctly reporting no match.

These were local actions over fixed HTML, not live browser navigation. Exact string and path predicates were also directly solvable in code.

## 4. Initial complete workflows

Four short tasks covered policy search, inventory fallback and validation feedback. Code copied known fields; Jev chose finite actions; Luna generated queries or explanations. Terminal scoring was separate from runtime observations.

| Configuration | Correct and stopped | Calls | Total cost | Total wall time |
|---|---:|---:|---:|---:|
| Luna ReAct | 4/4 | 20 Luna | $0.004205870 | 44.751 s |
| Bounded Plan, separate enum repair batch | 4/4 | 10 Luna | $0.002867550 | 26.669 s |
| Jev + full-context Luna parameters | 4/4 | 16 Jev + 4 Luna | $0.001594020 | 13.239 s |
| Jev + compact sufficient context | 4/4 | 16 Jev + 4 Luna | $0.001146214 | 12.231 s |

The original Plan schema allowed natural-language steps although the executor required action IDs, causing four interface failures. The original records were retained; a strict-enum repair was rerun separately. Two repaired tasks used the allowed replan.

Compact parameter inputs fell from 2,888 to 1,319 tokens while retaining the selected tool contract. Total cost fell about 28%; the full-context condition also recorded 1,057 cache-write tokens, so this is not a pure token-count effect. ReAct generated a final reply after stop in this early cohort, unlike the other controllers. This asymmetry was removed for the next workflow cohort.

## 5. Factorized verification

Two known clean failures served as development cases; eight fresh candidate states formed the probe. Holistic Jev verification got 6/8 final decisions right. One request with three Choice fields, combined in code, got 7/8. Field accuracy was 21/24. It repaired an acceptance with missing status but still accepted a wrong channel.

Luna low, given the same candidate facts and a strict three-field JSON output, got 8/8 final decisions and 24/24 fields right. Jev’s factorized eight calls cost $0.000251790; Luna’s cost was $0.001000400. These are different observed quality levels.

The prespecified small follow-up gate was met, so four new DOM states were evaluated:

| New four-page cohort | Correct terminal result | Calls | Total cost |
|---|---:|---:|---:|
| Flat Jev | 4/4 | 4 | $0.000185556 |
| Tree + holistic verification | 3/4 | 27 | $0.000511686 |
| Tree + factorized verification | 3/4 | 27 | $0.000622230 |

On the failing page, holistic verification exhausted the budget; factorized verification clicked incorrectly. The three fields were not independent evidence. Independent rollouts also prevent attributing every route difference solely to the verifier.

## 6. Eight new workflows

The next cohort used two tasks each in policy, inventory, access and incident handling. Four could finish the business operation; four required missing information. All controllers exited immediately on the explicit stop tool. Generated queries affected simulated retrieval; known parameters came from code.

| Original batch | Correct disposition + stop | Business completed | Correct request + stop | Total cost | Median task time |
|---|---:|---:|---:|---:|---:|
| Luna ReAct | 8/8 | 4/4 | 4/4 | $0.007094590 | 7.38 s |
| Bounded Plan | 7/8 | 3/4 | 4/4 | $0.007954400 | 9.35 s |
| Jev + compact parameters | 7/8 | 4/4 | 3/4 | $0.002750754 | 3.44 s |

The Jev controller correctly requested additional approval in one task, then looped. Its stopping instruction was less explicit than those of the other controllers. A frozen amendment clarified stopping after business success or a justified prerequisite request, and reran all eight Jev tasks.

The amendment still achieved 7/8: total cost $0.002245746, median 2.74 s. The access task now passed; an incident task stopped without reissuing a necessary information request after an earlier rejected action. No deployment ID was invented and no rollback was performed.

The batches remain separate. Selecting the best outcome per task would falsely produce 8/8. The rerun happened later, so its differences cannot all be attributed to wording.

<a id="matched-comparisons"></a>

## 7. Matched single-step comparisons

The single-decision comparisons held decision facts, candidate actions and their order fixed within each Jev–Luna pair. Jev used Choice; Luna used Responses with a strict JSON enum. Gold actions came from rules fixed before calls. These comparisons measure valid action selection, API-reported Jev cost, usage-estimated Luna cost and client wall time. They do not execute a full policy or reimbursement workflow.

**Document applicability.** Four applicability states, each with two equivalent wordings and three repeats, produced 24 calls per configuration over eight designed variants. Jev chose correctly **24/24**. The original Luna `none` condition, with the instruction embedded in a Jev-shaped user JSON wrapper, managed **13/24**. A separately frozen control moved the same instruction into native `instructions` and removed the wrapper; Luna `none` reached **21/24**. Native `low`, also given a larger output allowance (1,024 rather than 128 tokens), reached **23/24**. The change from 13/24 to 21/24 tests a packaging combination, not the effect of one field alone; the further change to 23/24 also changes effort and allowance. All remaining native-instruction errors came from one wording of the state in which neither document applied. Jev cost $0.000895 for its 24 calls; the three Luna configurations cost an estimated $0.002994, $0.002953 and $0.003606, respectively. The native controls ran in a later session, so their times are not a new paired speed comparison with the earlier Jev batch.

**Exception boundary.** Four logical states required four different actions: answer, read an appendix, ask for a missing authorization, or search for an appendix. Each had short and long context and three repeats, again 24 calls per configuration. Jev, native Luna `none` and native Luna `low` were all **24/24** correct. Their batch costs were **$0.002862**, **$0.005341** and **$0.006625**; median client times were **442.9 ms**, **1,335.5 ms** and **1,733.5 ms**. The long input added irrelevant archive entries and moved relevant evidence later, so this was not a pure length intervention. It was repeated verbatim: for Luna `none`, median per-call estimated cost was about **$0.000636** when that input wrote to cache and **$0.000067** on subsequent reads. Jev's corresponding long calls cost about **$0.000180** each. Thus warm Luna reads were cheaper than Jev calls on this exact replay, although Jev's full-batch total was lower. Changing agent state after tool results may yield a different cache pattern; Jev did not report comparable cache subdivisions.

**Changing states.** A third comparison sent 14 distinct short-rule states once to each model. Six were reused successful probe states; eight new warranty and workspace states were frozen before this batch's results were seen. Facts changed the required action within each family. Jev and Luna `none` were both **14/14** correct. Jev's total was **$0.000305592** with **485 ms** median client time; Luna's estimated total was **$0.000882800** with **1,470 ms** median time and zero recorded cache reads or writes. This is a useful changing-request cost observation, but six development cases and eight new synthetic cases cannot be pooled into a production error-rate estimate. With no observed errors, the batch also cannot measure the benefit of escalation.

Across the three comparisons, wrapper choice and cache state materially change the economic and quality interpretation. Repeated calls are not independent tasks, and the measured client times include different providers' network and protocol paths. [The matched-comparison article](@/projects/jev-comparison/) develops the engineering implications.

## Interpretation

The measured workflow savings came with an observed quality gap. Cheap local selection remains useful to investigate, particularly where code can check exact predicates and terminal state. These cohorts do not establish long-workflow reliability, probability calibration or a general hierarchy advantage.

Interface references: [TypeSafe Choice](https://docs.typesafe.ai/primitives/choice) and [OpenRouter Jev](https://openrouter.ai/typesafe/jev-1.13). The study reports the dated measurements above, not permanent provider prices or performance claims.
