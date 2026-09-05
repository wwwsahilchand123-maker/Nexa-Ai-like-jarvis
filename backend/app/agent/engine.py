import time
from app.agent.planner import Planner
from app.security.permissions import decide
from app.memory.store import MemoryStore

class AgentEngine:
    def __init__(self, registry, memory):
        self.registry = registry
        self.memory = memory
        self.planner = Planner(registry)

    async def run(self, text, confirmed=False, emit=lambda *a, **k: None):
        started = time.perf_counter()
        await emit("state", {"state": "planning"})
        plan = self.planner.plan(text)
        await emit("plan", {"intent": plan.intent, "tool": plan.tool, "args": plan.args})

        if plan.tool is None:
            is_success = plan.intent != "unknown"
            result = {"success": is_success, "message": plan.reply}
            duration = round((time.perf_counter() - started) * 1000)
            self.memory.add_history(text, plan.intent, plan.reply, duration)
            await emit("state", {"state": "speaking"})
            await emit("assistant", {"text": plan.reply})
            await emit("state", {"state": "completed" if is_success else "failed"})
            return result

        tool = self.registry.get(plan.tool)
        if not tool:
            msg = "Tool available nahi hai."
            await emit("error", {"message": msg})
            return {"success": False, "message": msg}

        decision = decide(tool.permission, confirmed)
        if not decision.allowed:
            await emit("state", {"state": "waiting_confirmation"})
            msg = f"{plan.reply} {decision.reason}"
            await emit("assistant", {"text": msg, "requires_confirmation": True, "tool": tool.name, "args": plan.args})
            return {"success": False, "message": msg, "requires_confirmation": True}

        await emit("state", {"state": "executing"})
        await emit("tool_start", {"tool": tool.name, "args": plan.args})
        result = tool.execute(**plan.args, confirmed=confirmed)
        await emit("tool_result", {"tool": tool.name, "success": result.success, "message": result.message, "data": result.data})

        duration = round((time.perf_counter() - started) * 1000)
        self.memory.add_history(text, plan.intent, result.message, duration)

        await emit("state", {"state": "speaking"})
        await emit("assistant", {"text": result.message, "data": result.data})
        await emit("state", {"state": "completed" if result.success else "failed"})
        return {"success": result.success, "message": result.message, "data": result.data}
