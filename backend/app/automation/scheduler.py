from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Automation:
    id: str
    label: str
    command: str
    enabled: bool = True
    schedule: str = ""

class AutomationStore:
    def __init__(self):
        self.items: dict[str, Automation] = {}

    def add(self, item: Automation):
        self.items[item.id] = item
        return item

    def list(self):
        return list(self.items.values())

    def remove(self, item_id):
        return self.items.pop(item_id, None)
