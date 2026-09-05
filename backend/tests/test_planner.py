from app.tools.registry import ToolRegistry
from app.agent.planner import Planner

def test_hinglish_chrome():
    p = Planner(ToolRegistry()).plan("Nexa, Chrome kholo")
    assert p.tool == "open_application"
    assert p.args["application"] == "chrome"

def test_system():
    p = Planner(ToolRegistry()).plan("system status bata")
    assert p.tool == "system_status"

def test_pdf_search():
    p = Planner(ToolRegistry()).plan("Downloads mein PDFs dhund")
    assert p.tool == "search_files"
    assert p.args["pattern"] == "*.pdf"

def test_greeting():
    p = Planner(ToolRegistry()).plan("Namaste Nexa, kaise ho?")
    assert p.intent == "greeting"
    assert "NEXA AI" in p.reply

def test_terminal():
    p = Planner(ToolRegistry()).plan("Git status check kar")
    assert p.tool == "terminal"
    assert p.args["command"] == "git status"

def test_url():
    p = Planner(ToolRegistry()).plan("YouTube kholo")
    assert p.tool == "open_url"
    assert "youtube.com" in p.args["url"]

