import type { Tactic, TacticResult, Strategy, Objective } from '../types/index.js';
/**
 * A tactical objective - coordinates a strategy to fulfill an objective through tactical execution.
 *
 * Takes config and strategic command name to attempt strategic fulfillment.
 */
export declare class ObjectiveTactic<T, C, TConfig, TStrategy extends Strategy> implements Tactic<T, C> {
    private objective;
    private config;
    private strategicCommandName;
    readonly name: string;
    private readonly strategy;
    constructor(objective: Objective<TConfig, TStrategy>, config: TConfig, strategicCommandName: Exclude<keyof TStrategy, 'name'> & string, name?: string);
    /**
     * Assess if this tactical objective is applicable.
     */
    assess(_context: C): boolean;
    /**
     * Attempt this tactical objective by attempting strategic fulfillment.
     */
    attempt(context: C): Promise<TacticResult<T, C>>;
}
//# sourceMappingURL=ObjectiveTactic.d.ts.map