export interface Strategy {
    readonly name: string;
    readonly description?: string;
}
export type StrategyOf<Goals> = {
    name: string;
} & Goals;
//# sourceMappingURL=strategy.d.ts.map