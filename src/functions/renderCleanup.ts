import { clean } from "../../xp";
import { XpLog } from "./xplogs";

export function renderCleanup(caller: string, target: string): void {
    try { clean(); } catch (error) {
        XpLog.warn(caller, `Cleanup failed after ${target}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
