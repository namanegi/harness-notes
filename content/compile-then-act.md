# Does planning ahead actually save time?

<div class="meta">Compile, Then Act? · August 2026 · 8 min read</div>

An assistant researching a question may need to search several sources, check what they say, and combine the findings. Several specialist agents can share that work, but someone must decide which jobs can start together and which depend on earlier results. Making that decision after every batch takes time. Making all the decisions before work begins risks missing a follow-up that only a search result reveals. This experiment asked whether planning the specialist work once could keep answer quality while reducing total time or model cost.

**The fixed plan preserved nearly as many correct answers as adaptive scheduling, but did not deliver a consistent speedup.** Its most striking weakness was operational: on the research tasks, many Compiled runs did not complete normally, even when they left a scoreable answer.

## What was compiled?

The comparison had three ways of organizing work. **Single-agent** gave one tool-capable assistant the whole task, without specialist delegation. **Online** let a controller read each completed batch of specialist work before choosing the next, with up to three specialist jobs at a time. **Compiled** made a dependency graph before execution: a list of jobs and arrows showing which results each job must wait for. After checking that graph, the runtime started jobs whose prerequisites were complete. The graph stayed fixed even when a result suggested a different next step.

<figure><img src="/harness-notes/assets/diagrams/plan.svg" alt="Online scheduling reads completed specialist batches before choosing more work. Compiled scheduling creates an immutable dependency graph before execution, then runs ready nodes in parallel."><figcaption>Both multi-agent policies can parallelize specialist work. They differ in when the controller is allowed to decide what work exists.</figcaption></figure>

Consider a research question that needs two independent facts before combining them. A graph can expose both searches at once. If the first result instead reveals that a name is ambiguous or a source is outdated, Online can choose a new search. Compiled can pass the unexpected result through its existing graph, but it cannot insert a new branch. This is the practical bet behind the experiment: fewer decisions during execution may save time, provided the initial dependencies are good enough.

The two multi-agent policies shared specialist roles, tools, limits on simultaneous work, and a fixed resource budget. Every condition used the same language model, `gpt-5.6-luna` (Luna), at medium reasoning effort; Luna powered the controller and specialist calls in this study. The direct Single-agent baseline used a separate, high-ceiling tool loop so its budget would not be artificially capped by the multi-agent controller limit. It is a useful system comparison, though it cannot isolate the cost of planning from every other difference in how work is done.

## A frozen comparison, with two kinds of task

The evaluation fixed 20 [FRAMES](https://arxiv.org/abs/2409.12941) multi-hop factual questions and 20 English, text-only, open-ended [OlympiadBench](https://arxiv.org/abs/2402.14008) competition problems. FRAMES agents could use shell, search, and safe page scraping. OlympiadBench used mathematics and physics specialists with shell tools, without web search. The two datasets therefore stress different kinds of dependency: evidence acquisition in one, problem solving in the other.

Each task ran three times under each of the three base policies. That gives **40 tasks × 3 rollouts × 3 policies = 360 base runs**, randomly interleaved. The formal analysis pairs policies by dataset, task ID, and rollout, so a timing comparison is made on the same question and repeat. The primary result keeps all frozen runs, including infrastructure-affected or unscored runs; later fixed-key retries appear only in a separate reporting view.

Two outcomes need separate names. **Answer correctness** counts a correct scored answer over all formal runs; unscored runs remain in the denominator. **Completion** records whether the runtime finished successfully. A run can fail to complete and still leave a final answer that the scorer can judge. Conversely, a successfully completed run may give a wrong answer. Treating either measure as a substitute for the other would hide an important part of the result.

## Close answer scores, uneven completion

| Dataset | Policy | Correct answers | Completed runs | Median latency |
|---|---|---:|---:|---:|
| FRAMES | Single-agent | 21/60 | 54/60 | 28.7s |
| FRAMES | Online | 27/60 | 51/60 | 51.0s |
| FRAMES | Compiled | 26/60 | 15/60 | 55.5s |
| OlympiadBench | Single-agent | 29/60 | 60/60 | 21.8s |
| OlympiadBench | Online | 40/60 | 54/60 | 39.1s |
| OlympiadBench | Compiled | 38/60 | 49/60 | 52.7s |

Compiled trailed Online by one correct answer on FRAMES and two on OlympiadBench: **64/120 versus 67/120 overall**. The combined difference was −2.5 percentage points. Its 95% descriptive, task-cluster bootstrap interval ran from −10.0 to +5.8 points. The point estimate fell inside the study's frozen five-point answer-quality boundary, but the interval is too wide to establish equivalence. It says even less about completion, which that boundary never covered.

On FRAMES, Compiled completed just **15/60** runs, while Online completed **51/60**. Yet their correct-answer counts were 26 and 27. Those facts are compatible because incomplete executions could still produce scoreable answers. From a user's perspective, however, an answer surviving a broken workflow is different from a reliable system that finishes and reports its result. OlympiadBench had a smaller completion gap, 49/60 for Compiled against 54/60 for Online. The contrast warns against declaring a fixed graph successful from answer scores alone.

The direct baseline adds another trade-off. Single-agent was faster in 55/60 FRAMES pairs and 59/60 OlympiadBench pairs against Online, but lost 10.0 and 18.3 accuracy points respectively. Delegation recovered answers on these tasks; it also added substantial time. This does not identify one overhead source, since the policies may differ in tool use, context length, and specialist work.

## Why the latency average tells only part of the story

Compiled did not consistently turn early parallelism into a shorter end-to-end run. On FRAMES, mean Online latency divided by mean Compiled latency was **1.165**, which favors Compiled if read alone. But Compiled was faster in only **27/60** direct pairs. A few long Online runs raised its mean; the FRAMES median was still lower for Online, 51.0 seconds versus 55.5 seconds.

OlympiadBench pointed the other way even by the mean: the same ratio was **0.936**, and Compiled was faster in only **16/60** pairs. Across the two datasets, Online won **77/120 paired timings**. The median pairwise speedup for Compiled was below one on both. Means matter for total capacity planning, while medians and paired wins describe what a typical repeated task experienced. Here those views disagree on FRAMES, so a single average would make the efficiency claim sound firmer than the data allow.

Recorded model costs also appeared to favor Compiled, but the coverage is uneven. In the frozen primary comparison, paired Compiled-to-Online LLM-cost ratios were **0.555 on 23 available FRAMES pairs** and **0.854 on all 60 OlympiadBench pairs**. FRAMES had complete usage records for only **35/60 runs in each multi-agent condition**. Unknown usage stayed unknown; it was not counted as zero. Missingness is substantial and depends on condition, so the FRAMES ratio describes observed pairs, not all 60. These estimates cover model tokens at a dated price snapshot, excluding search, containers, and other operating costs.

## What happens if the graph stalls?

After the base phase, the study tried a **Bounded** rescue only on the **56 Compiled runs recorded as incomplete**: 45 FRAMES and 11 OlympiadBench runs. This was a conditional follow-up, not a fourth randomized policy. Each trigger started a fresh run from scratch. That run could make at most one replanning decision and execute at most one small continuation graph; it did not resume or edit the original Compiled graph.

Among those selected cases, six previously incorrect outcomes became correct and four previously correct outcomes became incorrect, moving from 26 to 28 correct answers overall. Bounded completed 37/56 rescue runs. Its replanner was invoked in 30 runs, and a continuation graph actually ran in 20. The full parent-plus-rescue path had a median latency of **125.3 seconds**; joint cost was known for only **22/56** paths. Thus the net gain of two answers came with a second planning and execution path, not merely the marginal price of one extra scheduling call.

The public report also includes a later presentation table and figures. That view replaces 11 fixed infrastructure-affected base records with retries and fills a 120-row Bounded line using 64 untriggered Compiled outcomes plus the 56 actual rescue paths. It helps inspect outcomes, but it does not replace the frozen 360-run comparison or make Bounded an independently assigned fourth condition. The numbers above use the frozen primary analysis unless explicitly labeled as conditional rescue.

## Where a fixed graph might fit

These 40 fixed tasks do not identify a universal winner. They suggest a useful boundary to test: **how much of the task structure is known before the first tool result?** When dependencies are explicit and execution mostly fills known slots, a graph can schedule independent work early. When evidence determines the next question, the ability to choose work after observing a result may matter more than the scheduling calls saved. That is a design hypothesis, not a causal conclusion established by this comparison.

For this configuration, the result is a **partial reproduction with an inconclusive efficiency claim**. Compiled's answer-quality point estimate met the predefined boundary; its uncertainty interval did not prove equivalence. Its latency advantage appeared in one dataset's mean but not its typical paired runs, and missing FRAMES usage limits the cost claim. The broader engineering lesson is to measure the whole execution path: a plan that preserves answer accuracy may still be a poor operational bargain if it fails to finish or requires an expensive rescue.

<details class="source-note" markdown="1"><summary>Sources and study limits</summary>

This article uses the frozen primary analysis before supplementary infrastructure retries. The sample is 20 fixed tasks per dataset, with three rollouts each. The bootstrap intervals are descriptive, not hypothesis tests. Exact or numeric scorers were used; no manual semantic grading was performed. Dataset revisions, run profile, and reproduction steps are pinned in the public artifact, while run-specific prompts, responses, traces, and cached pages are excluded.

[Full report](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/results/formal-medium-v3/report.md) · [Methods](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/docs/methods.md) · [Reproduction](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/docs/reproduction.md)

</details>
