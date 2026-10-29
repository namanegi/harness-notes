/* Evidence-only SVG explorers. No libraries, remote calls, or HTML string injection. */
(() => {
  'use strict';
  const scriptURL = document.currentScript ? document.currentScript.src : document.baseURI;
  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();
  let sequence = 0;
  const zh = document.documentElement.lang.toLowerCase().startsWith('zh');
  const t = (en, cn) => zh ? cn : en;
  const names = {jqara: 'JQaRA', scifact: 'SciFact', python_docs: t('Python docs', 'Python 文档')};
  const methodNames = {vector: t('Vector', '向量排序'), score: 'Jev Score', noul: t('Noul ordering', 'Noul 排序'), score_noul_fixed05: t('Score + filter ≥ 0.5', 'Score + 过滤 ≥ 0.5'), score_noul: t('Dev-selected policy', '开发集所选策略'), luna: 'GPT-6 Luna'};
  const methodColor = {vector: 'vector', score: 'score', noul: 'noul', score_noul_fixed05: 'filter', score_noul: 'filter', luna: 'luna'};
  const metrics = {ndcg10: 'nDCG@10', recall10: 'Recall@10', precision10: 'P@10', candidate_recall: t('Candidate recall@N', '候选召回率@N')};
  const num = (value, digits = 4) => Number.isFinite(value) ? value.toFixed(digits) : '—';
  const pct = value => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';
  const signed = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(4)}`;
  const color = key => `var(--rx-${methodColor[key] || key})`;
  function el(tag, cls, content, attrs = {}) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined && content !== null) node.textContent = String(content);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function svgEl(tag, attrs = {}, content) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (content !== undefined) node.textContent = String(content);
    return node;
  }
  function append(parent, ...nodes) { nodes.forEach(node => parent.append(node)); return parent; }
  function note(text, cls = '') { return el('p', `rx-note ${cls}`, text); }
  function selectControl(label, options, value, onChange) {
    const wrapper = el('label', 'rx-control');
    wrapper.append(el('span', '', label));
    const select = el('select', '', null, {'aria-label': label});
    options.forEach(([key, name]) => select.append(el('option', '', name, {value: key})));
    select.value = value;
    select.addEventListener('change', () => onChange(select.value));
    wrapper.append(select);
    return wrapper;
  }
  function segments(label, options, value, onChange) {
    const wrapper = el('div', 'rx-control');
    wrapper.append(el('span', '', label));
    const buttons = el('div', 'rx-segments', null, {'aria-label': label, role: 'group'});
    options.forEach(([key, name]) => {
      const button = el('button', '', name, {type: 'button', 'aria-pressed': String(key) === String(value)});
      button.addEventListener('click', () => onChange(key));
      buttons.append(button);
    });
    wrapper.append(buttons);
    return wrapper;
  }
  function heading(panel, kicker, title, badge) {
    const header = el('div', 'rx-head');
    const left = el('div');
    const id = `rx-heading-${++sequence}`;
    append(left, el('div', 'rx-kicker', kicker), el('h3', 'rx-title', title, {id}));
    append(header, left, el('span', 'rx-badge', badge));
    panel.setAttribute('aria-labelledby', id);
    panel.append(header);
  }
  function stats(items) {
    const grid = el('div', 'rx-stats');
    items.forEach(([label, value, extra]) => {
      const item = el('div', 'rx-stat');
      append(item, el('div', 'rx-stat-label', label), el('span', 'rx-stat-value', value));
      if (extra) item.append(el('small', '', extra));
      grid.append(item);
    });
    return grid;
  }
  function exactTable(headers, rows, label = t('Exact values · expand table', '精确数值 · 展开表格')) {
    const details = el('details');
    details.append(el('summary', '', label));
    const table = el('table');
    const head = el('thead');
    const tr = el('tr');
    headers.forEach(h => tr.append(el('th', '', h, {scope: 'col'})));
    head.append(tr);
    const body = el('tbody');
    rows.forEach(values => { const row = el('tr'); values.forEach((v, i) => row.append(el(i ? 'td' : 'th', '', v, i ? {} : {scope: 'row'}))); body.append(row); });
    append(table, head, body); details.append(table); return details;
  }
  function chartFrame(label, xValues, yLabel, options = {}) {
    const W = 640, H = options.height || 300;
    const pad = {left: 48, right: 18, top: 27, bottom: 46};
    const svg = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': label});
    const x = v => pad.left + ((v - xValues[0]) / (xValues[xValues.length - 1] - xValues[0] || 1)) * (W - pad.left - pad.right);
    const y = v => H - pad.bottom - v * (H - pad.top - pad.bottom);
    for (let i = 0; i <= 4; i++) {
      const v = i / 4;
      append(svg, svgEl('line', {x1: pad.left, x2: W - pad.right, y1: y(v), y2: y(v), class: 'rx-grid'}), svgEl('text', {x: pad.left - 10, y: y(v) + 4, 'text-anchor': 'end'}, num(v, 2)));
    }
    append(svg, svgEl('text', {x: pad.left, y: 12, class: 'rx-axis-label'}, yLabel));
    xValues.forEach(v => append(svg, svgEl('line', {x1: x(v), x2: x(v), y1: y(0), y2: y(0) + 5, class: 'rx-axis'}), svgEl('text', {x: x(v), y: H - 25, 'text-anchor': 'middle'}, options.xFormat ? options.xFormat(v) : v)));
    if (options.xLabel) svg.append(svgEl('text', {x: W / 2, y: H - 4, 'text-anchor': 'middle', class: 'rx-axis-label'}, options.xLabel));
    return {svg, x, y, W, H};
  }
  function plotLine(frame, points, key, label, selectedX, tooltip, onSelect, dashed = false, tooltipText) {
    const group = svgEl('g', {style: `--series:${color(key)}`});
    group.append(svgEl('path', {d: points.map((p, i) => `${i ? 'L' : 'M'}${frame.x(p.x)},${frame.y(p.y)}`).join(' '), class: 'rx-line', ...(dashed ? {'stroke-dasharray': '6 6'} : {})}));
    points.forEach(p => {
      const text = `${label} · ${p.xLabel || `N=${p.x}`} · ${num(p.y)}`;
      group.append(svgEl('circle', {cx: frame.x(p.x), cy: frame.y(p.y), r: p.x === selectedX ? 5 : 3.8, class: `rx-point${p.x === selectedX ? ' rx-point-selected' : ''}`}));
      const hit = svgEl('circle', {cx: frame.x(p.x), cy: frame.y(p.y), r: 13, class: 'rx-hit', tabindex: '0', role: 'button', 'aria-label': text});
      hit.append(svgEl('title', {}, text));
      const reveal = () => { tooltip.textContent = tooltipText ? tooltipText(p.x) : text; };
      hit.addEventListener('pointerenter', reveal); hit.addEventListener('focus', reveal);
      hit.addEventListener('click', () => { if (onSelect) onSelect(p.x); });
      hit.addEventListener('keydown', event => { if (onSelect && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(p.x); } });
      group.append(hit);
    });
    frame.svg.append(group);
  }
  function legendItem(label, key, active, onToggle) {
    const node = el(onToggle ? 'button' : 'span', onToggle ? '' : 'rx-key', null, onToggle ? {type: 'button', 'aria-pressed': active} : {});
    node.style.setProperty('--series', color(key));
    append(node, el('span', `rx-swatch${key === 'vector' ? ' rx-dashed' : ''}`, null, {'aria-hidden': 'true'}), el('span', '', label));
    if (onToggle) node.addEventListener('click', onToggle);
    return node;
  }
  function datasetSelect(data, current, callback) {
    return selectControl(t('Dataset', '数据集'), Object.keys(names).filter(k => data.datasets[k]).map(k => [k, names[k]]), current, callback);
  }
  function getRow(d, depth, method) { return d.aggregate.find(r => r.depth === depth && r.method === method); }
  function renderRetrieval(host, data, extras) {
    let dataset = 'jqara', metric = 'ndcg10', depth = 50, embedding = 'small';
    const active = new Set(['vector', 'score', 'noul', 'score_noul', 'score_noul_fixed05', 'luna']);
    const panel = el('section', 'rx-panel');
    function draw(focus) {
      panel.replaceChildren();
      const d = data.datasets[dataset];
      const depths = [...new Set(d.aggregate.map(r => r.depth))].sort((a, b) => a - b);
      const followup = extras.baseline?.datasets?.[dataset];
      const large = followup?.aggregate?.filter(r => r.split === 'test' && r.embedding === 'text-embedding-3-large') || [];
      const largeComplete = depths.every(n => ['vector', 'score', 'noul', 'score_noul'].every(key => large.some(r => r.depth === n && r.method === key && Number.isFinite(r.ndcg10))));
      if (!largeComplete) embedding = 'small';
      const rowAt = (n, key) => embedding === 'large' ? large.find(r => r.depth === n && r.method === key) : getRow(d, n, key);
      const seriesName = key => `${methodNames[key]}${largeComplete ? ` · ${embedding}` : ''}`;
      heading(panel, t('01 / Retrieve → reorder', '01 / 召回 → 重排'), t('More candidates. Better top ten?', '更多候选，能否改善前十？'), `${d.test_n} ${t('test queries', '测试题')}`);
      const controls = el('div', 'rx-controls');
      controls.append(datasetSelect(data, dataset, value => { dataset = value; draw('dataset'); }));
      if (largeComplete) controls.append(selectControl(t('Embedding candidate pool', 'Embedding 候选池'), [['small', 'text-embedding-3-small'], ['large', 'text-embedding-3-large']], embedding, value => { embedding = value; draw('pool'); }));
      append(controls, selectControl(t('Measure', '指标'), Object.entries(metrics), metric, value => { metric = value; draw('metric'); }), segments(t('Inspect candidate depth N', '查看候选深度 N'), depths.map(n => [n, String(n)]), depth, value => { depth = Number(value); draw('depth'); }));
      panel.append(controls);
      const candidateOnly = metric === 'candidate_recall';
      const legend = el('div', 'rx-legend');
      const methods = ['vector', 'score', 'noul', embedding === 'large' ? 'score_noul' : 'score_noul_fixed05'];
      if (dataset === 'python_docs' && embedding === 'small') methods.push('luna');
      if (candidateOnly) {
        legend.append(legendItem(`${metrics.candidate_recall} · ${embedding}`, 'score', true));
      } else methods.forEach(key => legend.append(legendItem(seriesName(key), key, active.has(key), () => { active.has(key) ? active.delete(key) : active.add(key); draw(); const button = [...panel.querySelectorAll('.rx-legend button')].find(b => b.textContent === seriesName(key)); button?.focus({preventScroll: true}); })));
      panel.append(legend);
      const frame = chartFrame(t('Results by candidate depth. Exact values follow below.', '各候选深度的结果，下方提供精确数值。'), depths, metrics[metric], {xLabel: t('Candidates inspected N · output capped at 10', '处理候选数 N · 最多返回 10 条')});
      const shown = candidateOnly ? ['score'] : methods.filter(key => active.has(key));
      const depthValues = n => `N=${n} · ${shown.map(key => `${candidateOnly ? metrics.candidate_recall : seriesName(key)} ${num(rowAt(n, key)?.[metric])}`).join(' · ') || t('Select a method in the legend.', '请在图例中选择方法。')}`;
      const tooltip = el('div', 'rx-tooltip', depthValues(depth), {'aria-live': 'polite'});
      shown.forEach(key => {
        const points = depths.map(n => ({x: n, y: rowAt(n, key)?.[metric]})).filter(p => Number.isFinite(p.y));
        if (points.length) plotLine(frame, points, key, candidateOnly ? `${embedding} · ${metrics.candidate_recall}` : seriesName(key), depth, tooltip, value => { depth = value; draw('depth'); }, key === 'vector', depthValues);
      });
      const chart = el('div', 'rx-chart'); chart.append(frame.svg); append(panel, chart, tooltip);
      const vector = rowAt(depth, 'vector'), score = rowAt(depth, 'score');
      panel.append(stats([[t('Candidate recall@N', '候选召回率@N'), pct(vector.candidate_recall), `N=${depth} · ${t('before reranking', '重排前')}`], ['Jev Score nDCG@10', num(score.ndcg10), t('fixed output depth 10', '固定输出深度 10')], [t('Gain over vector', '比向量排序提升'), signed(score.ndcg10 - vector.ndcg10), t('paired mean nDCG@10', '配对平均 nDCG@10')]]));
      panel.append(note(candidateOnly ? t('Candidate recall counts known relevant documents anywhere in the N retrieved candidates. It is shared by every method; it is not Recall@10 after reranking.', '候选召回率统计 N 个候选中找回的已知相关文档，各方法共享同一候选池；它不是重排后的 Recall@10。') : t('Why is the vector line flat? N=10, 30 and 50 are prefixes of one saved ranking. Taking its first ten returns the same ten documents. Reranking can promote candidates from positions 11–N.', '向量基线为何是平线？N=10、30、50 来自同一份缓存排序的前缀，取前十始终相同；重排可以把第 11–N 位候选提到前面。')));
      panel.append(note(embedding === 'small' ? t('The original development-selected Score + Noul policy selects threshold 0.0 and overlaps Score. Both calls still incur cost. JQaRA searches official per-query pools; Python uses weaker section labels.', '原始开发集所选 Score + Noul 阈值为 0.0，与 Score 重合，但仍支付两轮费用。JQaRA 仅搜索官方逐题候选池；Python 使用较弱的章节标签。') : t(`All displayed methods inspect the same large-embedding shortlist. The combined gate uses its own development-selected threshold ${num(followup.large_threshold?.selected, 2)}. This follow-up is separate from the original small-embedding experiment.`, `当前各方法均使用相同的 large embedding 候选池。组合过滤使用独立开发集选择的阈值 ${num(followup.large_threshold?.selected, 2)}。这是独立于原始 small embedding 实验的后续评估。`)));
      panel.append(exactTable([t('Method / pool', '方法 / 候选池'), 'N', 'nDCG@10', 'Recall@10', 'P@10', t('Candidate recall', '候选召回率')], depths.flatMap(n => methods.map(key => ({key, row: rowAt(n, key)})).filter(p => p.row).map(({key, row: r}) => [seriesName(key), r.depth, num(r.ndcg10), num(r.recall10), num(r.precision10), num(r.candidate_recall)]))));
      if (extras.baseline) renderBaseline(panel, extras.baseline, dataset);
      restoreControl(panel, focus);
    }
    draw(); host.append(panel);
  }
  function restoreControl(panel, key) {
    // Keep native keyboard navigation stable after rerendering a control.
    if (!key) return;
    const selects = panel.querySelectorAll('select');
    if (key === 'dataset') selects[0]?.focus({preventScroll: true});
    if (key === 'metric') ([...selects].find(s => [...s.options].some(o => o.value === 'ndcg10')) || selects[1])?.focus({preventScroll: true});
    if (key === 'pool') [...selects].find(s => [...s.options].some(o => o.value === 'large'))?.focus({preventScroll: true});
    if (key === 'depth') panel.querySelector('.rx-segments button[aria-pressed=true]')?.focus({preventScroll: true});
  }
  function renderBaseline(panel, baseline, dataset) {
    // Optional v2 export adapters are added only for actual published evidence.
    const d = baseline.datasets?.[dataset];
    if (!d || !Array.isArray(d.aggregate)) return;
    const rows = d.aggregate.filter(r => r.split === 'test' && r.embedding === 'text-embedding-3-large' && r.method === 'vector' && Number.isFinite(r.ndcg10));
    if (!rows.length && d.status !== 'pending') return;
    const block = el('div', 'rx-baseline-note');
    const complete = [10, 30, 50].every(n => ['vector', 'score', 'noul', 'score_noul'].every(key => d.aggregate.some(r => r.split === 'test' && r.embedding === 'text-embedding-3-large' && r.depth === n && r.method === key)));
    block.append(note(complete ? t('Switch embedding pools to compare each vector baseline with Jev on its own shortlist. Large-pool Jev scores are newly measured; small-pool judgments are never reused for the new candidates.', '切换 embedding 候选池，分别比较各自向量基线与同池 Jev。large 候选池的 Jev 分数为新测量，未把 small 候选池的判断用于新候选。') : t('The large-embedding follow-up is pending. Its chart appears after the vector and all reranker methods complete; no estimated or partial comparison is plotted.', 'large embedding 后续实验尚未完成；向量与全部重排方法完成后才显示对应图表，不绘制估计值或未完成对比。')));
    const ci = d.large_vs_small_test_vector_ndcg10;
    if (ci) block.append(note(t(`Large − small vector nDCG@10: ${signed(ci.mean_delta)}; paired 95% CI [${signed(ci.ci95[0])}, ${signed(ci.ci95[1])}].`, `large − small 向量 nDCG@10：${signed(ci.mean_delta)}；配对 95% 区间 [${signed(ci.ci95[0])}, ${signed(ci.ci95[1])}]。`)));
    panel.append(block);
  }
  function renderThreshold(host, data, extras) {
    let dataset = 'scifact', mode = host.dataset.rerankView || 'dev', trialIndex = 0, testThreshold = 0.5;
    const panel = el('section', 'rx-panel');
    function draw(focus) {
      panel.replaceChildren();
      const d = data.datasets[dataset];
      heading(panel, t('02 / Keep evidence, remove noise', '02 / 保留证据，移除噪声'), t('Calibrate rejection, preserve evidence', '校准过滤，保留证据'), mode === 'dev' ? `${d.dev_n} ${t('dev queries', '开发题')}` : `${d.test_n} ${t('test queries', '测试题')}`);
      const controls = el('div', 'rx-controls');
      const modes = [['dev', t('Original development · calibration', '原始开发集 · 校准')], ['test', t('Original test · frozen policies', '原始测试集 · 固定策略')]];
      if (extras.calibration?.datasets?.[dataset]?.test) modes.push(['v2', t('Follow-up v2 · offline inspection', '后续 v2 · 离线检查')]);
      append(controls, datasetSelect(data, dataset, value => { dataset = value; trialIndex = 0; draw('dataset'); }), selectControl(t('Evidence view', '证据视图'), modes, mode, value => { mode = value; draw('metric'); }));
      panel.append(controls);
      if (mode === 'dev') drawDev(d); else if (mode === 'v2') renderCalibration(panel, extras.calibration, dataset); else drawTest(d);
      restoreControl(panel, focus);
    }
    function drawDev(d) {
      const trials = d.threshold.trials;
      const chosen = trials[Math.min(trialIndex, trials.length - 1)];
      const row = el('div', 'rx-slider-row');
      const wrap = el('label', 'rx-slider-wrap');
      const slider = el('input', '', null, {type: 'range', min: 0, max: trials.length - 1, step: 1, value: trialIndex, 'aria-label': t('Development threshold', '开发集阈值')});
      const value = el('div', 'rx-threshold-value', num(chosen.threshold, 1));
      append(wrap, el('span', 'rx-slider-label', t('Explore development thresholds', '查看开发集阈值')), slider, append(el('span', 'rx-range-ends'), el('span', '', num(trials[0].threshold, 1)), el('span', '', num(trials[trials.length - 1].threshold, 1))));
      const valueWrap = el('div'); append(valueWrap, value, el('div', 'rx-threshold-caption', t('Noul ≥ threshold', 'Noul ≥ 阈值'))); append(row, wrap, valueWrap); panel.append(row);
      const chartHost = el('div', 'rx-chart');
      const tooltip = el('div', 'rx-tooltip', '', {'aria-live': 'polite'});
      const statsHost = el('div');
      const callout = el('div', 'rx-callout');
      const legend = el('div', 'rx-legend'); append(legend, legendItem(t('Relevant retention', '相关文档保留率'), 'score', true), legendItem('nDCG@10', 'noul', true)); panel.append(legend);
      function update() {
        const selected = trials[Number(slider.value)]; trialIndex = Number(slider.value);
        slider.setAttribute('aria-valuetext', `${num(selected.threshold, 1)} · ${t('relevant retention', '相关保留率')} ${pct(selected.relevant_retention)} · nDCG@10 ${num(selected.ndcg10)}`);
        value.textContent = num(selected.threshold, 1);
        const frame = chartFrame(t('Development threshold sensitivity', '开发集阈值敏感性'), trials.map(x => x.threshold), t('Development metrics', '开发集指标'), {xLabel: t('Noul threshold', 'Noul 阈值'), xFormat: v => num(v, 1), height: 255});
        append(frame.svg, svgEl('line', {x1: frame.x(0), x2: frame.x(trials[trials.length - 1].threshold), y1: frame.y(.95), y2: frame.y(.95), stroke: 'var(--muted)', 'stroke-dasharray': '3 5', opacity: '.65'}), svgEl('text', {x: frame.x(trials[trials.length - 1].threshold), y: frame.y(.95) - 7, 'text-anchor': 'end', class: 'rx-axis-label'}, t('95% retention floor', '95% 保留率下限')));
        ['relevant_retention', 'ndcg10'].forEach((key, i) => plotLine(frame, trials.map(r => ({x: r.threshold, y: r[key], xLabel: `τ=${num(r.threshold, 1)}`})), i ? 'noul' : 'score', i ? 'nDCG@10' : t('Relevant retention', '相关文档保留率'), selected.threshold, tooltip, n => { slider.value = trials.findIndex(r => r.threshold === n); update(); }));
        chartHost.replaceChildren(frame.svg);
        statsHost.replaceChildren(stats([[t('Relevant retained', '相关文档保留率'), pct(selected.relevant_retention), `${selected.relevant_kept} / ${selected.relevant_candidates} ${t('retrieved relevant', '已召回相关文档')}`], ['nDCG@10', num(selected.ndcg10), t('development only', '仅开发集')], [t('Retention constraint', '保留率约束'), selected.relevant_retention >= .95 ? t('Pass', '满足') : t('Fail', '不满足'), t('requires ≥ 95%', '要求 ≥ 95%')]]));
        tooltip.textContent = `τ=${num(selected.threshold, 1)} · ${t('retention', '保留率')} ${num(selected.relevant_retention)} · nDCG@10 ${num(selected.ndcg10)}`;
        callout.classList.toggle('rx-caution', selected.relevant_retention < .95);
        callout.textContent = t(`Frozen choice: τ=${num(d.threshold.selected, 1)}. Maximize development nDCG@10 subject to ≥95% relevant retention; ties choose the smaller threshold.`, `最终固定选择：τ=${num(d.threshold.selected, 1)}。在相关文档保留率 ≥95% 的约束下最大化开发集 nDCG@10，同分取较小阈值。`);
      }
      slider.addEventListener('input', update); update(); append(panel, chartHost, tooltip, statsHost, callout);
      panel.append(note(t('This slider inspects development data only. It never changes the threshold used for test evaluation. Noise removal and empty outputs are shown for the two recorded test policies in the other view.', '滑块只查看开发集，不改变测试评估使用的阈值。切换视图可看两种已记录测试策略的噪声移除率与空结果。')));
      panel.append(exactTable([t('Threshold', '阈值'), t('Relevant retained', '相关保留率'), t('Kept / relevant', '保留 / 相关'), 'nDCG@10'], trials.map(r => [num(r.threshold, 1), num(r.relevant_retention), `${r.relevant_kept} / ${r.relevant_candidates}`, num(r.ndcg10)])));
    }
    function drawTest(d) {
      panel.append(segments(t('Fixed before test inspection', '查看测试结果前已固定'), [[0, t('Dev-selected · τ=0.0', '开发集所选 · τ=0.0')], [.5, t('Diagnostic · τ=0.5', '诊断对照 · τ=0.5')]], testThreshold, value => { testThreshold = Number(value); draw('depth'); }));
      const f = d.filters.find(r => r.depth === 50 && r.threshold === testThreshold);
      const r = getRow(d, 50, testThreshold === .5 ? 'score_noul_fixed05' : 'score_noul');
      if (!f || !r) return;
      const negative = d.test_n * 50 - f.relevant_in_pool;
      const retention = 1 - f.relevant_rejected / f.relevant_in_pool;
      const removal = negative ? f.noise_rejected / negative : 0;
      panel.append(stats([[t('Relevant retained', '相关文档保留率'), pct(retention), `${f.relevant_in_pool - f.relevant_rejected} / ${f.relevant_in_pool}`], [t('Noise removed', '噪声移除率'), pct(removal), `${f.noise_rejected} / ${negative}`], [t('Empty outputs', '空结果'), `${Math.round(r.empty * d.test_n)} / ${d.test_n}`, t('queries returning nothing', '未返回任何结果的题数')]]));
      panel.append(meter(t('Relevant retained', '相关文档保留'), retention, 'score', `${f.relevant_in_pool - f.relevant_rejected} / ${f.relevant_in_pool}`, t(`${f.relevant_rejected} relevant candidates rejected`, `拒绝了 ${f.relevant_rejected} 个相关候选`)));
      panel.append(meter(t('Noise removed', '噪声移除'), removal, 'filter', `${f.noise_rejected} / ${negative}`, t('Unjudged documents count as nonrelevant.', '未标注文档按不相关处理。')));
      panel.append(stats([['nDCG@10', num(r.ndcg10), t('fixed output cutoff', '固定输出截断深度')], [t('Returned precision', '返回集合精确率'), num(r.returned_precision10), t('empty queries count as 0', '空结果按 0 计')], [t('Mean returned', '平均返回条数'), num(r.returned10, 2), t('at most 10 · no backfill', '最多 10 条 · 不回填')]]));
      panel.append(el('div', 'rx-callout rx-caution', t('Test inspection, not threshold selection. Only τ=0.0 and the prespecified τ=0.5 diagnostic were exported. No test-set slider or interpolated thresholds.', '这是查看测试结果，不是选择阈值。只导出了 τ=0.0 与预先指定的 τ=0.5 诊断策略，不提供测试集滑块，也不插值阈值。')));
      panel.append(exactTable([t('Policy', '策略'), 'nDCG@10', 'Recall@10', 'P@10', t('Returned precision', '返回精确率'), t('Mean returned', '平均返回'), t('Empty', '空结果')], ['score_noul', 'score_noul_fixed05'].map(key => { const a = getRow(d, 50, key); return [methodNames[key], num(a.ndcg10), num(a.recall10), num(a.precision10), num(a.returned_precision10), num(a.returned10, 2), `${Math.round(a.empty * d.test_n)}/${d.test_n}`]; })));
    }
    draw(); host.append(panel);
  }
  function renderCalibration(panel, calibration, dataset) {
    const d = calibration.datasets?.[dataset];
    if (!d?.test?.['50']) return;
    const labels = {no_gate: t('No gate', '不过滤'), original_dev: t('Original dev choice', '原始开发集选择'), fixed_05: t('Fixed 0.5', '固定 0.5'), v2_noul: t('v2 · Noul only', 'v2 · 仅 Noul'), v2_joint: t('v2 · joint gate', 'v2 · 联合过滤')};
    let selected = 'v2_joint', feature = 'noul', split = 'dev';
    panel.append(el('div', 'rx-callout rx-caution', t('Exploratory offline reanalysis of an already observed test cohort. Thresholds are fitted on development labels, but this is not a fresh confirmatory test. Use it to inspect transfer and failure, not to pick a test-optimal gate.', '这是对已观察测试样本的探索性离线再分析。阈值使用开发标签拟合，但不是一次新的确认性测试；它用于检查迁移与失败，不能用来挑选测试集最优过滤器。')));
    panel.append(note(t('v2 development objective: maximize noise rejection while retaining ≥95% of relevant candidates and keeping nDCG@10 within 0.005 of ungated Score. These are development constraints, not test guarantees.', 'v2 开发集目标：在相关候选保留率 ≥95%、nDCG@10 比不过滤 Score 下降不超过 0.005 的约束下，最大化噪声拒绝率。这些是开发集约束，不是测试集保证。')));
    const controlHost = el('div', 'rx-controls');
    controlHost.style.marginTop = '18px';
    const resultHost = el('div');
    function result() {
      resultHost.replaceChildren();
      const r = d.test['50'][selected];
      const policy = d.policies[selected];
      const ci = r.uncertainty?.ndcg10_delta?.ci95;
      resultHost.append(stats([[t('Test relevant retention', '测试相关文档保留率'), pct(r.relevant_retention), `${r.relevant_kept} / ${r.relevant_total}`], [t('Test noise rejection', '测试噪声拒绝率'), pct(r.noise_rejection), `${r.noise_rejected} / ${r.noise_total}`], ['Test nDCG@10', num(r.ndcg10), ci ? `Δ 95% CI [${signed(ci[0])}, ${signed(ci[1])}]` : '']]));
      resultHost.append(meter(t('Relevant kept', '保留相关文档'), r.relevant_retention, 'score', pct(r.relevant_retention)));
      resultHost.append(meter(t('Noise rejected', '拒绝噪声'), r.noise_rejection, 'filter', pct(r.noise_rejection)));
      const ds = selected === 'v2_noul' ? d.dev_selected?.noul : selected === 'v2_joint' ? d.dev_selected?.joint : null;
      if (ds) resultHost.append(note(t(`Development fit: retention ${pct(ds.relevant_retention)}, noise rejection ${pct(ds.noise_rejection)}, nDCG@10 ${num(ds.ndcg10)}. On test: ${Math.round(r.empty * r.queries)} empty outputs; mean ${num(r.returned10, 2)} documents returned.`, `开发集拟合：保留率 ${pct(ds.relevant_retention)}、噪声拒绝率 ${pct(ds.noise_rejection)}、nDCG@10 ${num(ds.ndcg10)}。测试集有 ${Math.round(r.empty * r.queries)} 个空结果，平均返回 ${num(r.returned10, 2)} 条。`)));
      resultHost.append(note(policyDescription(policy)));
      if (r.relevant_retention < .95) resultHost.append(el('div', 'rx-callout rx-caution', t('The development retention constraint did not transfer: test relevant retention is below 95%.', '开发集保留率约束未迁移成功：测试相关文档保留率低于 95%。')));
    }
    controlHost.append(selectControl(t('Frozen follow-up policy · N=50', '固定后续策略 · N=50'), Object.keys(labels).filter(k => d.test['50'][k]).map(k => [k, labels[k]]), selected, value => { selected = value; result(); }));
    append(panel, controlHost, resultHost); result();
    panel.append(exactTable([t('Fixed policy', '固定策略'), t('Retention dev', '开发保留率'), t('Retention test', '测试保留率'), t('Noise rejection test', '测试拒绝噪声'), 'nDCG@10', t('Empty', '空结果')], Object.entries(labels).filter(([k]) => d.test['50'][k]).map(([k, label]) => { const r = d.test['50'][k]; const dev = k === 'v2_noul' ? d.dev_selected?.noul : k === 'v2_joint' ? d.dev_selected?.joint : null; return [label, dev ? num(dev.relevant_retention) : '—', num(r.relevant_retention), num(r.noise_rejection), num(r.ndcg10), `${Math.round(r.empty * r.queries)}/${r.queries}`]; })));
    const diagnostics = d.feature_diagnostics;
    if (!diagnostics?.dev?.features) return;
    const featureLabels = {noul: t('Noul probability', 'Noul 概率'), high_mass: t('Score upper-level mass', 'Score 高等级概率质量'), confidence: t('Provider self-confidence', '供应商自置信度'), entropy: t('Score normalized entropy', 'Score 归一化熵')};
    const diagnosticsControls = el('div', 'rx-controls'); diagnosticsControls.style.marginTop = '22px';
    const diagnosticHost = el('div');
    function diagnostic() {
      diagnosticHost.replaceChildren();
      const bins = diagnostics[split]?.features?.[feature]?.bins?.filter(b => b.count > 0) || [];
      const frame = chartFrame(t('Observed relevance by feature bin. Bins are descriptive, not a calibrated predictive curve.', '各特征分箱的实际相关比例；分箱是描述统计，不是校准后的预测曲线。'), [0, .25, .5, .75, 1], t('Observed relevant fraction', '实际相关比例'), {height: 265, xLabel: featureLabels[feature], xFormat: v => num(v, 2)});
      const tooltip = el('div', 'rx-tooltip', t('Focus or tap a bin to inspect its sample count and observed relevance.', '聚焦或轻触分箱，查看样本量与实际相关比例。'), {'aria-live': 'polite'});
      if (['noul', 'high_mass'].includes(feature)) frame.svg.append(svgEl('line', {x1: frame.x(0), x2: frame.x(1), y1: frame.y(0), y2: frame.y(1), class: 'rx-grid'}));
      bins.forEach(b => {
        const text = `${featureLabels[feature]} [${num(b.lower, 1)}, ${num(b.upper, 1)}] · n=${b.count} · ${t('mean', '均值')} ${num(b.mean_value)} · ${t('relevant', '相关比例')} ${num(b.observed_relevant_rate)}`;
        const point = svgEl('circle', {cx: frame.x(b.mean_value), cy: frame.y(b.observed_relevant_rate), r: Math.max(5, Math.min(13, Math.sqrt(b.count) / 2)), fill: 'var(--rx-score)', 'fill-opacity': .7, tabindex: 0, role: 'button', 'aria-label': text});
        point.append(svgEl('title', {}, text)); ['focus', 'pointerenter', 'click'].forEach(e => point.addEventListener(e, () => { tooltip.textContent = text; }));
        point.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tooltip.textContent = text; } });
        frame.svg.append(point);
      });
      const chart = el('div', 'rx-chart'); chart.append(frame.svg); append(diagnosticHost, chart, tooltip);
      diagnosticHost.append(note(feature === 'confidence' ? t('Provider self-confidence is not P(relevant). A confident judgment may correctly reject a document. Noul does not expose this confidence field. Dot area grows with bin count; qrels are the reference.', '供应商自置信度不是 P(相关)。自信判断也可能是正确拒绝文档。Noul 不提供这一 confidence 字段。点大小随分箱样本量增加；以 qrels 为参考。') : t('Binned observed relevance is descriptive and depends on corpus prevalence and reference-label coverage. Small bins are unstable. Dot area grows with bin count.', '分箱后的实际相关比例是描述统计，依赖语料相关率与参考标签覆盖度；小分箱不稳定。点大小随样本量增加。')));
      diagnosticHost.append(exactTable([t('Bin', '分箱'), 'n', t('Mean feature', '特征均值'), t('Observed relevant', '实际相关率')], bins.map(b => [`${num(b.lower, 1)}–${num(b.upper, 1)}`, b.count, num(b.mean_value), num(b.observed_relevant_rate)])));
    }
    append(diagnosticsControls, selectControl(t('Inspect feature', '检查特征'), Object.entries(featureLabels), feature, value => { feature = value; diagnostic(); }), selectControl(t('Feature evidence split', '特征数据划分'), [['dev', t('Development', '开发集')], ['test', t('Test · descriptive only', '测试集 · 仅描述')]], split, value => { split = value; diagnostic(); }));
    append(panel, diagnosticsControls, diagnosticHost); diagnostic();
  }
  function policyDescription(policy) {
    if (!policy || policy.family === 'none') return t('No documents are rejected.', '不拒绝任何文档。');
    // Boundaries may be nextafter values in the export; display the exact decision
    // equivalence using <= when a threshold sits immediately above a decimal.
    const raw = policy.noul, rounded = Number(raw.toFixed(6));
    const rejection = raw > rounded && raw - rounded < 1e-9 ? `Noul ≤ ${num(rounded, 2)}` : `Noul < ${num(raw, 2)}`;
    if (policy.family !== 'joint') return t(`Reject when ${rejection}.`, `拒绝条件：${rejection}。`);
    return t(`Reject only when all hold: ${rejection}; Score upper-level mass < ${num(policy.high_mass, 2)}; provider confidence ≥ ${num(policy.confidence, 2)}; normalized entropy ≤ ${num(policy.entropy, 2)}.`, `仅在全部条件成立时拒绝：${rejection}；Score 高等级概率质量 < ${num(policy.high_mass, 2)}；供应商自置信度 ≥ ${num(policy.confidence, 2)}；归一化熵 ≤ ${num(policy.entropy, 2)}。`);
  }
  function meter(label, fraction, key, value, caption) {
    const row = el('div', 'rx-meter-row');
    const track = el('div', 'rx-meter-track', null, {'aria-hidden': 'true'});
    const fill = el('div', 'rx-meter-fill');
    fill.style.setProperty('--width', `${Math.max(0, Math.min(100, fraction * 100))}%`); fill.style.setProperty('--series', color(key)); track.append(fill);
    append(row, el('span', 'rx-meter-label', label), track, el('span', 'rx-meter-value', value));
    if (caption) row.append(el('span', 'rx-meter-caption', caption));
    return row;
  }
  function renderComparison(host, data) {
    let mode = 'quality', metric = 'ndcg10';
    const panel = el('section', 'rx-panel');
    const d = data.datasets.python_docs;
    if (!d?.comparison) throw new Error('Missing documentation comparison');
    function draw(focus) {
      panel.replaceChildren();
      heading(panel, t('03 / Real documentation', '03 / 真实文档'), t('Similar ranking. Different pipelines.', '排序接近，流程成本不同。'), t('Python · 20 test', 'Python · 20 测试题'));
      const controls = el('div', 'rx-controls');
      append(controls, selectControl(t('View', '视图'), [['quality', t('Paired quality · each query', '配对质量 · 逐题')], ['pipeline', t('Cost & latency · whole pipeline', '费用与延迟 · 完整流程')]], mode, value => { mode = value; draw('dataset'); }));
      if (mode === 'quality') controls.append(selectControl(t('Measure', '指标'), [['ndcg10', 'nDCG@10'], ['recall10', 'Recall@10']], metric, value => { metric = value; draw('metric'); }));
      panel.append(controls);
      if (mode === 'quality') drawQuality(); else drawPipeline();
      restoreControl(panel, focus);
    }
    function drawQuality() {
      const pairs = d.per_query_metrics.filter(r => r.depth === 50 && r.method === 'score').map(a => ({id: a.sample, jev: a[metric], luna: d.per_query_metrics.find(b => b.sample === a.sample && b.depth === 50 && b.method === 'luna')?.[metric]})).filter(p => Number.isFinite(p.luna));
      const legend = el('div', 'rx-quality-legend'); append(legend, legendItem('Jev Score', 'score', true), legendItem('GPT-6 Luna', 'luna', true)); panel.append(legend);
      const W = 640, H = 40 + pairs.length * 20 + 30;
      const svg = svgEl('svg', {viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': t(`Paired ${metric} on twenty documentation questions`, `二十道文档问题的配对 ${metric}`)});
      const x = value => 66 + value * 552;
      for (let i = 0; i <= 4; i++) append(svg, svgEl('line', {x1: x(i / 4), x2: x(i / 4), y1: 20, y2: H - 28, class: 'rx-grid'}), svgEl('text', {x: x(i / 4), y: H - 7, 'text-anchor': 'middle'}, num(i / 4, 2)));
      svg.append(svgEl('text', {x: 0, y: 12, class: 'rx-axis-label'}, t('Query', '题号')));
      const tooltip = el('div', 'rx-tooltip', t('Each row is one question. Focus or tap a pair to see exact values. Overlapping dots mean equal quality.', '每行一个问题，聚焦或轻触可查看数值；数据点重合表示指标相同。'), {'aria-live': 'polite'});
      pairs.forEach((p, i) => {
        const y = 31 + i * 20;
        const text = `${t('Query', '题号')} ${String(p.id).padStart(2, '0')} · Jev ${num(p.jev)} · Luna ${num(p.luna)} · Δ ${signed(p.luna - p.jev)}`;
        const g = svgEl('g', {class: 'rx-pair-row', tabindex: 0, role: 'button', 'aria-label': text});
        append(g, svgEl('rect', {x: 0, y: y - 9, width: W, height: 20, fill: 'transparent'}), svgEl('text', {x: 0, y: y + 4}, String(p.id).padStart(2, '0')), svgEl('line', {x1: x(p.jev), x2: x(p.luna), y1: y, y2: y, class: 'rx-pair-line'}));
        append(g, svgEl('circle', {cx: x(p.jev), cy: y, r: 4.5, fill: 'var(--rx-score)'}), svgEl('circle', {cx: x(p.luna), cy: y, r: 4.5, fill: 'var(--card)', stroke: 'var(--rx-luna)', 'stroke-width': 2}), svgEl('title', {}, text));
        ['focus', 'pointerenter', 'click'].forEach(event => g.addEventListener(event, () => { tooltip.textContent = text; }));
        g.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); tooltip.textContent = text; } });
        svg.append(g);
      });
      const chart = el('div', 'rx-chart'); chart.append(svg); append(panel, chart, tooltip);
      const score = getRow(d, 50, 'score'), luna = getRow(d, 50, 'luna'), ci = d.comparison.paired_luna_minus_jev_ndcg;
      panel.append(stats([['Jev Score', num(score[metric]), t('mean · 20 test queries', '均值 · 20 测试题')], ['GPT-6 Luna', num(luna[metric]), t('same retrieved candidates', '相同召回候选')], [t('Luna − Jev', 'Luna − Jev'), signed(luna[metric] - score[metric]), metric === 'ndcg10' ? `95% CI [${signed(ci.ci95[0])}, ${signed(ci.ci95[1])}]` : t('paired mean difference', '配对平均差')]]));
      panel.append(note(t('Section-reference labels are not exhaustive chunk judgments. A small paired interval spanning zero does not establish a quality winner. These questions measure retrieval, not generated-answer correctness.', '章节参考标签不是穷尽的片段判断。小样本配对区间跨过零，无法确立质量胜者；此处测量检索，并非生成答案的正确率。')));
      panel.append(exactTable([t('Query', '题号'), 'Jev Score', 'GPT-6 Luna', 'Luna − Jev'], pairs.map(p => [String(p.id).padStart(2, '0'), num(p.jev), num(p.luna), signed(p.luna - p.jev)])));
    }
    function drawPipeline() {
      const j = d.timing.jev, l = d.timing.luna;
      const items = [[t('Rerank cost · all 24 queries', '重排费用 · 全部 24 题'), j.cost_usd, l.cost_usd, n => `$${num(n, 6)}`], [t('Median query wall time', '查询耗时中位数'), j.p50_wall_ms, l.p50_wall_ms, n => `${num(n / 1000, 2)} s`], [t('p95 query wall time', '查询耗时 p95'), j.p95_wall_ms, l.p95_wall_ms, n => `${num(n / 1000, 2)} s`]];
      const legend = el('div', 'rx-quality-legend'); append(legend, legendItem('Jev Score → Noul', 'score', true), legendItem('GPT-6 Luna', 'luna', true)); panel.append(legend);
      items.forEach(([label, a, b, format]) => { panel.append(note(label)); panel.append(meter('Jev', a / Math.max(a, b), 'score', format(a))); panel.append(meter('Luna', b / Math.max(a, b), 'luna', format(b))); });
      panel.append(el('div', 'rx-callout rx-caution', t('Observed client pipelines, including batching and concurrency. Jev: four requests per query, up to four queries concurrently. Luna: fifty requests per query, eight document calls concurrently, one query at a time. These bars do not isolate model speed.', '这是包含批处理与并发的客户端流程耗时。Jev 每题 4 次请求，最多 4 题并发；Luna 每题 50 次请求、8 个文档调用并发、每次处理 1 题。这些柱条不能隔离比较模型推理速度。')));
      panel.append(note(t(`Timing samples: Jev ${j.timing_queries}; Luna ${l.timing_queries}. Two resumed Luna queries remain in quality and cost, but not latency. Score-only standalone timing was not measured.`, `计时样本：Jev ${j.timing_queries} 题；Luna ${l.timing_queries} 题。两道恢复的 Luna 问题计入质量和费用，但不计延迟。没有单独测量仅 Score 的完整耗时。`)));
      panel.append(exactTable([t('Pipeline', '流程'), t('Cost USD', '费用 USD'), t('Median seconds', '中位秒数'), t('p95 seconds', 'p95 秒数'), t('Timing n', '计时题数')], [['Jev Score → Noul', num(j.cost_usd, 6), num(j.p50_wall_ms / 1000, 4), num(j.p95_wall_ms / 1000, 4), j.timing_queries], ['GPT-6 Luna', num(l.cost_usd, 6), num(l.p50_wall_ms / 1000, 4), num(l.p95_wall_ms / 1000, 4), l.timing_queries]]));
    }
    draw(); host.append(panel);
  }
  async function getJSON(path) {
    const url = new URL(path, scriptURL);
    if (url.origin !== new URL(document.baseURI).origin) throw new Error('Evidence must be same-origin');
    if (!cache.has(url.href)) cache.set(url.href, fetch(url.href, {credentials: 'same-origin'}).then(response => { if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`); return response.json(); }));
    return cache.get(url.href);
  }
  async function enhance(host) {
    if (host.dataset.rerankReady || host.dataset.rerankLoading) return;
    host.dataset.rerankLoading = 'true';
    const output = el('div', 'rx-enhanced');
    if (host.dataset.rerankView) output.dataset.rerankView = host.dataset.rerankView;
    try {
      const data = await getJSON(host.dataset.evidence || 'jev-rerank-evidence.json');
      if (!data.datasets?.jqara?.aggregate || !data.datasets?.scifact?.aggregate) throw new Error('Unsupported evidence schema');
      const extras = {};
      const optional = await Promise.allSettled(['baseline', 'calibration'].map(key => host.dataset[key] ? getJSON(host.dataset[key]) : Promise.resolve(null)));
      optional.forEach((result, i) => { if (result.status === 'fulfilled') extras[['baseline', 'calibration'][i]] = result.value; });
      const render = {retrieval: renderRetrieval, threshold: renderThreshold, comparison: renderComparison}[host.dataset.rerankPanel];
      if (!render) throw new Error('Unknown rerank panel');
      render(output, data, extras);
      host.append(output);
      host.querySelectorAll('[data-rerank-fallback]').forEach(fallback => { fallback.hidden = true; });
      host.dataset.rerankReady = 'true';
    } catch (error) {
      // An authored, complete no-JS fallback remains visible on any failure.
      output.remove();
      console.warn('Rerank explorer unavailable:', error.message);
    } finally { delete host.dataset.rerankLoading; }
  }
  function refresh() { return Promise.allSettled([...document.querySelectorAll('[data-rerank-panel]')].map(enhance)); }
  window.RerankExplorer = Object.freeze({refresh});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, {once: true}); else refresh();
})();
