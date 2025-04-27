
from datetime import datetime

def now(fmt="%Y-%m-%d %H:%M:%S"):
    return datetime.utcnow().strftime(fmt)



