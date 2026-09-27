import re

with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

# Instead of Add Customer / Add Supplier, we will change it to 'Add Contact'
# But first, how is it in Sidebar.tsx?
#  {
#    id: 'add_customer',
#    label: 'Add Customer',
#  ...
#  {
#    id: 'add_supplier',
#    label: 'Add Supplier',
#  ...
