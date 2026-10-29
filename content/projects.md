# Experiments

Research on decisions, planning and model collaboration, from single calls to complete agent systems.

## Jev for RAG reranking

Score and Noul improve a shared vector shortlist on Japanese and English benchmarks. A second filtering pass also removes useful evidence. A real-document comparison with GPT-6 Luna separates ranking quality, label limitations and observed pipeline cost.

[Read the reranking experiment →](@/projects/jev-rerank/)

## Jev: from a choice to a finished task

The same choice interface can hide very different demands. This series first maps the capability, then compares alternatives, then measures the complete system.

1. [What can a decision model actually decide?](@/projects/jev-choices/) — standalone action probes, reasoning failures and candidate scores.
2. [Jev vs. Luna: compare the decision, then count the cost](@/projects/jev-comparison/) — matched states, instruction packaging, caching and conditional handoff.
3. [Can cheap decisions make a cheap agent?](@/projects/jev/) — parameter generation, rejected tools, verification and stopping.

[Shared methods and results appendix](@/research/jev-report/)

## Does planning ahead actually save time?

A fixed dependency graph can expose parallel work. Across 40 research and competition questions, that did not become a consistent speedup. Completion and latency distributions explain why accuracy alone misses much of the result.

[Read Compile, Then Act? →](@/projects/compile-then-act/)

## When small models debate, who checks the answer?

Correct answers sometimes appeared before discussion and vanished after it. A dedicated checker showed promise, but could inherit the same mistakes. Follow the changes across rounds, tasks and group sizes.

[Read Debate Workbench →](@/projects/debate-workbench/)
