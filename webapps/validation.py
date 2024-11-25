"""Validation helper"""
from typing import NamedTuple

class ValidateEntry(NamedTuple):
    """Validation entry"""
    condition: bool
    of: str
    message: str

class Validation:
    """validation"""
    def __init__(self) -> None:
        self._data: list[ValidateEntry] = []

    def set(self, condition: bool, of: str, message: str):
        """Assert set"""
        if not condition:
            self._data.append(ValidateEntry(condition, of, message))

    def to_json(self):
        """Return things to JSON"""
        return [a._asdict() for a in self._data]
