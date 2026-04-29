import sys

with open('app.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        stripped = line.lstrip(' ')
        indent = len(line) - len(stripped)
        if indent % 4 != 0 and stripped.strip():
            print(f"Line {i}: Indentation of {indent} spaces is not a multiple of 4.")
