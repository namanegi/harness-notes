# Does planning ahead actually save time?

<div class="meta">Compile, Then Act? · August 2026 · 4 min read</div>

An agent that asks “what next?” after every tool call spends time deciding how to work. I wanted to move those decisions to the beginning: build a dependency graph once, then run independent tasks together.

**The experiment did not find a consistent speedup.** A fixed plan kept answer accuracy close to adaptive scheduling, but many runs failed to finish.

## Decide now, or wait for evidence?

I compared three approaches. A single agent used tools directly. An **Online** controller read each completed batch of specialist work before assigning the next. A **Compiled** controller built one dependency graph before execution and never rewrote it. The two multi-agent approaches shared specialists, tools and resource limits.

<figure><img src="/harness-notes/assets/diagrams/plan.svg" alt="Online scheduling reads the result of each batch before choosing the next. Compiled scheduling builds a fixed graph first, then runs ready tasks in parallel."><figcaption>The timing of the decision is the difference: adapt after observing a result, or commit early and expose parallel work.</figcaption></figure>

The evaluation used 20 multi-hop research questions from FRAMES and 20 competition problems from OlympiadBench. Each ran three times under all three approaches, using Luna at medium reasoning effort: 360 base runs.

## Similar answers, very different completion

| Dataset | Single agent correct | Online correct | Compiled correct |
|---|---:|---:|---:|
| FRAMES | 21/60 | 27/60 | 26/60 |
| OlympiadBench | 29/60 | 40/60 | 38/60 |

Compiled answered three fewer runs correctly than Online overall. Yet on FRAMES it completed normally in only **15/60 runs**, against Online’s 51/60. An unfinished run could still leave a scoreable answer, so accuracy alone hid a substantial execution problem.

The timing result also resisted a simple story. Online was faster in **77 of 120 paired runs**. A few long Online runs made its mean latency worse on FRAMES; its median was still lower on both datasets. Recorded costs favored Compiled, but only 35/60 FRAMES runs in each multi-agent condition had complete cost records.

I then tried a bounded recovery on the 56 unfinished Compiled runs: start again, allowing at most one replan. It corrected six answers and spoiled four, a net gain of two. Recovery required paying for another execution path.

## Where I would try a fixed plan next

The useful question seems to be **how much is already known when execution begins**. A fixed graph looks more promising when dependencies are clear and the remaining work is mostly execution. Research tasks often reveal the next useful question only after a search result arrives.

That is a design hypothesis, not a boundary this study established. A controlled comparison between known and newly discovered dependencies would test it more directly.

The single-agent baseline also deserves attention. It was much faster and cheaper in the available records, and answered fewer questions correctly. Extra orchestration has to earn its place through the answers it recovers.

<details class="source-note" markdown="1"><summary>Sources and study limits</summary>

These numbers use the frozen primary analysis, before supplementary infrastructure retries. Compiled’s overall accuracy difference from Online was −2.5 percentage points, with a descriptive interval of −10.0 to +5.8; this does not establish equivalence. Recovery was conditional on unfinished runs, not a fourth parallel baseline. Cost covers recorded model usage rather than total operating expense.

[Full report](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/results/formal-medium-v3/report.md) · [Methods](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/docs/methods.md) · [Reproduction](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/docs/reproduction.md)

</details>
