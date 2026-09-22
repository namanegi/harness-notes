# Can cheap decisions make a cheap agent?

<div class="meta">Jev / Part 3 · September 21, 2026 · 8 min read</div>

Imagine an assistant asked to reserve four units from inventory. It must read the order to learn the item and quantity, check the primary warehouse, notice that only two units are available there, and try the backup. A tool might reject an action along the way. Even after a successful reservation, the assistant must recognize that the task is done and stop. Picking the next tool is only one decision in that sequence.

A common approach is to let a general language model run the whole loop: choose a tool, supply its arguments, read the result, then decide again. This study asks whether some of those local choices can instead go to TypeSafe Jev, a model that returns a structured selection from a bounded list. GPT-5.6 Luna, the general language model called Luna below, supplies the comparison and writes text when the task actually needs new words. **In these short workflows the Jev combination cost less and ran faster, but a missed stop and a missed retry after tool rejection each lost a task.**

[Part 1](@/projects/jev-choices/) examines Jev's single choices, and [Part 2](@/projects/jev-comparison/) compares those choices with Luna. Here the outcome is a complete task, including its final stop.

## How the workflows were tested

The *controller* selects the next action. A shared *executor* runs it and returns observable feedback. In the Jev system, the controller offered a finite menu after every result. Code copied facts already visible in state—order IDs, SKU, quantities, policy locations and verification profiles—into tool arguments. Luna generated text only where a tool required it, such as a search query or final explanation. This division kept copying an ID from masquerading as a language-generation challenge. Jev never received the executor's private expected result.

<figure><img src="/harness-notes/assets/diagrams/jev.svg" alt="Jev chooses an action from current state. Code copies known parameters; Luna generates text when needed. Tool feedback updates state for the next choice. Choosing stop ends the run, whose final state is scored separately."><figcaption>Action selection is only one part of a workflow. Parameter creation, feedback and stopping have their own failure modes.</figcaption></figure>

The Luna-only baselines used the same worlds and tools. *ReAct* here means an action-and-feedback loop: Luna chose a tool after each observed result through the Agents SDK. *Bounded Plan* began with a linear list of action IDs and could replan once after a rejection or an exhausted plan. It was a revisable plan, unlike the immutable compiled graph in the separate compile-then-act study.

The tasks used frozen synthetic tool results, not live business services. A run passed only when the independent final-state check found the required outcome **and** the controller explicitly stopped. Where a prerequisite was missing, requesting it with evidence and then stopping was a correct *safe block*; it did not mean the business operation had completed. Costs below include all model calls made along a task path, and times include serial requests and client overhead.

## First make sure the workflow can close

The first cohort had four synthetic tasks. A policy search had to distinguish a relevant travel rule from a relocation rule. An inventory task discovered the ordered quantity before checking a primary warehouse with no stock and a backup with enough. Two package tasks required different paths depending on whether fast verification passed or failed. Tool results were revealed only after the relevant action.

Plan initially failed because its output format did not match the executor. After repairing the action format, a separate rerun passed 4/4; the appendix retains the original failure records.

After that repair, all four systems reached the right terminal state and explicitly stopped: ReAct, bounded Plan, Jev with a full parameter-writing context, and Jev with a smaller *sufficient* context. Both Jev configurations took the same action paths and each made 16 Jev choices plus four Luna text calls across the four tasks. The inventory task needed no Luna text at all; known fields were copied by code.

The full-context Jev system cost $0.001594 across four tasks. The sufficient-context version cost $0.001146, versus $0.004206 for ReAct and $0.002868 for repaired Plan. The smaller Luna prompts kept the goal, selected tool contract and relevant current observations. Both Jev systems finished 4/4, so nothing necessary was lost in these cases. Cost fell about 28%, but the reduction cannot be attributed entirely to shorter inputs, nor does it establish a stable speed gain. The [appendix](@/research/jev-report/#measurement-notes) retains the measurement details.

## Transfer to unseen branches

The next cohort froze eight new tasks before calls: two each for policy, inventory, access and incident handling. One task in each pair could complete its business operation. The other had a real missing prerequisite—such as approval scope or deployment ID—and required a justified information request. An unsafe action, premature stop or looping to the 12-action cap failed.

| Controller, eight new tasks | Correct terminal state and stop | Business completed | Correct safe blocks | Total cost | Median task time |
|---|---:|---:|---:|---:|---:|
| Luna ReAct | 8/8 | 4/4 | 4/4 | $0.007095 | 7.38 s |
| Luna bounded Plan | 7/8 | 3/4 | 4/4 | $0.007954 | 9.35 s |
| Jev choices + Luna text | 7/8 | 4/4 | 3/4 | $0.002751 | 3.44 s |

<!-- case:inventory-success -->
<!-- case:approval-loop -->

The Plan miss took two bad turns in one inventory task. It requested a quantity that was already known, consuming its one replan after the tool rejected the action. Its revised plan then tried to reserve from a warehouse with insufficient stock. A second rejection ended the run before reservation. Other Plan tasks did recover after one rejection; the observation is about this one-replan budget, not planning in general.

Jev's first miss was different. In an access task it correctly requested approval with the required scope. The state was now a valid safe block, yet the controller kept requesting approval or training and never chose stop before the cap. The final business disposition and the protocol outcome therefore disagreed. Looking only at whether an approval request occurred would count a failure as success.

The original Jev instruction said to stop when the “goal is reached,” while the other controllers explicitly allowed stopping after a justified request for a missing prerequisite. A later batch changed only Jev's stopping instruction and reran all eight tasks. It again scored 7/8, with a different miss. The approval case now stopped correctly. In the incident case, Jev requested a deployment ID before collecting matching log evidence; the tool rejected it. After querying the logs, Jev stopped without repeating the now-justified request. It did not invent an ID or roll back anything, but it left the required safe block incomplete. Picking the best cases from the two batches would manufacture an 8/8 result that neither run achieved.

<!-- case:approval-stopped -->
<!-- case:incident-retry -->

Recorded cost and time fell in the amendment, but different run times and prompt wording prevent attributing the change entirely to the instruction. More importantly, the failure moved from recognizing when to stop to knowing which previously rejected action to retry after new evidence.

## More decisions are not necessarily safer

A separate experiment tested button selection on web pages represented as a DOM (Document Object Model): a tree of page elements that the controller could inspect. The controller could select from a flat list of visible buttons or navigate a tree of local choices, backtrack, and ask Jev to verify a candidate. On four later, internally consistent synthetic pages, the flat list reached the exact final state on 4/4 with four Jev requests. Tree navigation with a whole-candidate check reached 3/4 with 27 requests; tree navigation with a field-by-field check also reached 3/4 with 27. One failed tree run remained unresolved at its call limit; the other executed a wrong button.

The field check had seemed promising in isolation. On eight new candidate judgments, asking Jev for account, plan and status judgments separately and combining them in code improved final decisions from 6/8 to 7/8. It correctly kept one missing-status case unknown. But Jev still marked a Direct-channel candidate as matching a Partner-channel request. In the full tree, code faithfully combined those wrong field judgments and approved the wrong leaf. The verifier had the full ancestor path; evidence was available. Splitting a decision did not make each part reliable, and repeated local calls raised total tokens, cost and latency.

These are synthetic, short, locally simulated tasks, each run once per condition. They do not measure production reliability, browser click behavior or a general model ranking. The costs describe whole controllers—including serial calls, SDK and network behavior, parameter generation and cache differences—rather than a pure model speed contest.

The design boundary is still useful. Let code enforce known fields and check observable end states. Give Jev bounded choices where errors can be detected and corrected. Use Luna when new text is required. Most of all, test the controller on *rejections and exits*: cheap choices only form a cheap agent when the loop can close.

<details class="source-note" markdown="1"><summary>Methods and aggregate evidence</summary>

The workflows and DOM pages used frozen local scenarios and independent final-state checks. The stop amendment was a later full eight-task batch, not a replacement of the original. Jev was version 1.13; Luna settings, cache accounting and per-cohort denominators appear in the appendix. API-reported Jev cost and usage-estimated Luna cost were not reconciled to invoices.

[Experiment appendix](@/research/jev-report/) · [Public aggregate data](@/assets/jev-evidence.json)

</details>
