"""Build a small static notebook from Markdown. No private repository access."""
from pathlib import Path
from html import escape
import json
import markdown

ROOT = Path(__file__).parent
BASE = '/harness-notes/'
PAGES = [
    ('home', '', 'Harness Notes', 'Small experiments with planning, decisions and model collaboration.'),
    ('projects', 'projects/', 'Experiments', 'Research on decisions, planning and model collaboration.'),
    ('jev', 'projects/jev/', 'Can cheap decisions make a cheap agent?', 'Jev was fast at local choices. Complete workflows exposed stopping and recovery problems.'),
    ('jev-choices', 'projects/jev-choices/', 'What can a decision model actually decide?', 'Where Jev can take over an agent decision: rules, reasoning and candidate scores.'),
    ('jev-comparison', 'projects/jev-comparison/', 'Jev vs. Luna: compare the decision, then count the cost', 'Matched Jev–Luna decisions, caching and the cost of conditional handoff.'),
    ('jev-report', 'research/jev-report/', 'Jev experiment appendix', 'Methods and results for each separate experimental cohort.'),
    ('compile-then-act', 'projects/compile-then-act/', 'Does planning ahead actually save time?', 'Comparing adaptive scheduling with fixed plans across 40 questions.'),
    ('debate', 'projects/debate-workbench/', 'When small models debate, who checks the answer?', 'Debate Workbench: correction, checkers and wrong consensus.'),
    ('writing', 'writing/', 'Notes', 'What the experiments changed about how I build agents.'),
    ('decisions-and-code', 'writing/2026-09-21-decisions-and-code/', 'When is another model call worth it?', 'What does an extra check, debate round or planning step add?'),
    ('methods', 'methods/', 'How I run these experiments', 'Small comparisons, complete task costs and close inspection of failures.'),
    ('about', 'about/', 'About', 'Harness engineering notes by namanegi.'),
]
ZH = json.loads((ROOT/'content/zh/site.json').read_text(encoding='utf-8'))
# Both authored versions are required. Never silently fall back to another language.
for name, *_ in PAGES:
    for folder in ('content', 'content/zh'):
        if not (ROOT/folder/f'{name}.md').is_file():
            raise FileNotFoundError(f'Missing paired article: {folder}/{name}.md')
for language, prefix in [('en', ''), ('zh-CN', 'zh/')]:
  local_base = BASE + prefix
  labels = ['Experiments', 'Notes', 'Methods', 'About'] if language == 'en' else ['实验', '随笔', '方法', '关于']
  skip = 'Skip to content' if language == 'en' else '跳到正文'
  nav_label = 'Main navigation' if language == 'en' else '主导航'
  for name, route, title, description in PAGES:
    if language == 'zh-CN':
        title, description = ZH[name]
    source = ROOT/'content'/prefix/f'{name}.md'
    body = markdown.markdown(source.read_text(encoding='utf-8'), extensions=['tables','fenced_code','toc','md_in_html'])
    body = body.replace('href="@/assets/', f'href="{BASE}assets/').replace('href="@/', f'href="{local_base}')
    nav = ''.join(f'<a href="{local_base}{path}/">{label}</a>' for path, label in zip(['projects','writing','methods','about'], labels))
    en_current = ' aria-current="page"' if language == 'en' else ''
    zh_current = ' aria-current="page"' if language == 'zh-CN' else ''
    page = f'''<!doctype html>
<html lang="{language}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · namanegi</title><meta name="description" content="{escape(description)}">
<meta name="theme-color" content="#12191e"><script src="{BASE}assets/theme.js"></script>
<link rel="canonical" href="https://namanegi.github.io{local_base}{route}"><link rel="stylesheet" href="{BASE}assets/style.css">
<link rel="alternate" hreflang="en" href="https://namanegi.github.io{BASE}{route}"><link rel="alternate" hreflang="zh-CN" href="https://namanegi.github.io{BASE}zh/{route}">
</head>
<body><a class="skip" href="#main">{skip}</a><header class="site-header"><a class="brand" href="{local_base}">Harness<span>/</span>Notes</a>
<nav class="main-nav" aria-label="{nav_label}">{nav}</nav>
<div class="header-controls"><nav class="language-switch" aria-label="Language / 语言"><a href="{BASE}{route}" lang="en" hreflang="en"{en_current}>EN</a><span aria-hidden="true">/</span><a href="{BASE}zh/{route}" lang="zh-CN" hreflang="zh-CN"{zh_current}>中文</a></nav><button class="theme-toggle" type="button" hidden></button></div></header>
<main id="main" class="{'home' if name=='home' else 'prose'}">{body}</main>
<footer><span>namanegi · Harness Engineering</span><a href="https://github.com/namanegi/harness-notes">GitHub ↗</a></footer></body></html>'''
    dest=ROOT/prefix/route/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(page,encoding='utf-8',newline='\n')
print(f'Built {len(PAGES)*2} pages ({len(PAGES)} paired articles)')
