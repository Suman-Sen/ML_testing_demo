from .regex_rules import PII_PATTERNS

def classify_metadata(inspector):
    metadata = []
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        for col in columns:
            col_info = {
                'table': table_name,
                'column': col['name'],
                'type': str(col['type']),
                'pii_type': classify_column(col['name'])
            }
            metadata.append(col_info)
    return metadata

def classify_column(col_name):
    for pii, pattern in PII_PATTERNS.items():
        if pii in col_name.lower():
            return pii
    return None
