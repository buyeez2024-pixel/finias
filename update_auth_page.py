with open('src/components/auth/AuthPage.tsx', 'r') as f:
    content = f.read()

# Add settings to useErp destructuring
content = content.replace(
    'const { login, register, locations, users, selectedLocationId } = useErp();',
    'const { login, register, locations, users, selectedLocationId, settings } = useErp();'
)

# Add honeypot state
content = content.replace(
    'const [regAcceptTerms, setRegAcceptTerms] = useState(true);',
    'const [regAcceptTerms, setRegAcceptTerms] = useState(true);\n  const [honeypotTrap, setHoneypotTrap] = useState(\'\');'
)

# Security checks in handleRegisterSubmit
security_check_code = """    if (honeypotTrap.trim().length > 0) {
      setErrorMessage('Automated registration blocked by Security Guard (Honeypot Trap triggered).');
      return;
    }

    const emailDomain = regEmail.trim().toLowerCase().split('@')[1];
    const defaultDisposableDomains = [
      'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
      'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'dispostable.com',
      'getairmail.com', 'throwawaymail.com', 'sharklasers.com', 'maildrop.cc', 'fakeinbox.com'
    ];
    const blockedDomainsList = settings.blockedDomains || defaultDisposableDomains;
    if (settings.enableSecurityGuard !== false && settings.blockDisposableEmails !== false) {
      if (emailDomain && blockedDomainsList.some((d: string) => emailDomain.includes(d))) {
        setErrorMessage(
          `Registration blocked: Temporary or disposable email addresses (@${emailDomain}) are not allowed. Please use a permanent email address.`
        );
        return;
      }
    }
"""

content = content.replace(
    '    if (!regAcceptTerms) {\n      setErrorMessage(\'Please accept the Terms of Service to proceed.\');\n      return;\n    }',
    '    if (!regAcceptTerms) {\n      setErrorMessage(\'Please accept the Terms of Service to proceed.\');\n      return;\n    }\n\n' + security_check_code
)

# Insert honeypot field into register form
honeypot_field_jsx = """                    {/* Invisible Honeypot Trap Field */}
                    <input
                      type="text"
                      name="website_url_hp"
                      value={honeypotTrap}
                      onChange={(e) => setHoneypotTrap(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      className="hidden pointer-events-none opacity-0 h-0 w-0 absolute left-[-9999px]"
                    />"""

content = content.replace(
    '<form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">',
    '<form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">\n' + honeypot_field_jsx
)

with open('src/components/auth/AuthPage.tsx', 'w') as f:
    f.write(content)
print("AuthPage updated successfully.")
