import re

STOPWORDS = set("""
a about above after again against all am an and any are as at be because been before
being below between both but by can cannot could did do does doing down during each few
for from further had has have having he her here hers herself him himself his how i if
in into is it its itself just like me more most my myself no nor not now of off on once
only or other our ours ourselves out over own same she should so some such than that the
their theirs them themselves then there these they this those through to too under until
up very was we were what when where which while who whom why will with you your yours
yourself yourselves
""".split())

TOKEN_RE = re.compile(r"[a-z0-9']+")


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list:
    return [t for t in TOKEN_RE.findall(text.lower()) if t not in STOPWORDS and len(t) > 2]


def word_frequencies(tokens: list) -> dict:
    freq = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1
    return freq
