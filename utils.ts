// stolen from https://github.com/Syncxv/vc-message-logger-enhanced/blob/master/utils/index.ts
import { Logger } from "@utils/Logger";
import { settings } from "./index";


export function addToWhitelist(id: string) {
    const items = settings.store.whitelistedIds ? settings.store.whitelistedIds.split(",") : [];
    items.push(id);

    settings.store.whitelistedIds = items.join(",");
}

export function removeFromWhitelist(id: string) {
    const items = settings.store.whitelistedIds ? settings.store.whitelistedIds.split(",") : [];
    const index = items.indexOf(id);
    if (index !== -1) items.splice(index, 1);

    settings.store.whitelistedIds = items.join(",");
}

export function isInWhitelist(id: string) {
    const items = settings.store.whitelistedIds ? settings.store.whitelistedIds.split(",") : [];

    return items.indexOf(id) !== -1;
}

const logger = new Logger("Stalker");

export { logger };