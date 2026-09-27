import re

with open('src/data/initialErpData.ts', 'r') as f:
    content = f.read()

content = content.replace('export const initialLocations = [];', '''export const initialLocations = [
  {
    id: 'loc_main',
    name: 'Main HQ',
    code: 'HQ01',
    address: '123 Business Rd, City, State',
    phone: '555-0100',
    isDefault: true
  },
  {
    id: 'loc_store1',
    name: 'Downtown Store',
    code: 'DT01',
    address: '456 Retail Ave, City, State',
    phone: '555-0101',
    isDefault: false
  }
];''')

with open('src/data/initialErpData.ts', 'w') as f:
    f.write(content)


with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

# Add locations to localStorage save
content = content.replace("localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));", "localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));\n    localStorage.setItem(`${STORAGE_KEY}_locations`, JSON.stringify(locations));")
content = content.replace("currencies, users, salesCommissionAgents", "currencies, users, locations, salesCommissionAgents")

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
