# When is another model call worth it?

<div class="meta">September 21, 2026 · 2 min read</div>

An uncertain answer invites another model call: check the result, verify the button, reconsider the next step. Each sounds useful on its own. Three small experiments show why the better question is **what evidence that extra call adds, and whether it changes the outcome.**

## Another opinion may contain no new evidence

In [Debate Workbench](@/projects/debate-workbench/), a correct answer could appear in the first turn and disappear after discussion. A dedicated checker showed some promise, but could also adopt a peer’s wrong explanation.

[Jev’s button-selection experiment](@/projects/jev/) ran into a related problem. Choosing a path, finding a button and verifying it did not beat selecting from the full list. The verifier could repeat the original decision maker’s mistake.

An extra check is easier to justify when it has something concrete to inspect: the original quantities, the complete path, or a tool’s preconditions. Code can enforce exact conditions; another model judgment still needs its own error measurement.

## Some waiting buys information

[Compile, Then Act?](@/projects/compile-then-act/) tried moving decisions earlier: plan the dependency graph once and avoid repeated scheduling. It did not produce a consistent speedup, and fixed plans frequently remained unfinished on research questions.

Planning again after a tool result does cost another call. But the system now knows something it did not know at the beginning. That call has a clearer purpose than repeatedly judging the same text.

## Put the extra call where it can change the outcome

For an inventory request, code can copy the SKU and quantity from the order. A model can decide what to try after discovering insufficient stock. The tool’s state can confirm whether a reservation actually succeeded.

That suggests a practical order: compute what can be computed, obtain missing evidence, then ask a model to resolve the remaining semantic choice. Extra agents, debate rounds and cheaper controllers can all be evaluated against that sequence.

The next useful test would hold inputs and budgets fixed while changing where the extra judgment happens. Count rescued errors and newly introduced errors, then include the cost through task completion. That would help distinguish a saved call from a skipped observation the task needed. It remains a proposed comparison, rather than a result of these studies.
