import { Channel, MessageJSON, UserJSON } from "discord-types/general";

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

export interface UserUpdatePayload {
    type: string;
    user: {
        id: string;
        username: string;
        avatar: string;
        discriminator: string;
        flags: number;
        banner: string;
        banner_color: string;
        accent_color: number;
        bio: string;
        publicFlags: number;
        avatarDecorationData: {
            asset: string;
            skuId: string;
        };
        globalName: string | null;
    };
}
export interface UserProfileFetchSuccessPayload {
    type: string;
    user: UserJSON;
    connected_accounts: {
        type: string;
        id: string;
        name: string;
        verified: boolean;
        metadata?: {
            gold: string;
            mod: string;
            total_karma: string;
            created_at: string;
            verified?: string;
            followers_count?: string;
            statuses_count?: string;
        };
    }[];
    premium_since: string;
    premium_type: 0 | 1 | 2 | 3; // 0= none, 1 = nitro classic, 2 = nitro, 3 = nitro basic
    premium_guild_since: string;
    profile_themes_experiment_bucket: number;
    user_profile: {
        bio: string;
        accent_color: number;
        pronouns: string;
        profile_effect: null;
        banner: string;
        theme_colors: number[];
        popout_animation_particle_type: null;
        emoji: null;
    };
    badges: {
        id: string;
        description: string;
        icon: string;
        link: string;
    }[];
    guild_badges: unknown[]; // idek what this is
    mutual_guilds: {
        id: string;
        nick: string | null;
    }[];
    legacy_username: string;

}
/*{
    "type": "THREAD_CREATE",
    "isNewlyCreated": true,
    "channel": {
        "appliedTags": [],
        "flags_": 0,
        "guild_id": "1220808473051402320",
        "id": "1221673615255408710",
        "lastMessageId": null,
        "memberCount": 1,
        "memberIdsPreview": [
            "1025551895344975912"
        ],
        "messageCount": 0,
        "name": "a",
        "nsfw_": false,
        "ownerId": "1025551895344975912",
        "parent_id": "1220808473051402323",
        "rateLimitPerUser_": 0,
        "threadMetadata": {
            "archived": false,
            "autoArchiveDuration": 4320,
            "archiveTimestamp": "2024-03-25T04:14:47.475000+00:00",
            "createTimestamp": "2024-03-25T04:14:47.475000+00:00",
            "locked": false,
            "invitable": true
        },
        "totalMessageSent": 0,
        "type": 11
    }
}*/
interface ThreadCreatePayload {
    type: string;
    isNewlyCreated: boolean;
    channel: Channel
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
