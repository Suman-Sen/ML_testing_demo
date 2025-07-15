from sqlalchemy import create_engine
from sqlalchemy.engine import reflection

def create_connection(conn_string):
    engine = create_engine(conn_string)
    inspector = reflection.Inspector.from_engine(engine)
    return engine, inspector
