"""Static, bilingual experiment flow; include assets/rerank-flow.css once."""
from html import escape


_COPY = {
    'en': {
        'eyebrow': 'THE COMPARISON, ON ONE PAGE',
        'title': 'One candidate pool. Four ranking policies.',
        'intro': 'Repeat the comparison for each embedding model.',
        'input': 'Question / claim + documents',
        'embedding': 'Embed with small OR large',
        'embedding_note': 'text-embedding-3 · native dimensions',
        'pool': 'The same top N candidates',
        'pool_note': 'N = 10 / 30 / 50 · within each embedding',
        'fork': 'Give every policy the identical candidates, in the identical starting order.',
        'vector': 'Vector baseline', 'vector_step': 'Keep vector order',
        'score': 'Jev Score', 'score_step': 'Sort by relevance score',
        'noul': 'Jev Noul', 'noul_step': 'Sort by relevance probability',
        'noul_note': 'Ranking only · no rejection',
        'combined': 'Score + Noul', 'score_first': 'Score', 'gate': 'Noul gate',
        'sort_score': 'Keep survivors in Score order',
        'combined_note': 'Dev-fitted gates + fixed 0.5 control · no backfill',
        'top10': 'Top 10', 'at_most10': 'At most 10',
        'luna_title': 'Separate comparator · GPT-6 Luna',
        'luna_scope': 'Python docs only · small-embedding pool',
        'luna_step': 'Score + boolean', 'luna_sort': 'Sort by Score',
        'luna_note': 'The boolean is not a filter in the main Luna ranking.',
        'policy_note': 'Policies, not separate timed runs: Jev ablations reuse cached Score / Noul judgments.',
        'scope_note': 'Measured here: retrieval and reranking. Answer generation is outside scope.',
        'arrow': 'then',
    },
    'zh-CN': {
        'eyebrow': '先看实验怎样比较',
        'title': '同一候选池，四种排序策略。',
        'intro': '每个嵌入模型都单独做一遍比较。',
        'input': '问题／主张 + 文档',
        'embedding': '选择 small 或 large 嵌入',
        'embedding_note': 'text-embedding-3 · 原生维度',
        'pool': '共享同一批前 N 个候选',
        'pool_note': 'N = 10 / 30 / 50 · 同一嵌入模型内',
        'fork': '各策略拿到完全相同的候选，起始顺序也相同。',
        'vector': '向量基线', 'vector_step': '保留向量排序',
        'score': 'Jev Score', 'score_step': '按相关性分数排序',
        'noul': 'Jev Noul', 'noul_step': '按相关概率排序',
        'noul_note': '只排序，不剔除',
        'combined': 'Score + Noul', 'score_first': 'Score', 'gate': 'Noul 门控',
        'sort_score': '保留项按 Score 排序',
        'combined_note': '开发集拟合 + 固定 0.5 对照 · 剔除后不回填',
        'top10': '前 10 个', 'at_most10': '最多 10 个',
        'luna_title': '独立对照 · GPT-6 Luna',
        'luna_scope': '仅 Python 文档 · small 嵌入候选池',
        'luna_step': '分数 + 布尔判断', 'luna_sort': '按分数排序',
        'luna_note': '主表的 Luna 排序不使用布尔判断过滤。',
        'policy_note': '图示是策略，不是分别计时的运行：Jev 消融复用缓存的 Score／Noul 判断。',
        'scope_note': '本实验测量召回与重排；答案生成不在测量范围内。',
        'arrow': '然后',
    },
}


def _outline():
    return ('<svg class="rf-outline" viewBox="0 0 200 80" preserveAspectRatio="none" '
            'aria-hidden="true" focusable="false">'
            '<path class="rf-outline-main" d="M5 5 Q95 2 195 5 L196 74 Q101 79 5 75 Z"/>'
            '<path class="rf-outline-echo" d="M3 7 Q102 5 197 3 L194 77 Q93 75 7 78 Z"/>'
            '</svg>')


def _node(label, note='', kind=''):
    note_html = f'<span class="rf-node-note">{escape(note)}</span>' if note else ''
    return (f'<div class="rf-node {kind}">{_outline()}'
            f'<span class="rf-node-label">{escape(label)}</span>{note_html}</div>')


def _arrow(extra=''):
    return (f'<svg class="rf-arrow {extra}" viewBox="0 0 34 20" aria-hidden="true" focusable="false">'
            '<path d="M2 10 Q17 8 30 10 M24 4 L31 10 L24 16"/></svg>')


def render_flow_diagram(language):
    """Return one accessible figure. Supported languages: en and zh-CN (alias zh)."""
    if language == 'zh':
        language = 'zh-CN'
    if language not in _COPY:
        raise ValueError(f'Unsupported diagram language: {language}')
    c = _COPY[language]
    suffix = 'zh' if language == 'zh-CN' else 'en'
    rows = []
    policies = [
        ('01', 'vector', [_node(c['vector_step'])], c['top10'], ''),
        ('02', 'score', [_node(c['score']), _node(c['score_step'])], c['top10'], ''),
        ('03', 'noul', [_node(c['noul']), _node(c['noul_step'])], c['top10'], c['noul_note']),
        ('04', 'combined', [_node(c['score_first']), _node(c['gate'], kind='rf-gate'),
                            _node(c['sort_score'])], c['at_most10'], c['combined_note']),
    ]
    for number, key, steps, output, note in policies:
        chain = _arrow().join(steps)
        note_html = f'<span class="rf-route-note">{escape(note)}</span>' if note else ''
        rows.append(
            f'<div class="rf-route rf-route-{key}">'
            f'<div class="rf-route-title"><span class="rf-number">{number}</span>'
            f'<strong>{escape(c[key])}</strong></div>'
            f'<div class="rf-route-chain">{chain}{_arrow()}{_node(output, kind="rf-output")}</div>'
            f'{note_html}</div>')
    return (
        f'<figure class="rerank-flow" lang="{language}" aria-labelledby="rf-title-{suffix}">'
        '<div class="rf-paper">'
        f'<div class="rf-eyebrow">{escape(c["eyebrow"])}</div>'
        f'<h3 id="rf-title-{suffix}">{escape(c["title"])}</h3>'
        f'<p class="rf-intro">{escape(c["intro"])}</p>'
        '<div class="rf-retrieval">'
        f'{_node(c["input"], kind="rf-input")}{_arrow("rf-input-arrow")}'
        f'{_node(c["embedding"], c["embedding_note"], "rf-embedding")}{_arrow("rf-input-arrow")}'
        f'{_node(c["pool"], c["pool_note"], "rf-pool")}</div>'
        f'<div class="rf-fork">{_arrow("rf-down")}<span>{escape(c["fork"])}</span></div>'
        f'<div class="rf-policies">{"".join(rows)}</div>'
        '<aside class="rf-luna">'
        f'<div class="rf-luna-heading"><strong>{escape(c["luna_title"])}</strong>'
        f'<span>{escape(c["luna_scope"])}</span></div>'
        f'<div class="rf-luna-chain">{_node(c["luna_step"])}{_arrow()}'
        f'{_node(c["luna_sort"])}{_arrow()}{_node(c["top10"], kind="rf-output")}</div>'
        f'<p class="rf-luna-note">{escape(c["luna_note"])}</p></aside></div>'
        f'<figcaption><span>{escape(c["policy_note"])}</span>'
        f'<span>{escape(c["scope_note"])}</span></figcaption></figure>'
    )
