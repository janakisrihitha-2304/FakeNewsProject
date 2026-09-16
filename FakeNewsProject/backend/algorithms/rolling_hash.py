class RollingHash:
    def __init__(self, text: str, window: int, base: int = 256, mod: int = 1_000_000_007):
        self.text = text
        self.window = window
        self.base = base
        self.mod = mod

    def hashes(self):
        text, w = self.text, self.window
        if w <= 0 or len(text) < w:
            return []
        h = pow(self.base, w - 1, self.mod)
        cur = 0
        for i in range(w):
            cur = (cur * self.base + ord(text[i])) % self.mod
        out = [cur]
        for i in range(len(text) - w):
            cur = ((cur - ord(text[i]) * h) * self.base + ord(text[i + w])) % self.mod
            out.append(cur)
        return out

    def verify(self, other_hashes: list) -> list:
        mine = set(self.hashes())
        return [h for h in other_hashes if h in mine]
