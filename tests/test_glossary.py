from html.parser import HTMLParser
from pathlib import Path
import unittest

from glossary import Glossary

ROOT = Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs, self.text = [], []
        self.depth = 0
        self.nested = False

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.nested |= self.depth > 0
            self.depth += 1
            self.hrefs.append(dict(attrs).get('href', ''))

    def handle_endtag(self, tag):
        if tag == 'a':
            self.depth -= 1

    def handle_data(self, data):
        self.text.append(data)


class GlossaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.glossary = Glossary(ROOT / 'content/glossary.json')

    def annotate(self, body, page='jev-rerank', language='zh-CN'):
        return self.glossary.annotate(body, language, '/harness-notes/zh/', page)

    def test_longest_alias_boundaries_and_repeated_mentions(self):
        html, used = self.annotate('<p>Jev Score; Jev; Jev; nDCG@10; nDCG@100; Jevish; preJev; 中文Jev中文</p>')
        links = Links()
        links.feed(html)
        self.assertEqual(len(links.hrefs), 5)
        self.assertTrue(links.hrefs[0].endswith('/score/'))
        self.assertEqual(used, {'score', 'jev', 'ndcg'})
        self.assertIn('nDCG@100; Jevish; preJev;', html)

    def test_preserves_protected_content_and_entities(self):
        protected = ('<h2>Jev</h2><a href="/x">Read about Jev <strong>Score</strong></a>'
                     '<pre><code>Jev</code></pre><blockquote>Jev</blockquote>'
                     '<div class="case-card"><p>Jev</p></div><template>Jev</template>'
                     '<span data-no-glossary>Jev</span><p class="meta">Jev</p>')
        source = protected + '<p>A &amp; B &#8212; <strong>Jev</strong> &lt; 3</p>'
        result, used = self.annotate(source)
        self.assertTrue(result.startswith(protected))
        before, after = Links(), Links()
        before.feed(source)
        after.feed(result)
        self.assertEqual(''.join(before.text), ''.join(after.text))
        self.assertFalse(after.nested)
        self.assertEqual(used, {'jev'})
        self.assertEqual(result, self.annotate(result)[0])

    def test_ambiguous_words_and_scope(self):
        text = '<p>Score score Choice choice Top-1 Jev</p>'
        self.assertEqual(self.annotate(text)[1], {'score', 'choice', 'top-1', 'jev'})
        self.assertEqual(self.annotate(text, 'methods')[1], {'jev'})
        result = self.annotate(text)[0]
        self.assertIn(' score ', result)
        self.assertIn(' choice ', result)

    def test_authored_links_preserve_targets_styles_and_inline_content(self):
        source = ('<p><a class="source" href="https://docs.typesafe.ai/primitives/score?a=1&amp;b=2" '
                  'target="_blank" rel="noopener">Jev <strong>Score</strong></a> '
                  '<a href="https://docs.typesafe.ai/primitives/noul">&#78;oul</a></p>')
        result, used = self.annotate(source)
        self.assertEqual(used, {'score', 'noul'})
        self.assertIn('class="source"', result)
        self.assertNotIn('class="term-link"', result)
        self.assertIn('target="_blank" rel="noopener"', result)
        self.assertIn('>Jev <strong>Score</strong></a>', result)
        self.assertIn('>&#78;oul</a>', result)
        self.assertIn('data-term-href="/harness-notes/zh/glossary/score/"', result)
        before, after = Links(), Links()
        before.feed(source)
        after.feed(result)
        self.assertEqual(before.hrefs, after.hrefs)
        self.assertEqual(before.text, after.text)
        self.assertFalse(after.nested)
        self.assertEqual(result, self.annotate(result)[0])

    def test_authored_links_obey_scope_and_protected_context(self):
        protected = ('<h2><a href="/x">Jev</a></h2>'
                     '<a href="/x" data-no-glossary>Jev</a>'
                     '<a href="/x"><code>Jev</code></a>'
                     '<div class="case-card"><a href="/x">Jev</a></div>'
                     '<a href="/x">A Jev experiment</a><a href="/x">choice</a>')
        self.assertEqual(self.annotate(protected), (protected, set()))
        self.assertEqual(self.annotate('<a href="/x">Score</a>', 'methods')[1], set())

    def test_all_generated_internal_links_exist(self):
        pages = list(ROOT.glob('glossary/**/index.html')) + list(ROOT.glob('zh/glossary/**/index.html'))
        self.assertEqual(len(pages), (len(self.glossary.terms) + 1) * 2)
        for base in ('projects', 'research', 'writing', 'methods', 'zh/projects', 'zh/research', 'zh/writing', 'zh/methods'):
            pages.extend((ROOT / base).glob('**/index.html'))
        for path in pages:
            parser = Links()
            parser.feed(path.read_text(encoding='utf-8'))
            self.assertFalse(parser.nested, str(path))
            for href in parser.hrefs:
                if href.startswith('/harness-notes/'):
                    target = href.split('#')[0].removeprefix('/harness-notes/')
                    dest = ROOT / target
                    if href.split('#')[0].endswith('/'):
                        dest /= 'index.html'
                    self.assertTrue(dest.exists(), f'{path}: {href}')


if __name__ == '__main__':
    unittest.main()
