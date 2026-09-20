# When small models debate, who checks the answer?

<div class="meta">Debate Workbench · Experiments: August 27, 2026 · 8 min read</div>

Running a small language model locally can keep an experiment inexpensive and under direct control, but the model may miss a step in a word problem. One proposed remedy is to ask several copies to solve it, share their work, and revise. If one finds the right calculation, the others might recover it. They might also copy a convincing mistake. The question for this workbench was whether discussion helps a small model *check* an answer, rather than merely agree on one.

The [multi-agent debate paper](https://openreview.net/forum?id=zj7YuTE4t8) found gains with stronger models and reported that sharing full reasoning helped. This experiment tested the same basic idea near the other end of the capability range, using a local, quantized Qwen2.5-1.5B-Instruct. “Quantized” here means the model's weights were stored at reduced precision to run in the local setup. The test kept every answer at every turn so that it could distinguish finding a correct answer from preserving it. The striking result was that **correct answers often appeared, then disappeared during discussion.**

## A small, inspectable debate

For the main test, three copies of the model answered each GSM8K arithmetic word problem for four turns. At turn one they worked independently. On subsequent turns, each saw its own conversation history and the latest *full reasoning* from its peers. The group answer was the most frequent final answer, following the paper’s plurality rule; ties went to the first agent. There were no tools, search results, response schemas, or hidden claim metadata guiding the exchange.

A second condition kept three model participants but instructed the third to act as an arithmetic checker instead of another solver. Its job was to recompute the numbers and challenge unsupported steps. This tests a concrete setup change: assigning verification responsibility while leaving the model and discussion loop intact.

<figure><img src="/harness-notes/assets/diagrams/debate.svg" alt="Three agents answer separately, share their previous reasoning, revise and vote. A checker can replace the third solver but remains inside the same feedback loop."><figcaption>The checker reads the same peer reasoning as everyone else. It can catch an error—or inherit one.</figcaption></figure>

The 40 GSM8K questions came from two disjoint 20-question cohorts. Main runs used the Ollama provider’s default sampling, so each condition generated its own initial answers. This matters: similar first-turn scores do not mean the agents started from identical answers on each question. The table measures change *within* each run, not a clean randomized estimate of the checker’s causal effect.

| Three agents, four turns | T1 correct | T4 correct | Initially wrong rescued | Initially correct lost |
|---|---:|---:|---:|---:|
| Three solvers | 24/40 | 23/40 | 2/16 | 3/24 |
| Two solvers + arithmetic checker | 24/40 | 27/40 | 5/16 | 2/24 |

The checker condition improved in both cohorts: 60% to 70% in one and 60% to 65% in the other. The all-solver condition went 65% to 55% in one cohort and 55% to 60% in the other. That repeated direction is more interesting than the headline ten-point T4 gap, because the gap rests on only six questions where the conditions differed: five checker-only wins and one solver-only win. The paired exact McNemar result was `p=0.219`. These runs suggest a mechanism worth testing; they do not establish a stable accuracy advantage.

## What changed during the conversation?

The aggregate score hides the answer traffic. Across the homogeneous GSM8K runs, individual agents changed answers 171 times. Forty-four changes went from wrong to right, while 39 went from right to wrong. With a checker, there were fewer changes—150—but 47 were wrong to right and 33 were right to wrong. The checker did not make the group revise more often. It improved the balance of revisions, and some corrections survived to the final vote.

The failures show why verification matters. In one GSM8K question, the source used the awkward phrase “She ate 5 five cookies.” Two agents interpreted it as five cookies and initially gave the correct answer. A third read it as `5 × 5` and wrote a more elaborate explanation. On the next turn, the two correct agents adopted that interpretation. The debate created a unanimous wrong answer from a correct majority.

Another group’s answer moved `91 → 515 → 91 → 39` across four turns. In the last response, an agent computed that 39 trees had died, then reported 39 as the number *remaining*. The arithmetic was present; the requested quantity was lost. These are not examples of a missing context window. All 480 homogeneous GSM8K messages were retained for analysis, and later-turn responses were generally substantial. The weak point was deciding which candidate argument answered the actual question.

## Change the question: a semantic checker on SVAMP

[SVAMP](https://aclanthology.org/2021.naacl-main.168/) varies the wording and structure of arithmetic problems, including irrelevant numbers. Here the third agent checked which quantity and unit the question requested, recomputed from the original facts, and looked for the first semantic or arithmetic divergence. It was told not to defer to a majority or a longer explanation without its own support.

On 20 SVAMP questions, the three-solver group moved from 15/20 to 13/20. The semantic-checker group moved from 12/20 to 14/20, rescuing two of eight initially wrong group answers and losing none of its twelve initially correct ones. But their first-turn scores were already 15 percentage points apart, and at T4 the checker group alone won two questions while the solver group alone won one. Different initial draws and the small sample prevent an absolute ranking.

There is a second warning in this result. Final unanimity rose from 60% with three solvers to 85% with a semantic checker, yet four of the 20 checker questions ended in **unanimous wrong answers**. A focused role can make agents converge without making the conclusion true. The checker itself reached 65% individual accuracy at T4 on both GSM8K and SVAMP; it was a participant that changed what the group examined, not an oracle.

## Does adding a checker solve it?

To remove sampling temperature as one source of movement, I also compared two four-agent configurations at temperature zero on the same ten GSM8K questions. Four identical solvers stayed at 8/10 throughout four turns, making no answer changes. Three solvers plus a semantic checker started at 7/10, briefly reached 8/10 on turn two, then returned to 7/10. The checker configuration produced 15 individual answer changes; seven wrong-to-right transitions were exactly offset by seven right-to-wrong transitions. Its false-consensus rate was 30%, compared with 20% for four solvers.

This small ablation is not a definitive comparison of roles. It does rule out the simple story that adding another synchronous checker necessarily helps. The checker repeatedly reads its peers and can be pulled into the same mistaken interpretation it was assigned to inspect. A final adjudicator that sees frozen solver outputs just once would test a different mechanism.

## More agents, more waiting

The reference paper also varied agent count, so I fixed debate at two turns and ran one through seven homogeneous agents on the same 20 GSM8K questions. Each condition independently sampled its first-turn answers. Final plurality accuracy was **65%, 55%, 75%, 65%, 70%, 70%, 70%**. Mean latency grew from **4.0 to 45.3 seconds**. The seven-agent condition took about eleven times as long as one agent without a monotonic gain.

This curve does not identify three agents as the optimum. Twenty questions are few, the conditions did not share frozen initial completions, and the paper-compatible vote gives the first agent a tie-breaking advantage. At six and seven agents, plurality was 70% while strict-majority accuracy was only 55%; dispersed wrong answers can let the correct answer win a plurality without making most agents correct. Counting votes alone would obscure that distinction.

The next useful experiment is therefore narrower than “try more agents.” Freeze the same first-turn solver outputs, branch them into continued synchronous debate and a one-shot independent adjudicator, then compare rescued answers, lost answers, and false consensus across multiple seeds. That would separate the benefit of having several candidates from the effect of letting them influence one another. It has not been run yet.

These observations apply to this quantized 1.5B model, these prompts, and small samples. They do not contradict the debate paper’s results with other models. They show a boundary the harness must handle: a model may be able to *produce* a correct line of reasoning without reliably *recognizing and preserving* it in a room full of alternatives.

<details class="source-note" markdown="1"><summary>Report, model settings and code</summary>

The model was Ollama Qwen2.5-1.5B-Instruct, Q4_K_M. All reported Qwen2.5 conditions completed their requested samples. Main runs used provider-default sampling; the four-agent ablation used temperature zero. The full report includes per-turn tables, transition counts, protocol details, and limitations. Raw transcripts and aggregate files remain in local storage.

[Full report](https://github.com/namanegi/multiagent-debate-workbench/blob/f9f8f7347bef1d2b91ad4f5141b658fc7f8a58ca/docs/reports/small-model-debate-failure-analysis.md) · [Workbench source](https://github.com/namanegi/multiagent-debate-workbench/tree/f9f8f7347bef1d2b91ad4f5141b658fc7f8a58ca)

</details>
