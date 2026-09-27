import re

with open('src/components/settings/LocationsTab.tsx', 'r') as f:
    content = f.read()

content = content.replace('''className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl"''', '''className="text-slate-400 hover:text-slate-200 transition p-2 hover:bg-slate-800 rounded-xl"''')

content = content.replace('''className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-bold"''', '''className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-sm font-bold"''')

with open('src/components/settings/LocationsTab.tsx', 'w') as f:
    f.write(content)
