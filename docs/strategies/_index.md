# Strategy Objectives Architecture

This section documents the architecture of each strategy objective and how it composes strategies and tactics. It focuses on design, not code. Each objective maps configuration to a concrete strategy and, depending on complexity, may orchestrate one or more Tactical Plans composed of tactics, and optionally delegate to sub‑objectives.

Guiding principles:

- Objectives translate Config → Strategy explicitly.
- Strategies remain thin; orchestration lives in Tactical Plans.
- Tactics encapsulate applicability and execution; plans stop on first success.
- The type system defines interfaces in `src/types/strategies/*`; implementations adhere to them.

Strategy layout patterns:

- Simple Objective → Direct Strategy: a single concrete strategy with minimal orchestration.
- Composite Strategy: multiple Tactical Plans and/or sub‑objectives coordinated by one strategy.
- Heuristic Plan: an objective that selects a strategy which is primarily a plan of tactics (ordered heuristics).
- Environment‑selected Objective: objective selects a strategy from environment/config (e.g., package manager, output surface).

Read the individual documents for each objective kind and their architecture.

