import math
from .preprocessing import tokenize, word_frequencies


def tfidf_cosine(text_a: str, text_b: str) -> float:
    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    vocab = sorted(set(tokens_a) | set(tokens_b))
    tf_a = word_frequencies(tokens_a)
    tf_b = word_frequencies(tokens_b)
    corpus = [tokens_a, tokens_b]
    n_docs = 2
    idf = {}
    for w in vocab:
        df = sum(1 for doc in corpus if w in doc)
        idf[w] = math.log((1 + n_docs) / (1 + df)) + 1.0
    vec_a = [tf_a.get(w, 0) * idf[w] for w in vocab]
    vec_b = [tf_b.get(w, 0) * idf[w] for w in vocab]
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(x * x for x in vec_a))
    norm_b = math.sqrt(sum(x * x for x in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def shared_keywords(text_a: str, text_b: str, limit: int = 8) -> list:
    freq_a = word_frequencies(tokenize(text_a))
    freq_b = word_frequencies(tokenize(text_b))
    common = set(freq_a) & set(freq_b)
    ranked = sorted(common, key=lambda w: freq_a[w] + freq_b[w], reverse=True)
    return ranked[:limit]
