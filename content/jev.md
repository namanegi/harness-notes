# Can cheap decisions make a cheap agent?

<div class="meta">Jev × Harness · September 21, 2026 · 4 min read</div>

An agent does not always need to write. Often it only needs to choose: search again, call a tool, or stop. Could a fast, inexpensive decision model handle those moments?

I tested Jev through single-step probes and small workflows. **Short routing decisions were cheap and fast. In a complete agent, stopping and recovering from rejected tools became the harder problems.**

## First: can it choose correctly?

On 14 distinct states with short action rules, Jev and Luna both got every choice right. Median request time was about 0.49 seconds for Jev and 1.47 seconds for Luna; Jev cost roughly a third as much. These were not replayed identical requests, and Luna recorded no cache reads or writes.

But a small menu can hide a difficult question. On six harder BBEH questions with five choices each, Jev got 2/6 right. Luna got 4/6 after receiving enough output budget. Even with the target word `dog` and prefix `d` supplied, Jev twice chose `g` as the next character.

This changed how I framed the task. Recognizing a suitable action and computing an answer before selecting its label both look like “choice” at the interface. They demand different capabilities.

## From a choice to a completed task

I let Jev choose actions, used code to copy known parameters, and called Luna only when the tool needed generated text, such as a search query. The baselines were Luna ReAct and a plan executor allowed one replan.

<figure><img src="/harness-notes/assets/diagrams/jev.svg" alt="Jev chooses an action from current state. Code copies known parameters; Luna generates text when needed. Tool feedback updates state for the next choice. Choosing stop ends the run, whose final state is scored separately."><figcaption>A cheaper controller still depends on parameter generation, tool feedback and a sound stopping decision.</figcaption></figure>

Eight new synthetic tasks covered policy, inventory, access and incident handling. Four could be completed; four required asking for missing information. A pass required both the right disposition and an explicit end.

| Approach | Passed | Cost, all eight | Median task time |
|---|---:|---:|---:|
| Luna ReAct | 8/8 | $0.00709 | 7.38 s |
| Luna Plan | 7/8 | $0.00795 | 9.35 s |
| Jev + Luna parameters | 7/8 | $0.00275 | 3.44 s |

Jev’s failure was specific: it correctly requested additional approval, then kept taking actions. I clarified its stopping instruction and reran all eight tasks separately. It still passed 7/8. The approval task now worked, but an incident task ended without making a required information request after an earlier tool rejection.

The savings were real. So was the missing step. Fixing one stopping example did not solve recovery in general.

## More checks did not reliably help

I also tried navigating a DOM tree a few branches at a time, then asking Jev to verify the chosen button. On four new pages, selecting from the full candidate list got 4/4 right. Tree navigation with verification got 3/4, using 27 calls instead of four.

Splitting verification into separate fields improved a single-point test from 6/8 to 7/8. That gain did not carry through to the DOM system. A field could still be judged incorrectly, and code combining those judgments would faithfully approve the wrong button.

I would start with **local choices whose outcomes are easy to verify**. Copying fields, exact matching and checking completed state belong in code. The model earns its place at the remaining semantic forks. If backtracking and repeated checks consume the latency saved by each cheap call, the surrounding design needs another look.

<details class="source-note" markdown="1"><summary>Methods, full tables and data</summary>

These are small exploratory samples. Workflows and DOM pages were local synthetic tasks, not live services. Each cohort retains its own denominator. The model was Jev 1.13; Luna settings varied by experiment and are listed in the appendix. Costs and times describe the measured systems, including network and context differences. The stopping amendment was a later independent batch.

[Experiment appendix](@/research/jev-report/) · [Public aggregate data](@/assets/jev-evidence.json)

</details>
