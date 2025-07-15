PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b\d{10}\b',
    'aadhaar': r'\b\d{4}\s\d{4}\s\d{4}\b',
    'pan': r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b',
    'passport': r'\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b',
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b'
}
