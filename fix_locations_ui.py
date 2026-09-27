import re

with open('src/components/settings/LocationsTab.tsx', 'r') as f:
    content = f.read()

content = content.replace('''                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                    : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                }`}''', '''                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                    : 'bg-slate-950/70 hover:bg-slate-800/40 border-slate-800 text-slate-300'
                }`}''')

content = content.replace('''                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition"''', '''                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"''')

content = content.replace('''className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 hover:border-rose-500 transition"''', '''className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-rose-100 rounded-lg border border-rose-500/20 hover:border-rose-500 transition"''')

content = content.replace('''className="text-slate-400 hover:text-white text-[11px]"''', '''className="text-slate-400 hover:text-slate-200 text-[11px]"''')

with open('src/components/settings/LocationsTab.tsx', 'w') as f:
    f.write(content)
