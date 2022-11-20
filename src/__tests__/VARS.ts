export const TOPICS_BASE: string[] = [];
export const TOPICS_DLUX = TOPICS_BASE.concat(["status", "version", "inputs", "outputs", "events", "temps", "text/+", "log"]);
export const TOPICS_LED = TOPICS_DLUX.concat(["states"]);
export const TOPICS_LAMP = TOPICS_DLUX.concat(["lamps"]);
