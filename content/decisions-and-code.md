# When is another model call worth it?

<div class="meta">September 21, 2026 · 2 min read</div>

When building an agent, I find it easy to add another model call wherever I feel uncertain: check the answer, verify the button, reconsider the next step. Three recent experiments made me ask a more concrete question: **what does that extra call add?**

## Another opinion may contain no new evidence

In [Debate Workbench](@/projects/debate-workbench/), a correct answer could appear in the first turn and disappear after discussion. A dedicated checker showed some promise, but could also adopt a peer’s wrong explanation.

[Jev’s button-selection experiment](@/projects/jev/) ran into a related problem. Choosing a path, finding a button and verifying it did not beat selecting from the full list. The verifier could repeat the original decision maker’s mistake.

Those results make me want to add something verifiable first: return to the original quantities, inspect the complete path, or check a tool’s preconditions in code. Asking “are you sure?” alone may add little.

## Some waiting buys information

[Compile, Then Act?](@/projects/compile-then-act/) tried moving decisions earlier: plan the dependency graph once and avoid repeated scheduling. It did not produce a consistent speedup, and fixed plans frequently remained unfinished on research questions.

Planning again after a tool result does cost another call. But the system now knows something it did not know at the beginning. That call has a clearer purpose than repeatedly judging the same text.

## Where I would draw the boundary

For an inventory request, code can copy the SKU and quantity from the order. A model can decide what to try after discovering insufficient stock. The tool’s state can confirm whether a reservation actually succeeded.

That suggests a practical order: compute what can be computed, obtain missing evidence, then ask a model to resolve the remaining semantic choice. I would evaluate extra agents, debate rounds and cheaper controllers against that sequence.

The next useful test would hold inputs and budgets fixed while changing where the extra judgment happens. It should be easier to tell whether a saved call removed overhead or skipped an observation the task needed.
