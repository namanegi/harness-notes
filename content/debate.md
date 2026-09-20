# Why didn’t three small models reason better together?

<div class="meta">Debate Workbench · Experiments: August 27, 2026 · 4 min read</div>

Let several models solve a problem independently, then show them one another’s reasoning. Even if each model is weak, perhaps one finds the right answer and brings the others along.

I built a debate workbench to inspect those revisions turn by turn. The most revealing failures went the other way: **the correct answer appeared early, and discussion lost it.**

## Finding an answer is not the same as keeping it

The main experiment used a locally quantized Qwen2.5-1.5B model. Three agents debated for four turns, reading their peers’ complete reasoning from the previous turn. The group answer was the most frequent answer. A second condition kept three agents but replaced one solver with an arithmetic checker.

<figure><img src="/harness-notes/assets/diagrams/debate.svg" alt="Three agents answer separately, share their previous reasoning, revise and vote. A checker can replace the third solver but remains inside the same feedback loop."><figcaption>The checker reads the same peer reasoning. It can catch an error—or inherit one.</figcaption></figure>

Across two disjoint 20-question GSM8K cohorts, ordinary debate fell from 24 correct answers to 23. The checker condition rose from 24 to 27.

| Three agents, four turns | Initially correct | Finally correct | Wrong → right | Right → wrong |
|---|---:|---:|---:|---:|
| Three solvers | 24/40 | 23/40 | 2 | 3 |
| Two solvers + checker | 24/40 | 27/40 | 5 | 2 |

In one question, two agents initially interpreted a quantity correctly. The third supplied a more elaborate wrong explanation. On the next turn, the two correct agents adopted it, creating a wrong consensus. In another, the group correctly calculated how many trees had died, then reported that number as how many remained.

The reasoning was available. The receiving models could not reliably tell which reasoning deserved trust.

## A checker helped sometimes, but was not an oracle

The arithmetic checker improved from the first to last turn in both GSM8K cohorts. That signal is worth pursuing. The final difference between conditions, however, came down to just six disagreeing questions: five checker-only wins and one ordinary-debate-only win. This was too little evidence for a stable advantage.

On 20 SVAMP questions, which stress sensitivity to the quantity being asked for, a semantic checker raised the group’s correct count from 12 to 14. It also produced four unanimously wrong answers. Conditions generated their initial answers independently, so different starting points complicate attribution.

A ten-question, zero-temperature comparison was less encouraging. Four ordinary solvers stayed at 8/10. Three solvers plus a checker went from 7/10 to 8/10 and back to 7/10. The checker was participating in the discussion it was meant to verify.

## More agents made the wait more predictable than the gain

With two turns fixed, increasing the group from one to seven agents gave final accuracies of **65%, 55%, 75%, 65%, 70%, 70%, 70%** on the same 20 questions. Mean latency rose from **4.0 to 45.3 seconds**.

Three agents were not established as an optimum. Each condition regenerated its starting answers, ties favored the first agent, and 20 questions leave plenty of room for variation. The result did give me a reason to stop adding agents and rounds to this setup.

The more useful next comparison would freeze identical initial answers, then branch into repeated discussion or a single final adjudication. That would help distinguish the value of having more candidate answers from the value of exchanging them. This comparison has not yet been run.

<details class="source-note" markdown="1"><summary>Report, model settings and code</summary>

The model was Ollama Qwen2.5-1.5B-Instruct, Q4_K_M. Main runs used provider-default sampling; the four-agent ablation used temperature zero. All Qwen2.5 conditions reported here completed their requested samples. These observations do not establish how larger models or other debate protocols behave.

[Full report](https://github.com/namanegi/multiagent-debate-workbench/blob/f9f8f7347bef1d2b91ad4f5141b658fc7f8a58ca/docs/reports/small-model-debate-failure-analysis.md) · [Workbench source](https://github.com/namanegi/multiagent-debate-workbench/tree/f9f8f7347bef1d2b91ad4f5141b658fc7f8a58ca)

</details>
