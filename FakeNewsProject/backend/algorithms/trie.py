class TrieNode:
    __slots__ = ("children", "is_end", "count")

    def __init__(self):
        self.children = {}
        self.is_end = False
        self.count = 0


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            node.count += 1
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True

    def autocomplete(self, prefix: str, limit: int = 10) -> list:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]
        results = []

        def dfs(n, path):
            if len(results) >= limit:
                return
            if n.is_end:
                results.append(prefix + path)
            for ch in sorted(n.children):
                dfs(n.children[ch], path + ch)

        dfs(node, "")
        return results
