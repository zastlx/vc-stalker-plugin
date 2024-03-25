import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType, PluginDef } from "@utils/types";
import { Menu, Toasts, UserStore, MessageStore, RestAPI, ChannelStore } from "@webpack/common";
import { findByProps } from "@webpack";
import { getCurrentChannel, openUserProfile } from "@utils/discord";
import { Notifications } from "@api/index";
import { Message } from "discord-types/general";
import { MessageCreatePayload, MessageUpdatePayload, MessageDeletePayload, TypingStartPayload, UserUpdatePayload, ThreadCreatePayload } from "./types";
import { addToWhitelist, isInWhitelist, logger, removeFromWhitelist } from "./utils";
import { loggedMessages } from "userplugins/vc-message-logger-enhanced/LoggedMessageManager";
const settings = definePluginSettings({
    whitelistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "Whitelisted user IDs to stalk"
    },
});

const switchToMsg = (gid: string, cid?: string, mid?: string) => {
    findByProps("transitionToGuildSync").transitionToGuildSync(gid);
    if (cid) findByProps("selectChannel").selectChannel({
        guildId: gid,
        channelId: cid,
        messageId: mid
    });
};

let oldUsers: {
    [id: string]: UserUpdatePayload;
} = {};

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

            if (payload.message.type === 7) {
                Notifications.showNotification({
                    title: `${author.globalName || author.username} Joined a server`,
                    body: "Click to jump to the message.",
                    onClick: () => switchToMsg(payload.guildId, payload.channelId, payload.message.id),
                    icon: author.getAvatarURL(undefined, undefined, false)
                });
                return;
            }
            Notifications.showNotification({
                title: `${author.globalName || author.username} Sent a message`,
                body: "Click to jump to the message",
                onClick: () => switchToMsg(payload.guildId, payload.channelId, payload.message.id),
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
                onClick: () => switchToMsg(payload.guildId, payload.message.channel_id, payload.message.id),
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
                onClick: () => switchToMsg(ChannelStore.getChannel(payload.channelId).guild_id, payload.channelId, "")
            });

        },
        USER_PROFILE_FETCH_SUCCESS: async (payload: UserUpdatePayload) => {
            if (!payload || !payload.user || !payload.user.id || !isInWhitelist(payload.user.id)) return;

            const oldUser = oldUsers[payload.user.id];
            if (!oldUser) {
                oldUsers[payload.user.id] = payload;
                return;
            }

            // TODO: list the differences between the old and new user
            if (payload != oldUser) {
                Notifications.showNotification({
                    title: `${payload.user.globalName || payload.user.username} updated their profile!`,
                    body: "Click to view their profile.",
                    onClick: () => {
                        openUserProfile(payload.user.id);
                    },
                    icon: UserStore.getUser(payload.user.id).getAvatarURL(undefined, undefined, false)
                });
                oldUsers[payload.user.id] = payload;
            }

        },
        THREAD_CREATE: (payload: ThreadCreatePayload) => {
            if (!payload || !payload.channel || !payload.channel.id || !payload.channel.ownerId || !isInWhitelist(payload.channel.ownerId)) return;

            if (payload.isNewlyCreated) {
                Notifications.showNotification({
                    title: `New thread created by ${UserStore.getUser(payload.channel.ownerId).globalName || UserStore.getUser(payload.channel.ownerId).username}`,
                    body: `Click to view the thread.`,
                    onClick: () => switchToMsg(payload.channel.guild_id, payload.channel.parent_id, ""),
                    icon: UserStore.getUser(payload.channel.ownerId).getAvatarURL(undefined, undefined, false)
                });
            }
        },/*
        PRESENCE_UPDATES: payload => {
            // Handle PRESENCE_UPDATES event
            console.log("PRESENCE_UPDATES event received:", payload);
        },/*
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
        },*/
    },
    async start() {
        if (!Vencord.Plugins.plugins["MessageLoggerEnhanced"]) {
            Notifications.showNotification({
                title: "Stalker plugin requires MessageLoggerEnhanced to be enabled",
                body: "Click to download it.",
                onClick: () => open("https://github.com/Syncxv/vc-message-logger-enhanced/")
            });
        }
        for (const id of settings.store.whitelistedIds.split(",")) {
            // is .getUser not a async function?
            const { body } = await RestAPI.get({
                url: `/users/${id}/profile`,
                query: {
                    with_mutual_guilds: true,
                    with_mutual_friends_count: true,
                }
            });
            oldUsers[id] = body;
            console.log(body);
            logger.info(`Cached user ${id} with name ${oldUsers[id].user.globalName || oldUsers[id].user.username} for further usage.`);
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
