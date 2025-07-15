import re
from sqlalchemy import text
from .regex_rules import PII_PATTERNS

def get_sample_query(table_name, engine):
    dialect = str(engine.url.get_backend_name())
    if 'oracle' in dialect:
        return text(f'SELECT * FROM "{table_name}" WHERE ROWNUM <= 1000')
    else:
        return text(f'SELECT * FROM "{table_name}" LIMIT 1000')

def scan_table(engine, table_name):
    results = []
    with engine.connect() as conn:
        query = get_sample_query(table_name, engine)
        result_proxy = conn.execute(query)
        rows = result_proxy.fetchall()
        columns = columns = list(result_proxy.keys())  # Now indexable


        for row in rows:
            for idx, value in enumerate(row):
                for pii, pattern in PII_PATTERNS.items():
                    if value and re.search(pattern, str(value)):
                        results.append({
                            'table': table_name,
                            'column': columns[idx],
                            'value': str(value),
                            'pii_type': pii
                        })
    return results
