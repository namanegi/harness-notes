# Jev vs. Luna: compare the decision, then count the cost

<div class="meta">Jev / Part 2 · September 21, 2026 · 10 min read</div>

An assistant that searches company policies must repeatedly decide whether its evidence is sufficient, whether to open another document, or whether a missing fact requires asking the user. In a ReAct-style tool loop, a general language model chooses an action after each tool result. Replacing selected decisions could reduce cost, provided the replacement preserves the quality the task requires.

[Jev, TypeSafe's structured decision model](https://openrouter.ai/typesafe/jev-1.13), is one candidate. Its Choice question type selects from a developer-supplied list and returns weights over the candidates. The [single-model probes](@/projects/jev-choices/) found promising results on short action rules and evidence applicability. The comparator here is **GPT-5.6 Luna**, a general language model called Luna below. It can generate text, but in the matched tests it is constrained to select from the same action list.

The study asks two practical questions: does Jev retain acceptable decision quality at lower cost and latency, and can handing uncertain choices to Luna improve that trade-off? Three synthetic decision comparisons examine applicability, exceptions and changing facts. A separate public-reasoning batch tests actual handoff. **Jev was inexpensive and fast in the measured decision batches, but Luna's instruction packaging and cache state changed the comparison. The tested handoff policy matched direct Luna's accuracy at higher total cost.**

The unit here is a decision or a conditional handoff on one question. The [workflow study](@/projects/jev/) measures what happens when those choices also have to operate tools and finish a task.

## Start with the same facts and actions

Both models received the same decision facts, ordered candidates and intended instruction. Jev used Choice. Luna used its Responses API with an output schema that permits only the listed action identifiers. A correct-sounding explanation cannot compensate for selecting the wrong action. Expected answers, also called gold labels, came from predefined rules and never entered either request.

The Luna settings `none` and `low` specify reasoning effort; the output allowance limits the tokens available for a response. Both can affect results, so the tables retain those configuration differences.

Quality was measured as response validity and correct selection. Costs are API-reported for Jev and usage-estimated for Luna; times include local and network overhead. [Appendix notes](@/research/jev-report/#measurement-notes) retain the measurement conditions.

## Comparison 1: does this document actually apply?

The first local synthetic scenario asks which step an expense-policy assistant should take for a business-travel question. All facts and documents are supplied by the experiment; no real company service is queried. Document count, titles, dates and candidate actions stay fixed. Only the applicability of a search summary and an opened document changes. A relocation policy could look relevant while failing to apply to ordinary business travel.

The decision rule was explicit. Use an applicable opened document when it answers the question. Otherwise read an applicable search hit. If neither applies, search again. The user's facts were complete, so requesting clarification was a distractor.

Two applicability switches produced four states; two equivalent wordings produced eight variants. Each was called three times. These were 24 calls over eight designed variants, not 24 independent policy tasks.

| Configuration | Correct choices | Cost for 24 calls |
|---|---:|---:|
| Jev Choice | 24/24 | $0.000895 |
| Luna none, instruction inside user JSON | 13/24 | $0.002994 |
| Luna none, native instructions | 21/24 | $0.002953 |
| Luna low, native instructions + larger output allowance | 23/24 | $0.003606 |

The initial gap looked large. But Jev received instructions in its native decision interface while Luna saw them embedded in a Jev-shaped user JSON object. A separately frozen control moved the same instruction text into Luna's native `instructions` field and removed the protocol wrapper. With no new facts or examples, Luna rose from 13/24 to 21/24.

This correction changed the interpretation. The original result measured an awkward interface configuration as well as a model. Because the control changed both field placement and wrapper structure, it cannot attribute the improvement to one field alone. The low-effort condition also increased the output allowance, so that further change is a configuration comparison.

All remaining native-instruction errors occurred in one wording of the state where neither source applied. Luna answered too early. Jev's 24/24 remained encouraging on this narrow task, but a claim of broad policy-reading superiority would outrun the sample. The later controls ran separately and do not provide a paired speed comparison.

<!-- case:policy-comparison -->

## Comparison 2: does the missing fact matter?

The next task added an exception whose applicability depended on two facts. If one known fact already ruled the exception out, the other could remain unknown without blocking an answer. In other states, that same unknown was genuinely necessary.

Four logical states required four different actions: answer, read an appendix, request clarification, or search for the appendix. Each appeared with short and long context, and each variant ran three times. The long version added irrelevant archive entries and moved the relevant evidence later. It was not a pure token-length intervention.

This comparison used native Luna instructions from the beginning. Jev, Luna none and Luna low all scored 24/24, so there was no observed quality winner.

| Same-batch configuration | Correct | Total cost, 24 calls | Median client time |
|---|---:|---:|---:|
| Jev | 24/24 | $0.002862 | 442.9 ms |
| Luna none / 128-token allowance | 24/24 | $0.005341 | 1,335.5 ms |
| Luna low / 1,024-token allowance | 24/24 | $0.006625 | 1,733.5 ms |

The totals favor Jev, but opening up the cache accounting reveals a second result. For the identical long Luna inputs, the first round recorded cache writes and later rounds recorded reads. Median per-call cost for Luna none was about $0.000636 on writes and $0.000067 on reads. Jev's corresponding long-input calls cost about $0.000180. Warm Luna reads were cheaper than Jev even though the complete Luna batch cost more.

Neither number should be discarded. The batch total includes establishing the cache; the warm-call figure describes reuse after that cost. The relevant question for an application is how often its actual requests reuse eligible content. Replaying the same full input does not establish the cache hit rate of an agent whose state changes after every tool result. Jev did not report comparable cache subdivisions, so their absence is not evidence of no internal caching.

## Comparison 3: change the state instead of replaying it

To examine distinct requests, the next batch used 14 different states. Six came from earlier probes and eight were newly frozen: warranty exceptions and workspace actions where changing facts changed the required outcome. The same state, candidates and order went to each model once. This was not a balanced sample of prior successes and failures; the six reused states had previously succeeded.

| Configuration | Correct | Total cost, 14 calls | Median client time |
|---|---:|---:|---:|
| Jev | 14/14 | $0.000306 | 485 ms |
| Luna none | 14/14 | $0.000883 | 1,470 ms |

At the same observed correctness, Jev cost about 35% as much and took about a third of the median request time. This is the clearest small example here of a cheaper single-step choice on changing states. It is still a synthetic set of short rules with no observed errors, so it cannot establish production reliability or the value of escalation.

## Can selective handoff combine their strengths?

The [single-model study](@/projects/jev-choices/) also tested BIG-Bench Extra Hard (BBEH), a public reasoning benchmark. In its initial six questions, Jev had to identify the true expression among five Boolean expressions. It answered 2/6 correctly, which suggested a possible use for its candidate weights: on three of Jev's four errors, the correct answer ranked second. Keeping two candidates might give another model less work to do. But an offline rank is only the beginning of a policy. The next model can still choose incorrectly, and every screening call adds cost and serial delay.

A new batch therefore tested an actual rule: accept Jev when its largest returned candidate weight (`pmax`) is at least 0.90; otherwise ask Luna to solve the original question. This second call is the fallback. The batch contained six unused BIG-Bench Hard (BBH) questions, covering ordering, object swaps and Boolean expressions, and six unused BBEH questions, separate from the policy tasks. An independent always-Luna baseline ran alongside it. Both Luna paths used the same configuration with enough output allowance to avoid the previously observed budget bottleneck.

| New questions | Jev alone | Handoff pipeline | Independent Luna | Pipeline cost | Luna cost |
|---|---:|---:|---:|---:|---:|
| BBH, six | 5/6 | 5/6 | 6/6 | $0.000550 | $0.001723 |
| BBEH, six | 2/6 | 3/6 | 2/6 | $0.007627 | $0.004371 |
| Deliberate mixture, twelve | 7/12 | 8/12 | 8/12 | $0.008177 | $0.006094 |

Only three answers were accepted directly; all three were correct. Nine went to Luna. Fallback repaired three Jev errors and spoiled two correct answers. Every BBEH question was handed off, so the BBEH difference between pipeline and baseline came from separate Luna generations, not successful filtering by Jev.

The pipeline matched the baseline's 8/12 at a higher total cost. Three successful acceptances are too few to establish reliable high-score automation. They also all came from the easier family, so the experiment does not distinguish calibration within a family from simply separating easier and harder tasks.

A separate test that restricted Luna to Jev’s two highest-ranked candidates on the six new BBEH questions retained the correct answer in 4/6 and finished correctly in 3/6. Once the correct answer is removed from the shortlist, a downstream chooser cannot recover it. Candidate retention and final correctness must both be measured.

## What survives the controls?

Three findings remain useful. First, Jev handled the tested applicability and exception decisions at low observed cost. Second, Luna's native interface closed much of an initially dramatic quality gap. Third, caching can reverse per-call cost rankings under repeated long inputs, while distinct short states produced a different economic comparison.

Selective handoff adds a further condition: screening only saves work when it leaves enough questions with Jev and the later calls improve the final result. In the tested reasoning mixture, it handed off nine of twelve questions, sometimes damaged a correct answer, and cost more than direct Luna. That policy did not establish a net benefit.

For a proposed routing task, a useful comparison therefore preserves facts and actions, gives each model a suitable native interface, and reports the cache state alongside cost. More reasoning effort needs a quality benefit to justify its expense; these all-correct exception cases did not demonstrate one.

The remaining question is whether cheaper choices still save money when tools reject actions, parameters need generation and the controller must decide it is done. Single-decision tables cannot answer that. The [workflow experiments](@/projects/jev/) measure the whole path.

<details class="source-note" markdown="1"><summary>Methods, sample boundaries and data</summary>

Jev resolved to version 1.13; Luna used the GPT-5.6 Luna alias. Repeated variants are not independent business tasks. Neither comparison executed a real reimbursement workflow or checked a final cited answer. All reported costs are API observations or usage estimates, not invoice reconciliations. Different sessions are kept separate in timing interpretations.

[Appendix: matched single-step comparisons](@/research/jev-report/#matched-comparisons) · [Aggregate data](@/assets/jev-evidence.json)

</details>
