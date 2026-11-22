/* eslint-disable @typescript-eslint/no-explicit-any -- results stay `any` as in 1.3.x, so existing TypeScript code keeps compiling */
import { Message } from "discord.js";

/** What simply-xp reads from a member. discord.js's `GuildMember` fits, and so does anything shaped like it. */
export interface MemberLike {
	user: { tag: string; username: string; displayAvatarURL(): string };
	roles: { add(role: unknown): Promise<unknown> };
}

/** What simply-xp reads from a guild. discord.js's `Guild` fits. */
export interface GuildLike {
	id: string;
	name: string;
	roles: { cache: { has(id: string): boolean; get(id: string): unknown } };
	members: {
		cache: { get(id: string): MemberLike | undefined };
		fetch(id: string): Promise<unknown>;
	};
}

/** What simply-xp reads from a client. discord.js's `Client` fits. */
export interface ClientLike {
	emit(...args: unknown[]): unknown;
	guilds: { cache: { get(id: string): GuildLike | undefined } };
}

/** What simply-xp reads from a message. discord.js's `Message` fits. */
export interface MessageLike {
	client: ClientLike;
	guild: GuildLike | null;
	channel?: unknown;
}

type HexColorString = `#${string}` | string;

export type connectOptions = {
	auto_purge?: boolean;
	notify?: boolean;
};

export declare const options: { auto_purge: boolean };

export declare function connect(db: string, options?: connectOptions): Promise<any>;

export declare function addLevel(
	message: MessageLike,
	userID: string,
	guildID: string,
	level: number | string
): Promise<any>;

export declare function addXP(
	message: MessageLike,
	userID: string,
	guildID: string,
	xp: number | string | { min: number; max: number }
): Promise<any>;

export type chartsOptions = {
	position?: string | number;
	background?: HexColorString;
	type?: "bar" | "line" | "radar" | "doughnut" | "polarArea" | "pie";
};

export declare function charts(message: MessageLike, options?: chartsOptions): Promise<any>;

export declare function create(userID: string, guildID: string): Promise<any>;

export declare function fetch(userID: string, guildID: string): Promise<any>;

export declare function leaderboard(client: ClientLike, guildID: string, limit?: number | string): Promise<any>;

export declare function lvlRole(message: MessageLike, userID: string, guildID: string): Promise<any>;

export type rankOptions = {
	slash?: boolean;
	background?: string;
	color?: HexColorString;
	lvlbar?: HexColorString;
	lvlbarBg?: HexColorString;
};
export declare function rank(message: MessageLike, userID: string, guildID: string, options?: rankOptions): Promise<any>;

export declare function reset(userID: string, guildID: string): Promise<any>;

export type lvladdOptions = {
	level: string | number;
	role: string;
};
export type lvlremoveOptions = {
	level: string | number;
};

export declare const roleSetup: {
	add(client: ClientLike, guildID: string, options: lvladdOptions): Promise<true>;
	remove(client: ClientLike, guildID: string, options: lvlremoveOptions): Promise<true>;
	fetch(client: ClientLike, guildID: string): Promise<{ lvl: string | number; role: string }[] | undefined>;
	find(
		client: ClientLike,
		guildID: string,
		level: string | number
	): Promise<{ lvl: string | number; role: string }[] | undefined>;
};

export declare function setLevel(
	message: MessageLike,
	userID: string,
	guildID: string,
	level: number | string
): Promise<any>;

export declare function setXP(userID: string, guildID: string, xp: number | string): Promise<any>;

/** For levelUp event */
export type Data = {
	xp: string;
	level: number;
	userID: string;
	guildID: string;
};

export type Role = {
	lvl: string;
	role: string;
};

declare module "discord.js" {
	export interface ClientEvents {
		levelUp: [Message, Data, Role];
	}
}
