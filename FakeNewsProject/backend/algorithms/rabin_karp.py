def rabin_karp_search(text: str, pattern: str, base: int = 256, mod: int = 1_000_000_007) -> list:
    n, m = len(text), len(pattern)
    if m == 0 or n < m:
        return []
    h = pow(base, m - 1, mod)
    p_hash = 0
    t_hash = 0
    for i in range(m):
        p_hash = (p_hash * base + ord(pattern[i])) % mod
        t_hash = (t_hash * base + ord(text[i])) % mod
    positions = []
    for i in range(n - m + 1):
        if p_hash == t_hash and text[i:i + m] == pattern:
            positions.append(i)
        if i < n - m:
            t_hash = ((t_hash - ord(text[i]) * h) * base + ord(text[i + m])) % mod
    return positions
