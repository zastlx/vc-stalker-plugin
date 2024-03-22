import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType, PluginDef } from "@utils/types";
import { Menu, Toasts, UserStore, MessageStore } from "@webpack/common";
import { findByProps } from "@webpack";
import { getCurrentChannel } from "@utils/discord";
import { Notifications } from "@api/index";
import { Message } from "discord-types/general";
import { MessageCreatePayload, MessageUpdatePayload, MessageDeletePayload, TypingStartPayload } from "./types";
import { addToWhitelist, isInWhitelist, logger, removeFromWhitelist } from "./utils";
import { loggedMessages } from "userplugins/vc-message-logger-enhanced/LoggedMessageManager";
const settings = definePluginSettings({
    whitelistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "Whitelisted user IDs to stalk"
    },
});

const switchToMsg = (cid: string, gid: string, mid: string) => {
    findByProps("transitionToGuildSync").transitionToGuildSync("1015037282551615518");
    findByProps("selectChannel").selectChannel({
        guildId: gid,
        channelId: cid,
        messageId: mid
    });
};

const _plugin: PluginDef & Record<string, any> = {
    name: "Stalker",
    description: "This plugin allows you to stalk users, made for delusional people like myself.",
    authors: [
        {
            id: 253302259696271360n,
            name: "zastix",
        },
    ],
    dependencies: ["MessageLoggerEnhanced"],
    settings,
    flux: {
        MESSAGE_CREATE: (payload: MessageCreatePayload) => {
            if (!payload.message || !payload.message.author || !payload.message.channel_id) return;

            const authorId = payload.message.author.id;
            if (!isInWhitelist(authorId) || getCurrentChannel().id === payload.channelId) return;
            const author = UserStore.getUser(authorId);

            Notifications.showNotification({
                title: `${author.globalName || author.username} Sent a message`,
                body: "Click to jump to the message",
                onClick: () => switchToMsg(payload.channelId, payload.guildId, payload.message.id),
                icon: author.getAvatarURL(undefined, undefined, false)
            });
        },
        MESSAGE_UPDATE: (payload: MessageUpdatePayload) => {
            if (!payload.message || !payload.message.author || !payload.message.channel_id) return;

            const authorId = payload.message.author.id;
            if (!isInWhitelist(authorId) || getCurrentChannel().id === payload.message.channel_id) return;
            const author = UserStore.getUser(authorId);

            Notifications.showNotification({
                title: `${author.globalName || author.username} Edited a message`,
                body: "Click to jump to the message",
                onClick: () => switchToMsg(payload.message.channel_id, payload.guildId, payload.message.id),
                icon: author.getAvatarURL(undefined, undefined, false)
            });
        },
        MESSAGE_DELETE: (payload: MessageDeletePayload) => {
            if (!payload || !payload?.channelId || !payload?.id || !payload?.guildId) return;

            const message: Message | null = MessageStore.getMessage(payload.channelId, payload.id) ?? loggedMessages[payload.id];
            if (!message) return logger.error("Received a MESSAGE_DELETE event but the message was not found in the MessageStore, try enabling \"Cache Messages From Servers\" setting in MessageLoggerEnhanced.");

            const { author } = message;
            if (!isInWhitelist(author.id) || getCurrentChannel().id === message.channel_id) return;

            Notifications.showNotification({
                title: `${author.globalName || author.username} Deleted a message!`,
                body: `"${message.content.length > 100 ? message.content.substring(0, 100).concat("...") : message.content}"`,
                onClick: () => {
                    findByProps("selectChannel").selectChannel({
                        guildId: payload.guildId,
                        channelId: message.channel_id,
                        messageId: message.id,
                    });
                },
                icon: author.getAvatarURL(undefined, undefined, false)
            });
        },
        TYPING_START: (payload: TypingStartPayload) => {
            if (!payload || !payload.channelId || !payload.userId) return;

            const author = UserStore.getUser(payload.userId);
            if (!isInWhitelist(author.id) || getCurrentChannel().id === payload.channelId) return;
            
            Notifications.showNotification({
                title: `${author.globalName || author.username} Started typing...`,
                body: "Click to jump to the channel.",
                icon: author.getAvatarURL(undefined, undefined, false),
                onClick: () => switchToMsg(payload.channelId, getCurrentChannel().guild_id, "")
            });

        },/*
        USER_UPDATE: payload => {
            // Handle USER_UPDATE event
            console.log("USER_UPDATE event received:", payload);
        },
        THREAD_CREATE: payload => {
            // Handle THREAD_CREATE event
            console.log("THREAD_CREATE event received:", payload);
        },
        PRESENCE_UPDATES: payload => {
            // Handle PRESENCE_UPDATES event
            console.log("PRESENCE_UPDATES event received:", payload);
        },
        GUILD_MEMBER_ADD: payload => {
            // Handle GUILD_MEMBER_ADD event
            console.log("GUILD_MEMBER_ADD event received:", payload);
        },
        CALL_UPDATE: payload => {
            // Handle CALL_UPDATE event
            console.log("CALL_UPDATE event received:", payload);
        },
        RELATIONSHIP_UPDATE: payload => {
            // Handle RELATIONSHIP_UPDATE event
            console.log("RELATIONSHIP_UPDATE event received:", payload);
        },
        RELATIONSHIP_ADD: payload => {
            // Handle RELATIONSHIP_ADD event
            console.log("RELATIONSHIP_ADD event received:", payload);
        },
        RELATIONSHIP_REMOVE: payload => {
            // Handle RELATIONSHIP_REMOVE event
            console.log("RELATIONSHIP_REMOVE event received:", payload);
        },*/
    },
    start() {
        if (!Vencord.Plugins.plugins["MessageLoggerEnhanced"]) {
            Notifications.showNotification({
                title: "Stalker plugin requires MessageLoggerEnhanced to be enabled",
                body: "Click to download it.",
                onClick: () => open("https://github.com/Syncxv/vc-message-logger-enhanced/")
            });
        }
        addContextMenuPatch("user-context", contextMenuPatch);
    },
    stop() {
        removeContextMenuPatch("user-context", contextMenuPatch);
    },
    stalkUser(id: string) {
        Toasts.show({
            type: Toasts.Type.SUCCESS,
            message: `Stalking ${UserStore.getUser(id).globalName}`,
            id: Toasts.genId()
        });
        addToWhitelist(id);
    },
    unStalkuser(id: string) {
        Toasts.show({
            type: Toasts.Type.SUCCESS,
            message: `Stopped stalking ${UserStore.getUser(id).globalName}`,
            id: Toasts.genId()
        });
        removeFromWhitelist(id);
    }
};

const contextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    if (!props || props?.user?.id === UserStore.getCurrentUser().id) return;

    if (!children.some(child => child?.props?.id === "stalker-v1")) {
        children.push(
            <Menu.MenuSeparator />,

            <Menu.MenuItem
                id="stalker-v1"
                label={isInWhitelist(props.user.id) ? "Stop Stalking User" : "Stalk User"}
                action={() => isInWhitelist(props.user.id) ? _plugin.unStalkuser(props.user.id) : _plugin.stalkUser(props.user.id)} />
        );
    }
};

export default definePlugin(_plugin);
export { settings };
