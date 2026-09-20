# Compile, Then Act?

<div class="meta">公开研究 / 模型控制与计划执行</div>

这个项目比较三个基本控制方式：Single-agent 直接调用工具；Online 在观察一批专家结果后决定下一批工作；Compiled 在执行前生成并验证一次依赖图，运行中不修改它。Bounded 则只对未完成的 Compiled 运行追加有限恢复。

## 研究设计

冻结主分析包含 FRAMES 与 OlympiadBench 各 20 个题目，每题三次 rollout、三种基本条件，共 360 次运行。基本配置使用同一 Luna medium。Bounded 是条件触发的后续路径，不是第四个随机主条件。

## 从主分析能得出什么

Compiled 的总体答案正确率点估计比 Online 低 2.5 个百分点；描述性区间为 −10.0 至 +5.8 个百分点。点估计落在事先规定的五点质量边界内，但这个区间不能确立等效。FRAMES 上 Compiled 的运行完成为 15/60；答案正确与完成运行是不同指标。

延迟方向随数据集变化。FRAMES 的费用用量有缺失，因此可观察运行的平均费用不能当作完整总体成本。它支持检查“在观察工具结果之前承诺计划”的代价，而不是宣称编译计划必然更快。

以上来自[冻结主报告](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/results/formal-medium-v3/report.md)。

## 阅读时区分两种视图

简报中的事后报告视图替换了 11 个固定基础设施问题记录，并将 64 个未触发救援的 Compiled 代理与 56 条实际 Bounded 路径拼接。它用于诊断，不能覆盖 360 次冻结主分析，也不能当作四策略同条件随机试验。

## 原始出处

- [方法](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/docs/methods.md)
- [完整报告](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/results/formal-medium-v3/report.md)
- [简报与事后视图](https://github.com/namanegi/compile-then-act/blob/01c48be05391f6739fc59c88312a2c794cdf60b9/results/formal-medium-v3/report-brief.md)
- [公开仓库与复现材料](https://github.com/namanegi/compile-then-act/tree/01c48be05391f6739fc59c88312a2c794cdf60b9)

本页引用固定公开版本。这里的 Online 不等于另一个 Jev pilot 的 Agents SDK ReAct；Compiled 也不等于允许重规划的计划执行器。两个项目的质量和费用不能直接排名。
