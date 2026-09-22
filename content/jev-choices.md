# What can a decision model actually decide?

<div class="meta">Jev / Part 1 · September 21, 2026 · 9 min read</div>

An assistant answering a travel-expense question may need to search for a policy, open a document, check its scope, and then produce a supported answer. If an eligibility fact is missing, it must ask the user first. Writing the final response is only part of the job. Before that, the system repeatedly decides what to do next.

In a ReAct-style agent, a general language model handles those decisions. It considers the task and observations, selects an action, receives the tool result, and decides again. The feedback loop allows work to change as evidence arrives, but each decision can add another model call's latency and cost. Here, “ReAct-style” means that feedback-driven way of acting; the [original ReAct research](https://react-lm.github.io/) develops the interleaving of reasoning and actions.

Jev introduces another implementation option. [Jev is a structured decision model from TypeSafe](https://openrouter.ai/typesafe/jev-1.13), intended for classification, routing and bounded choices inside software. An application supplies information to evaluate and receives a typed decision. Could a model designed to choose take over some of the general language model's work, such as deciding which evidence to read or whether a prerequisite is missing? That need not replace the whole ReAct loop. It first requires identifying decisions worth moving.

This article investigates that prerequisite: **what can Jev select correctly on its own, where does it fail, and what do its candidate scores tell us?** The experiments start with verifiable synthetic rules and actions, then introduce public reasoning questions and character-position tasks. Jev did well on the tested short rules and evidence-applicability cases. Harder Boolean reasoning and character selection produced clear errors. Candidate scores supplied some ranking information, but were not established as reliable probabilities of correctness.

At this stage, another model does not repair Jev's answers, and tools do not turn them into a complete workflow. Understanding the isolated successes and failures comes before the [matched Jev / Luna comparison](@/projects/jev-comparison/) and the [complete-agent study](@/projects/jev/).

## Turning the next action into a measurable question

The experiments use Jev's **Choice** question type: a single selection with context. The developer supplies facts, a decision instruction and candidates; the model returns a selection. Choice is the input/output arrangement used here, not an agent that searches or operates tools by itself. The [interface documentation](https://docs.typesafe.ai/primitives/choice) describes this input/output arrangement.

A judgment in this study has the following parts:

| Part | Meaning | Role in the expense-search scenario |
|---|---|---|
| Current state | Facts and evidence visible for this decision | User question, travel facts, search summaries and opened text |
| Instruction | The rule for choosing | Answer from applicable text; otherwise read an applicable hit or keep searching |
| Candidate actions | Legal options and their meanings | Search, read, ask for a missing fact, or answer |
| Returned result | The selection and candidate weights | A program could dispatch the action; this study scores the choice itself |

The expense assistant introduced above becomes a **local synthetic test scenario**. Its materials are supplied in advance, without accessing a real company system. Selecting “answer” means the model judges the evidence sufficient; it does not generate or validate an expense-policy response.

This isolates the decision from search quality, argument generation and execution. The expected answer is determined from the rules before Jev is called. A response must pass interface validation and select that answer. Returning a legal but wrong option is different from failing to obtain a valid response at all.

## Method: increase the work hidden inside the choice

The experiments examine separate capabilities rather than mixing all selection tasks into one score.

The initial tasks supply short facts and explicit actions. Follow-ups change distractors, remove an explicitly stated conclusion, or move the correct option to test whether the rule still leads to the right choice. The policy scenario holds document count and appearance fixed while changing applicability, reducing shortcuts such as answering whenever an opened document exists.

Public reasoning questions then test whether Jev can compute an answer before choosing its label. Finally, character candidates test whether turning text output into selections makes position judgments reliable. Each cohort has its own inputs, denominator and failure interpretation.

| Experiment | Design and sample | Jev correct |
|---|---|---:|
| Short actions and rules | Six task families, twelve variants, two calls each | 24/24 |
| Policy applicability | Four evidence states, two wordings, three calls each | 24/24 |
| Public BBH reasoning | Three families, six distinct questions each | 17/18 |
| Harder BBEH expressions | Six distinct questions, five expressions per question | 2/6 |
| Next character, target hidden | Two short words, six character positions, two calls each | 8/12 |
| Next character, target supplied | The same positions and repeats, with the target added | 10/12 |

Adding these denominators would not estimate “Jev's overall accuracy.” Repeating an input observes its behavior without adding independent business problems. The standalone policy probe here and the matched comparison in the next article reuse a task design, but contain separate batches of calls and are reported separately.

## Short rules worked, within a specific scope

The initial action tasks distinguish changing a billing address from changing a shipping address, pausing a subscription from cancelling it, and selecting actions under warranty or return exceptions. Some variants state the conclusion directly; others remove it while keeping the facts and rules. Jev selected correctly on all twelve variants, called twice each.

However, the correct options in three semantic-choice tasks initially occupied the first position. A separate six-call diagnostic moved those answers to the end and still scored 6/6. This rules out always picking the first option as the explanation for those cases. It does not establish general order robustness, and the six calls were not merged into the original 24.

The policy probe asks a more specific question: is Jev checking what the evidence means, or merely noticing that documents are available? Each state contains two search hits and one opened document, with titles, dates and identifiers held fixed. Only the applicability of a search summary and the opened text changes between business travel and employee relocation. Both versions mention the relevant topics, so the mere presence of a travel keyword cannot solve the task.

| Available evidence | Required action under the supplied rule |
|---|---|
| Applicable opened text sufficient to answer | Submit an answer |
| Inapplicable opened text, but an applicable search pointer | Open that document |
| Neither the opened text nor search pointer applies | Search again |

A search summary is only a pointer; it does not replace the document. The user's facts are complete, so asking for clarification is a legal but incorrect candidate. Across four applicability combinations, two equivalent wordings and three calls each, Jev scored 24/24. A field-only rule that answers whenever opened text is nonempty would get only 12/24.

<!-- case:policy-choice -->

This supports a concrete capability: following an explicit routing rule while judging the scope of short text. It does not cover noisy retrieval, conflicting policies, version authority or citation generation. A parser written for these fixed sentence forms could also solve the task. The result identifies a useful type of decision to compare next; it does not establish an advantage over code.

## When choosing first requires harder computation

The rule-task successes leave an open question. Can Jev only identify actions already close to the answer, or can it perform more demanding computation? The next batch uses the public reasoning collection **BIG-Bench Hard (BBH)**. Before calls, it samples six questions each from logical ordering, shuffled-object tracking and Boolean expressions, without selecting questions based on model outcomes.

Jev answered 6/6 ordering questions, 6/6 object-tracking questions and 5/6 Boolean questions, or 17/18 overall. These cases require more than direct action matching. Six questions per family are nevertheless too few for a broad reasoning ranking.

The harder **BIG-Bench Extra Hard (BBEH)** test uses six five-choice Boolean questions. Each option is a complete expression, and only one is true. Jev returned valid options for all six but selected correctly on just 2/6. Five candidates are not many; the difficulty lies in the logical computation needed before selecting the label.

The character experiment examines the same issue from another direction. Could text generation be performed as successive decisions over letters? It uses two three-letter English words. Every call receives the correct prefix and chooses the next step from 28 candidates, including letters and an end option. Supplying the correct prefix prevents earlier generation mistakes from contaminating later positions.

Counting character positions only, the hidden-target condition scored 8/12 and the visible-target condition 10/12. Even when given both the target `dog` and the correct prefix `d`, Jev twice selected `g` rather than `o`. This is neither a tool-execution error nor an accumulation of previous wrong characters.

<!-- case:character-position -->

End-of-word decisions were counted separately and scored 4/4 in both conditions. Two short words and repeated positions cannot establish a general character-processing limit or identify the architecture. They do provide a counterexample to assuming that expressing a task as a choice removes its underlying computational difficulty.

## What else do the candidate scores tell us?

Alongside the selection, Choice returns a distribution over candidates. The analysis calls its largest weight `pmax` and checks where the correct answer ranks. The question is whether these numbers can flag unreliable decisions or preserve an alternative worth checking.

The sole BBH error returned a 0.50 / 0.50 distribution, which does look uncertain. But one correctly answered object-tracking question had a maximum weight of only 0.48. Low scores can accompany errors or reject answers that were already right.

In the initial BBEH sample, the two correct answers had maximum weights of 0.50 and 0.37. The four wrong answers ranged from 0.41 to 0.53. Those ranges overlap. A 0.90 acceptance threshold would reject all six: it catches every error while leaving no automatically handled questions.

Ranking offers another clue. On three of the four BBEH errors, the correct answer ranked second; on the other it ranked fourth. Keeping two candidates could preserve some answers, but retention does not establish that a later decision will select correctly. In BBH Boolean questions with only two options, retaining the correct answer in the top two is inevitable and supplies no extra benefit.

This study does not establish candidate weights as calibrated against task correctness: whether decisions assigned 0.90 really turn out right about nine times in ten on new tasks. They are a control signal to test. The [matched comparison and handoff study](@/projects/jev-comparison/) measures whether acting on them actually repairs errors or saves money.

## What does this change about agent design?

Return to the expense assistant. When supplied facts and rules are short and the available actions are explicit, Jev is a plausible candidate for selecting the next step. Such decisions merit a comparison of cost and time at an acceptable quality level. Exact date calculations, field copying and directly computable conditions can remain in code.

More complex reasoning and character-by-character generation already produced concrete failures. A valid output format does not justify moving all of that work to Jev. Its scores also do not yet guarantee reliable automatic execution.

The resulting design direction is conditional: **start with bounded action judgments whose rules are clear, facts are supplied and outcomes can be checked; handle harder computation and generation separately.** This is a starting point from small capability probes. It establishes neither general replacement of a language model nor a reliable ReAct alternative assembled from locally correct choices.

<details class="source-note" markdown="1"><summary>Methods and evidence</summary>

Measurements used Jev 1.13 on September 20–21, 2026. Each cohort retains its own sample and denominator; synthetic variants, repeated calls and public questions are not pooled into an overall accuracy estimate. Training overlap was not assessed. Some tasks can be solved directly in code, and this article does not establish a competitive code baseline.

[Experiment appendix](@/research/jev-report/) · [Aggregate data](@/assets/jev-evidence.json) · [Next: matched Jev / Luna decisions](@/projects/jev-comparison/)

</details>
