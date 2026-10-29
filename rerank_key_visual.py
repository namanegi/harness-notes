"""Render the article's static lead figure from its reviewed public evidence.

The bars are ordinary HTML/CSS: every value, comparison and caveat remains
readable without JavaScript, pointer interaction, or a charting dependency.
"""

from html import escape
import json
import math
from pathlib import Path


def _number(value, field):
    if not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"Key visual requires a finite {field}")
    return float(value)


def _signed(value):
    return ("+" if value >= 0 else "−") + f"{abs(value):.3f}"


def _measure(dataset, embedding, method):
    rows = [
        row for row in dataset.get("aggregate", [])
        if row.get("split") == "test" and row.get("depth") == 50
        and row.get("embedding") == embedding and row.get("method") == method
    ]
    if len(rows) != 1:
        raise ValueError(f"Key visual requires one test N=50 row: {embedding}/{method}")
    result = _number(rows[0].get("ndcg10"), "nDCG@10")
    if not 0 <= result <= 1 or rows[0].get("n") != dataset.get("test_n"):
        raise ValueError("Key visual has an invalid score or mismatched query count")
    return result


def render_key_visual(root, language):
    """Return a bilingual static HTML figure, using only public aggregate data.

    ``root`` is the site checkout directory; ``language`` is en, zh or zh-CN.
    The build should load assets/rerank-key-visual.css beside this figure.
    """
    if language not in ("en", "zh", "zh-CN"):
        raise ValueError(f"Unsupported key visual language: {language}")
    zh = language.startswith("zh")

    def tr(en, cn):
        return cn if zh else en

    data = json.loads((Path(root) / "assets/baseline-v2.json").read_text(encoding="utf-8"))
    suffix = "zh" if zh else "en"
    title_id = f"rerank-key-title-{suffix}"
    caption_id = f"rerank-key-caption-{suffix}"
    parts = [
        f'<figure class="rerank-key-visual" aria-labelledby="{title_id}" aria-describedby="{caption_id}">',
        '<div class="rkv-intro">',
        f'<span class="rkv-eyebrow">{tr("The central result", "核心结果")}</span>',
        f'<h2 id="{title_id}">{tr("Japanese gain holds.<br>English remains uncertain.", "日语收益保留，<br>英语仍待验证。")}</h2>',
        f'<p class="rkv-subtitle">{tr("Does Jev still help after a stronger embedding?", "换成更强的 embedding，Jev 仍有收益吗？")}</p>',
        '</div><div class="rkv-cards">',
    ]
    for key, name, language_label in (
        ("jqara", "JQaRA", tr("Japanese", "日语")),
        ("scifact", "SciFact", tr("English", "英语")),
    ):
        dataset = data.get("datasets", {}).get(key, {})
        if dataset.get("status") != "complete":
            raise ValueError(f"Key visual requires completed {key} evidence")
        small = _measure(dataset, "text-embedding-3-small", "vector")
        large = _measure(dataset, "text-embedding-3-large", "vector")
        score = _measure(dataset, "text-embedding-3-large", "score")
        paired = dataset.get("large_score_vs_large_vector_test_ndcg10", {}).get("50", {})
        ci = paired.get("ci95", [])
        if len(ci) != 2:
            raise ValueError(f"Key visual requires the paired N=50 {key} reranking interval")
        lower = _number(ci[0], "CI lower bound")
        upper = _number(ci[1], "CI upper bound")
        delta = _number(paired.get("mean_delta"), "paired reranking gain")
        if lower > upper or not math.isclose(delta, score - large, abs_tol=1e-10):
            raise ValueError(f"Key visual has inconsistent paired evidence for {key}")
        card_title = f"rkv-{key}-{suffix}"
        parts.extend([
            f'<section class="rkv-card rkv-{key}" aria-labelledby="{card_title}">',
            '<div class="rkv-card-head">',
            f'<h3 id="{card_title}">{name}<span>{language_label}</span></h3>',
            f'<span class="rkv-sample">{dataset["test_n"]} {tr("queries", "题")}</span>',
            '</div>',
            f'<div class="rkv-metric">nDCG@10 <span>{tr("higher is better", "越高越好")}</span></div>',
            '<div class="rkv-bars">',
        ])
        methods = (
            ("small", tr("Small embedding", "small embedding"), small),
            ("large", tr("Large embedding", "large embedding"), large),
            ("score", tr("Large + Jev Score", "large + Jev Score"), score),
        )
        for method, label, value in methods:
            parts.extend([
                f'<div class="rkv-row rkv-{method}">',
                f'<div class="rkv-method"><span>{escape(label)}</span><strong>{value:.3f}</strong></div>',
                f'<div class="rkv-track" aria-hidden="true"><span style="width:{value * 100:.6f}%"></span></div>',
                '</div>',
            ])
        parts.extend([
            '</div>',
            '<div class="rkv-axis" aria-hidden="true"><span>0</span><span>0.5</span><span>1.0</span></div>',
            '<div class="rkv-gains">',
            f'<div class="rkv-embedding-gain"><span>{tr("Embedding gain", "Embedding 收益")}</span><strong>{_signed(large - small)}</strong></div>',
            f'<div class="rkv-rerank-gain"><span>{tr("Reranking gain", "重排收益")}</span><strong>{_signed(delta)}</strong></div>',
            '</div>',
            '<div class="rkv-interval">',
            f'<span>{tr("Reranking · paired 95% CI", "重排 · 配对 95% 区间")}</span>',
            f'<strong>[{_signed(lower)}, {_signed(upper)}]</strong>',
            f'<span class="rkv-verdict">{tr("Gain supported in this sample", "这批样本支持收益") if lower > 0 else tr("Interval includes zero", "区间包含零")}</span>',
            '</div></section>',
        ])
    parts.extend([
        '</div>',
        f'<figcaption id="{caption_id}">',
        tr(
            "Ranking quality on the same 80 test queries per dataset. Retrieve 50 → return 10; Score only, no filtering. Small / large = text-embedding-3-small / -large. Embedding gain: large − small vector ranking. Reranking gain: Jev Score − vector on the same large-embedding pool. Compare steps within each dataset, not quality between languages.",
            "每个数据集内使用相同的 80 道测试题。召回 50 → 返回 10；仅 Score 重排，不过滤。small / large 指 text-embedding-3-small / -large。Embedding 收益：large − small 向量排序；重排收益：同一 large 候选池上 Jev Score − 向量排序。应比较各数据集内部的步骤，不比较两种语言的质量高下。",
        ),
        '</figcaption></figure>',
    ])
    return "\n".join(parts)
