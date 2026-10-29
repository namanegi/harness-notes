"""Bilingual glossary pages and conservative HTML text-node annotation."""
from html import escape, unescape
from html.parser import HTMLParser
import json
import re


class Glossary:
    def __init__(self, path):
        self.terms = json.loads(path.read_text(encoding='utf-8'))
        ids = set()
        aliases = set()
        for term in self.terms:
            tid = term['id']
            if not re.fullmatch(r'[a-z0-9-]+', tid) or tid in ids:
                raise ValueError(f'Invalid or duplicate glossary ID: {tid}')
            ids.add(tid)
            for lang in ('en', 'zh'):
                for field in ('title', 'summary', 'detail'):
                    if not term[lang].get(field):
                        raise ValueError(f'Missing {lang} {field}: {tid}')
            for alias in term['aliases']:
                if not alias or alias.casefold() in aliases:
                    raise ValueError(f'Empty or duplicate glossary alias: {alias}')
                aliases.add(alias.casefold())

    def annotate(self, body, language, base, page):
        parser = TermParser(self.terms, language, base, page)
        parser.feed(body)
        parser.close()
        return ''.join(parser.output), parser.used

    def pages(self, language, base, articles, usages):
        lang = 'zh' if language == 'zh-CN' else 'en'
        zh = lang == 'zh'
        label = '术语表' if zh else 'Glossary'
        intro = ('阅读实验时用到的概念、接口和指标。先看简短解释，再沿着词条回到具体实验。'
                 if zh else 'Concepts, interfaces and metrics used in the experiments. Start with a short explanation, then follow a term back to the research.')
        cards = []
        pages = []
        for term in self.terms:
            tid, text = term['id'], term[lang]
            route = f'glossary/{tid}/'
            cards.append(f'<li><a href="{base}{route}">{escape(text["title"])}</a><p>{escape(text["summary"])}</p></li>')
            body = (f'<p class="eyebrow"><a href="{base}glossary/">{label}</a></p>'
                    f'<h1>{escape(text["title"])}</h1><p class="term-lede">{escape(text["summary"])}</p>'
                    f'<p>{escape(text["detail"])}</p>')
            references = term.get('sources', [])
            if references:
                body += '<h2>' + ('参考来源' if zh else 'References') + '</h2><ul>'
                body += ''.join(f'<li><a href="{escape(s["url"], quote=True)}">{escape(s[lang])}</a></li>' for s in references) + '</ul>'
            links = [f'<li><a href="{base}{route}">{escape(title)}</a></li>'
                     for name, route, title in articles if tid in usages.get(name, set())]
            if links:
                body += '<h2>' + ('相关实验与笔记' if zh else 'Related experiments and notes') + '</h2><ul>' + ''.join(links) + '</ul>'
            pages.append((f'glossary-{tid}', route, text['title'], text['summary'], body))
        index = f'<h1>{label}</h1><p>{intro}</p><ul class="glossary-list">' + ''.join(cards) + '</ul>'
        return [('glossary', 'glossary/', label, intro, index)] + pages


class TermParser(HTMLParser):
    SKIP = {'a', 'pre', 'code', 'script', 'style', 'template', 'svg', 'math', 'button',
            'textarea', 'select', 'nav', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}
    SKIP_CLASSES = {'meta', 'eyebrow', 'case-card', 'case-entry', 'source-note'}
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, terms, language, base, page):
        super().__init__(convert_charrefs=False)
        self.output, self.stack, self.used = [], [], set()
        self.anchor = None
        self.language = 'zh' if language == 'zh-CN' else 'en'
        self.base = base
        self.aliases = {}
        parts = []
        for term in terms:
            if term.get('pages') and page not in term['pages']:
                continue
            for alias in term['aliases']:
                self.aliases[alias.casefold()] = term
                value = re.escape(alias)
                if not term.get('case_sensitive'):
                    value = f'(?i:{value})'
                parts.append((len(alias), value))
        self.pattern = re.compile(r'(?<![A-Za-z0-9_])(?:' + '|'.join(p for _, p in sorted(parts, reverse=True)) + r')(?![A-Za-z0-9_@])')

    def handle_starttag(self, tag, attrs):
        self.output.append(self.get_starttag_text())
        attrs = dict(attrs)
        protected = ('data-no-glossary' in attrs or
                     bool(self.SKIP_CLASSES.intersection(attrs.get('class', '').split())))
        if self.anchor is not None and (tag in self.SKIP or protected):
            self.anchor['blocked'] = True
        if (tag == 'a' and attrs.get('href') and not protected and
                not (self.stack and self.stack[-1][1]) and 'data-term-title' not in attrs):
            self.anchor = {'index': len(self.output) - 1, 'text': [], 'blocked': False}
        blocked = (tag in self.SKIP or 'data-no-glossary' in attrs or
                   bool(self.SKIP_CLASSES.intersection(attrs.get('class', '').split())))
        if tag not in self.VOID:
            self.stack.append((tag, blocked or (bool(self.stack) and self.stack[-1][1])))

    def handle_startendtag(self, tag, attrs):
        self.output.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor is not None:
            anchor = self.anchor
            label = re.sub(r'\s+', ' ', ''.join(anchor['text'])).strip()
            match = self.pattern.fullmatch(label)
            if not anchor['blocked'] and match:
                term = self.aliases[label.casefold()]
                self.used.add(term['id'])
                index = anchor['index']
                # Extend the original start tag without changing href, classes or content.
                self.output[index] = self.output[index][:-1] + self.term_attributes(term) + '>'
            self.anchor = None
        self.output.append(f'</{tag}>')
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor['text'].append(data)
        if self.stack and self.stack[-1][1]:
            self.output.append(data)
            return
        def replace(match):
            term = self.aliases[match[0].casefold()]
            self.used.add(term['id'])
            return (f'<a class="term-link" href="{self.base}glossary/{term["id"]}/"'
                    f'{self.term_attributes(term)}>{escape(match[0])}</a>')
        self.output.append(self.pattern.sub(replace, data))

    def term_attributes(self, term):
        text = term[self.language]
        return (f' data-term-href="{self.base}glossary/{term["id"]}/"'
                f' data-term-title="{escape(text["title"], quote=True)}"'
                f' data-term-summary="{escape(text["summary"], quote=True)}"')

    def handle_entityref(self, name):
        if self.anchor is not None:
            self.anchor['text'].append(unescape(f'&{name};'))
        self.output.append(f'&{name};')

    def handle_charref(self, name):
        if self.anchor is not None:
            self.anchor['text'].append(unescape(f'&#{name};'))
        self.output.append(f'&#{name};')

    def handle_comment(self, data):
        self.output.append(f'<!--{data}-->')

    def handle_decl(self, decl):
        self.output.append(f'<!{decl}>')
