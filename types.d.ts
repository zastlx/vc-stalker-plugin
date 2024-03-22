import { MessageJSON } from "discord-types/general";

export interface MessageUpdatePayload {
    type: string;
    guildId: string;
    message: MessageJSON;
}

export interface MessageCreatePayload {
    type: string;
    guildId: string;
    channelId: string;
    message: MessageJSON;
    optimistic: boolean;
    isPushNotification: boolean;
}

export interface MessageDeletePayload {
    type: string;
    guildId: string;
    id: string;
    channelId: string;
    mlDeleted?: boolean;
}

export interface TypingStartPayload {
    type: string;
    channelId: string;
    userId: string;
}
/*
{
    "type": "TYPING_START",
    "channelId": "1124712294132224100",
    "userId": "778008377803931670"
}
*/


export type subscribedEvents =
    | "MESSAGE_UPDATE"
    | "MESSAGE_DELETE"
    | "TYPING_START"
    | "USER_UPDATE"
    | "THREAD_CREATE"
    | "PRESENCE_UPDATES"
    | "GUILD_MEMBER_ADD"
    | "MESSAGE_CREATE"
    | "CALL_UPDATE"
    | "RELATIONSHIP_UPDATE"
    | "RELATIONSHIP_ADD"
    | "RELATIONSHIP_REMOVE";
