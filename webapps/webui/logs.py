"""Log setting"""
from pathlib import Path
from atexit import register
import logging
import logging.config
from yaml import safe_load
from ..profiles import CONFIG_DIR, SELF

LOG_DIR = CONFIG_DIR / "logs"
LOG_CONFIG = CONFIG_DIR / "logs.yaml"
SELF_DIR = SELF / '..'

def setup_logging():
    """Setup logging"""
    config_file = Path(LOG_CONFIG)
    with open(config_file, encoding='utf-8') as f_in:
        config = safe_load(f_in)

    logging.config.dictConfig(config)
    queue_handler = logging.getHandlerByName("queue_handler")
    if queue_handler is not None:
        queue_handler.listener.start()
        register(queue_handler.listener.stop)

if not LOG_CONFIG.exists():
    with open(SELF_DIR / 'webapps' / 'webui' / 'example_logs.yaml', encoding='utf-8') as f:
        LOG_CONFIG.write_text(f.read())
