# pylint: disable=protected-access

"""Config API"""
from sqlite3 import OperationalError
from json import loads, dumps
from typing import Any
from sqlite_database import Database, text
from ..profiles import CONFIG_DIR

class ConfigAPI:
    """Config API"""

    def __init__(self) -> None:
        self._path = CONFIG_DIR / "config.db"
        self._db = Database(self._path)

        try:
            self._config = self._db.table("config")
            self._config.exists()
        except OperationalError:
            self._config = self._db.create_table("config", [
                text("name").unique(),
                text('value')
            ])

    def exists(self, condition) -> bool:
        """Check if data exists"""
        data = self._config.select_one(condition)
        if len(data) == 0:
            return False
        return True

    def get(self, name: str):
        """Return data from value"""
        print("Get ->", name, flush=True)
        data = self._config.select_one({'name': name})
        if len(data) == 0:
            raise KeyError(name)
        return loads(data.value)

    def set(self, name: str, value: Any):
        """Set data to config store"""
        parsed = dumps(value)
        print("Set ->", name, flush=True)
        if self.exists({'name': name}):
            self._config.update_one({'name': name}, {'value': parsed})
            self._config._sql.commit()
            return
        self._config.insert({'name': name, 'value': parsed})
        self._config._sql.commit()

    def set_if_not_exists(self, name: str, value: Any):
        """Set data to config store IF not exists"""
        print("Set IF NOT EXISTS ->", name, flush=True)
        print(self.exists({'name': name}))
        if not self.exists({'name': name}):
            self._config.insert({'name': name, 'value': dumps(value)})
        self._config._sql.commit()

    def delete(self, name: str):
        """Delete a data from config store"""
        print("Delete ->", name, flush=True)
        try:
            return self._config.delete_one({'name': name})
        except OperationalError:
            return 0
