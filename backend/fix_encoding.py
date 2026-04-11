"""Fix emoji characters in Python files for Windows cp1252 compatibility."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

replacements = {
    '\U0001f4e6': '[SEED]',
    '\u2705': '[OK]',
    '\U0001f389': '[DONE]',
    '\U0001f4c1': '[DB]',
    '\U0001f4dd': '[INFO]',
    '\u26a0\ufe0f': '[WARN]',
    '\U0001f31f': '[*]',
    '\U0001f680': '[>>]',
    '\U0001f31e': '[*]',
    '\U0001f331': '[SEED]',
}

files_to_fix = ['main.py', 'embedding.py']

for fname in files_to_fix:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changed = False
    for emoji, replacement in replacements.items():
        if emoji in content:
            content = content.replace(emoji, replacement)
            changed = True
    
    if changed:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {fname}")
    else:
        print(f"No changes: {fname}")

print("Done!")
