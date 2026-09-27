import re

with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

content = content.replace('''  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_locations`);
    return saved ? JSON.parse(saved) : initialLocations;
  });''', '''  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_locations`);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : initialLocations;
  });''')

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
