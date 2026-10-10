import re

file_path = 'src/data/defaultNotificationTemplates.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Remove autoSendWhatsapp: true/false,
content = re.sub(r'\s*autoSendWhatsapp:\s*(true|false),', '', content)
# Remove whatsappBody: `...`,
content = re.sub(r'\s*whatsappBody:\s*`.*?`,', '', content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
