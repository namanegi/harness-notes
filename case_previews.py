"""Shared static case cards, progressively enhanced into a dialog.

Articles reference <!-- case:case-id -->. The appendix uses <!-- case-library -->.
Builds need only the reviewed public JSON, never the private experiment repository.
"""
from html import escape
import json
import re

CASE_REF = re.compile(r'<!--\s*case:([a-z0-9-]+)\s*-->')


class CasePreviews:
    def __init__(self, path):
        data = json.loads(path.read_text(encoding='utf-8'))
        self.cases = {case['id']: case for case in data['cases']}
        if len(self.cases) != len(data['cases']):
            raise ValueError('Duplicate case IDs')
        for case_id, case in self.cases.items():
            if not re.fullmatch(r'[a-z0-9-]+', case_id):
                raise ValueError(f'Invalid case ID: {case_id}')
            for key in ('title', 'cohort', 'input', 'explanation'):
                for language in ('en', 'zh'):
                    if not case[key].get(language):
                        raise ValueError(f'Missing {language} {key} in {case_id}')

    @staticmethod
    def raw(value):
        return '<pre><code>' + escape(json.dumps(value, ensure_ascii=False, indent=2)) + '</code></pre>'

    def card(self, case_id, language, preview=False):
        case = self.cases[case_id]
        zh = language == 'zh'
        def tr(en, cn): return cn if zh else en
        def txt(key): return escape(case[key][language])
        title_id = f'{"preview" if preview else "case"}-{case_id}-title'
        card_id = '' if preview else f' id="case-{case_id}"'
        parts = [f'<article class="case-card"{card_id} aria-labelledby="{title_id}">',
                 f'<p class="case-cohort">{txt("cohort")}</p>',
                 f'<h3 id="{title_id}">{txt("title")}</h3>',
                 f'<p class="case-identity">{tr("Case", "案例")} <code>{escape(case["case_id"])}</code></p>',
                 f'<dl class="case-facts"><dt>{tr("Input summary", "输入摘要")}</dt><dd>{txt("input")}</dd>',
                 f'<dt>{tr("Expected", "预期")}</dt><dd><code>{escape(case["expected"])}</code></dd></dl>',
                 f'<p class="case-explanation">{txt("explanation")}</p>']
        if 'input_excerpt' in case:
            parts.append(f'<details class="case-detail"><summary>{tr("Original input fields and candidates", "原始输入字段与候选")}</summary>{self.raw(case["input_excerpt"])}</details>')
        for record in case['records']:
            status = tr('Passed', '通过') if record['correct'] else tr('Failed', '未通过')
            parts.extend([
                '<section class="case-record">',
                f'<h4>{escape(record["label"][language])} <span class="case-status">{status}</span></h4>',
                f'<p class="case-config">{escape(record["config"])}</p>',
                f'<p>{tr("Recorded result", "记录结果")}：<code>{escape(record["actual"])}</code></p>',
            ])
            if 'trace' in record:
                parts.append('<ol class="case-trace">')
                for number, step in enumerate(record['trace'], 1):
                    marker = ' class="case-key-step"' if number in record.get('highlight_steps', []) else ''
                    accepted = tr('Accepted', '工具接受') if step['result'].get('ok') else tr('Rejected', '工具拒绝')
                    parts.append(f'<li{marker}><code>{escape(step["action"])}</code><span>{accepted}</span></li>')
                parts.append('</ol>')
            raw = {'scoring': record['output'], 'trace': record['trace']} if 'trace' in record else record['output']
            label = tr('Recorded tool trace and scoring', '工具轨迹与评分原始字段') if 'trace' in record else tr('Original model output fields', '模型输出原始字段')
            parts.append(f'<details class="case-detail"><summary>{label}</summary>{self.raw(raw)}</details>')
            parts.append(f'<details class="case-detail case-source"><summary>{tr("Source record", "来源记录")}</summary><p>{tr("Private local source; hash identifies the source file. Only the selected excerpt is published.", "来源为本地私有记录，哈希用于标识源文件；公开内容仅包含选取的摘录。")}</p>{self.raw(record["source"])}</details></section>')
        parts.append('</article>')
        return '\n'.join(parts)

    def render(self, body, language, base):
        language = 'zh' if language == 'zh-CN' else 'en'
        zh = language == 'zh'
        ids = []
        def entry(match):
            case_id = match.group(1)
            case = self.cases[case_id]  # Unknown references fail the build.
            if case_id not in ids:
                ids.append(case_id)
            label = ('查看案例：' if zh else 'View case: ') + case['title'][language]
            href = f'{base}research/jev-report/#case-{case_id}'
            return f'<p class="case-entry"><a class="case-link" data-case-id="{case_id}" href="{href}">{escape(label)} <span aria-hidden="true">↗</span></a></p>'
        body = CASE_REF.sub(entry, body)
        library = '<!-- case-library -->' in body
        if library:
            nav = '<ul class="case-index">' + ''.join(
                f'<li><a href="#case-{cid}">{escape(case["title"][language])}</a></li>' for cid, case in self.cases.items()) + '</ul>'
            cards = '\n'.join(self.card(cid, language) for cid in self.cases)
            body = body.replace('<!-- case-library -->', nav + cards)
        if ids:
            body += '\n' + '\n'.join(f'<template id="case-template-{cid}">{self.card(cid, language, preview=True)}</template>' for cid in ids)
            title = '选取案例' if zh else 'Selected case'
            close = '关闭' if zh else 'Close'
            appendix = '在附录中打开此案例' if zh else 'Open this case in the appendix'
            body += f'''<dialog class="case-dialog" aria-modal="true" aria-label="{title}">
<div class="case-dialog-bar"><span>{title}</span><button class="case-close" type="button" autofocus>{close} <span aria-hidden="true">×</span></button></div>
<div class="case-dialog-content"></div>
<div class="case-dialog-footer"><a class="case-permalink" href="{base}research/jev-report/">{appendix}</a></div>
</dialog>'''
        return body, bool(ids or library), bool(ids)
