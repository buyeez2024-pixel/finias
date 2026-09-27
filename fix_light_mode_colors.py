import re

with open('src/index.css', 'r') as f:
    content = f.read()

colors = [
    'emerald',
    'rose',
    'blue',
    'amber',
    'teal',
    'fuchsia',
    'sky',
    'cyan'
]

additions = []
for color in colors:
    additions.append(f"  --color-{color}-300: var(--color-{color}-600);")
    additions.append(f"  --color-{color}-400: var(--color-{color}-700);")
    additions.append(f"  --color-{color}-500: var(--color-{color}-800);")

replacement = "  --color-indigo-500: var(--color-indigo-800);\n" + "\n".join(additions)

content = content.replace("  --color-indigo-500: var(--color-indigo-800);", replacement)

with open('src/index.css', 'w') as f:
    f.write(content)
