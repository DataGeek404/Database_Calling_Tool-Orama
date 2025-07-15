// src/lib/tool-executor-singleton.ts
import { ToolExecutor } from './ai-tools';

let instance: ToolExecutor | null = null;

export const getToolExecutor = async (): Promise<ToolExecutor> => {
    if (!instance) {
        instance = new ToolExecutor();
        await instance.initialize();
    }
    return instance;
};