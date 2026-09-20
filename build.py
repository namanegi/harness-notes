"""Build a small static notebook from Markdown. No private repository access."""
from pathlib import Path
from html import escape
import json
import markdown

ROOT = Path(__file__).parent
BASE = '/harness-notes/'
PAGES = [
    ('home', '', 'Harness Notes', '把 agent 的决策、执行与反馈拆开研究。'),
    ('projects', 'projects/', '研究项目', '各自保留问题、方法、数据与适用范围。'),
    ('jev', 'projects/jev/', 'Jev：决策应该交给谁？', '从单步判断，到实际转交与完整工具工作流。'),
    ('compile-then-act', 'projects/compile-then-act/', 'Compile, Then Act?', '在线调度、编译计划与有界恢复的公开实验。'),
    ('writing', 'writing/', '文章', '从具体失败出发，讨论可以迁移的工程判断。'),
    ('decisions-and-code', 'writing/2026-09-21-decisions-and-code/', '哪些判断交给模型，哪些留给代码', '两项研究中的控制边界与完整成本。'),
    ('methods', 'methods/', '如何做这些小实验', '让范围、分母、失败与费用可以被检查。'),
    ('about', 'about/', '关于', 'namanegi 的 Harness Engineering 研究笔记。'),
]
for name, route, title, description in PAGES:
    source = ROOT/'content'/f'{name}.md'
    body = markdown.markdown(source.read_text(encoding='utf-8'), extensions=['tables','fenced_code','toc'])
    body = body.replace('href="@/', f'href="{BASE}')
    page = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · namanegi</title><meta name="description" content="{escape(description)}">
<link rel="canonical" href="https://namanegi.github.io{BASE}{route}"><link rel="stylesheet" href="{BASE}assets/style.css">
<meta name="theme-color" content="#f6f3ec"></head>
<body><a class="skip" href="#main">跳到正文</a><header class="site-header"><a class="brand" href="{BASE}">Harness<span>/</span>Notes</a>
<nav aria-label="主导航"><a href="{BASE}projects/">研究</a><a href="{BASE}writing/">文章</a><a href="{BASE}methods/">方法</a><a href="{BASE}about/">关于</a></nav></header>
<main id="main" class="{'home' if name=='home' else 'prose'}">{body}</main>
<footer><span>namanegi · Harness Engineering</span><a href="https://github.com/namanegi/harness-notes">页面源文件 ↗</a><span>研究有边界，结论保留条件。</span></footer></body></html>'''
    dest=ROOT/route/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(page,encoding='utf-8')
print(f'Built {len(PAGES)} pages')
