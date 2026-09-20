"""Draw the three original, sketch-style SVG method diagrams. No dependencies."""
from pathlib import Path
from html import escape
import random

ZH = {'Online and compiled scheduling': '在线调度与预编译计划', 'A debate loop with an optional checker': '包含检查员的讨论循环', 'Jev workflow control and parameter generation': 'Jev 工作流控制与参数生成', 'Online: decide after observing': '在线调度：观察之后再决定', 'Choose': '选择', 'a batch': '下一批任务', 'Run': '执行', 'tasks': '任务', 'Read': '读取', 'results': '结果', 'The next batch can change.': '根据新发现安排下一批。', 'Compiled: decide before running': '预编译：执行之前做决定', 'Build one': '生成一张', 'fixed graph': '固定依赖图', 'Ready task A': '就绪任务 A', 'Ready task B': '就绪任务 B', 'Run ready work together; keep the graph.': '并行执行就绪任务，运行中不改图。', 'Turn 1: independent answers': '第一轮：各自独立作答', 'Solver A': '解题者 A', 'Solver B': '解题者 B', 'Solver /': '解题者 /', 'checker': '检查员', 'Read peers’ previous reasoning': '阅读同伴上一轮的完整推理', 'Revise + vote': '修改答案，再投票', 'repeat': '重复', 'A checker is still inside': '检查员也身处', 'the feedback loop.': '这个反馈循环。', 'Current state': '当前状态', 'Jev: choose action': 'Jev 选择动作', 'Stop': '停止', 'end run': '结束运行', 'Known fields': '已知字段', 'copied by code': '代码直接复制', 'Text needed?': '需要生成文字？', 'Luna writes it': '交给 Luna', 'Execute tool': '执行工具', 'Observe feedback': '观察工具反馈', 'Score the final state separately.': '终态由独立的评分过程检查。', 'Stopping does not prove success.': '停止不等于成功。'}

DIAGRAM_ROOT = Path(__file__).parent / 'assets' / 'diagrams'
INK, BLUE, GREEN, RED = '#38464a', '#e0eaf1', '#e5eddf', '#f4e0d5'


class Sketch:
    def __init__(self, title, height, seed):
        self.rng = random.Random(seed)
        title = ZH.get(title, title) if LANGUAGE == 'zh' else title
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 {height}" role="img" aria-labelledby="title">',
                      f'<title id="title">{escape(title)}</title>',
                      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#38464a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>',
                      f'<rect width="600" height="{height}" rx="14" fill="#fbf9f3"/>']

    def text(self, x, y, lines, size=23, color=INK):
        for i, line in enumerate(lines):
            line = ZH.get(line, line) if LANGUAGE == 'zh' else line
            font = 'KaiTi, STKaiti, cursive' if LANGUAGE == 'zh' else 'Segoe Print, Bradley Hand, cursive'
            self.parts.append(f'<text x="{x}" y="{y + i * (size + 8)}" text-anchor="middle" fill="{color}" font-size="{size}" font-family="{font}">{escape(line)}</text>')

    def box(self, x, y, w, h, lines, fill=BLUE, size=23):
        # Two slightly different paths give the outlines a restrained pencil feel.
        for i in range(2):
            j = lambda: self.rng.uniform(-1.8, 1.8)
            path = f'M{x+j():.1f} {y+j():.1f} Q{x+w/2:.1f} {y+j():.1f} {x+w+j():.1f} {y+j():.1f} L{x+w+j():.1f} {y+h+j():.1f} Q{x+w/2:.1f} {y+h+j():.1f} {x+j():.1f} {y+h+j():.1f} Z'
            self.parts.append(f'<path d="{path}" fill="{fill if i == 0 else "none"}" stroke="{INK}" stroke-width="{1.5 if i == 0 else .7}" opacity="{1 if i == 0 else .5}" stroke-linejoin="round"/>')
        baseline = y + h/2 - (len(lines)-1)*(size+8)/2 + size*.34
        self.text(x+w/2, baseline, lines, size)

    def arrow(self, path, dashed=False):
        dash = ' stroke-dasharray="6 6"' if dashed else ''
        self.parts.append(f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"{dash}/>')

    def save(self, name):
        (OUT / f'{name}.svg').write_text('\n'.join(self.parts + ['</svg>']) + '\n', encoding='utf-8', newline='\n')


def draw_all():
    s = Sketch('Online and compiled scheduling', 650, 11)
    s.text(300, 42, ['Online: decide after observing'], 25)
    s.box(30, 82, 155, 82, ['Choose', 'a batch'])
    s.box(225, 82, 150, 82, ['Run', 'tasks'], GREEN)
    s.box(415, 82, 155, 82, ['Read', 'results'])
    s.arrow('M188 124 Q205 122 220 124')
    s.arrow('M378 124 Q395 126 410 124')
    s.arrow('M492 170 L492 218 Q302 225 108 218 L108 171')
    s.text(300, 260, ['The next batch can change.'], 23)
    s.parts.append('<path d="M28 295 Q300 292 572 295" stroke="#d9d8ce" fill="none" stroke-dasharray="4 6"/>')
    s.text(300, 337, ['Compiled: decide before running'], 25)
    s.box(35, 404, 180, 105, ['Build one', 'fixed graph'])
    s.box(335, 380, 215, 73, ['Ready task A'], GREEN)
    s.box(335, 482, 215, 73, ['Ready task B'], GREEN)
    s.arrow('M220 448 L275 448 L275 417 L330 417')
    s.arrow('M275 448 L275 518 L330 518')
    s.text(300, 606, ['Run ready work together; keep the graph.'], 22)
    s.save('plan')

    s = Sketch('A debate loop with an optional checker', 600, 23)
    s.text(300, 40, ['Turn 1: independent answers'], 25)
    s.box(22, 79, 163, 85, ['Solver A'])
    s.box(219, 79, 163, 85, ['Solver B'])
    s.box(414, 79, 163, 85, ['Solver /', 'checker'], RED)
    s.arrow('M104 170 L104 205 L300 205 L300 232')
    s.arrow('M300 170 L300 202')
    s.arrow('M495 170 L495 205 L310 205')
    s.box(92, 240, 416, 78, ['Read peers’ previous reasoning'])
    s.arrow('M300 323 Q298 341 300 358')
    s.box(147, 365, 306, 79, ['Revise + vote'], GREEN)
    s.arrow('M458 405 L550 405 L550 278 L514 278')
    s.text(485, 476, ['repeat'], 21)
    s.text(295, 531, ['A checker is still inside', 'the feedback loop.'], 25, '#914c37')
    s.save('debate')

    s = Sketch('Jev workflow control and parameter generation', 752, 37)
    s.box(180, 24, 240, 62, ['Current state'])
    s.arrow('M300 92 L300 118')
    s.box(180, 124, 240, 77, ['Jev: choose action'], BLUE, 22)
    s.arrow('M424 163 L437 163 L437 134 L443 134')
    s.box(447, 104, 130, 60, ['Stop'], RED)
    s.text(506, 196, ['end run'], 20)
    s.arrow('M240 207 L240 237 L146 237 L146 270')
    s.arrow('M359 207 L359 237 L345 237 L345 270')
    s.box(37, 277, 215, 94, ['Known fields', 'copied by code'], GREEN, 22)
    s.box(290, 277, 215, 94, ['Text needed?', 'Luna writes it'], BLUE, 22)
    s.arrow('M145 377 L145 409 L300 409 L300 438')
    s.arrow('M398 377 L398 409 L310 409')
    s.box(180, 445, 240, 65, ['Execute tool'], GREEN)
    s.arrow('M300 516 L300 548')
    s.box(180, 555, 240, 70, ['Observe feedback'])
    s.arrow('M174 590 L18 590 L18 56 L174 56')
    s.text(300, 682, ['Score the final state separately.'], 23)
    s.text(300, 720, ['Stopping does not prove success.'], 22, '#914c37')
    s.save('jev')


for LANGUAGE in ('en', 'zh'):
    OUT = DIAGRAM_ROOT / ('zh' if LANGUAGE == 'zh' else '')
    OUT.mkdir(parents=True, exist_ok=True)
    draw_all()
print('Drew three paired SVG diagrams')
