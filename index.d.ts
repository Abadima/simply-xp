import { Client, Message, MessageAttachment } from 'discord.js'
import mongoose from 'mongoose'

type HexColorString = `#${string}` | string
type levelRole = {
  _id: mongoose.Types.ObjectId
  gid: string
  lvlrole: { lvl: string; role: string }[]
}
type levelRoleDoc = mongoose.Document<any, any, levelRole>

type User = {
  _id: mongoose.Types.ObjectId
  user: string
  guild: string
  xp: number
  level: number
}
type UserDoc = mongoose.Document<any, any, User>

export type connectOptions = {
  notify?: boolean
}
export declare function connect(db: string, options?: connectOptions): void

/**
 * Creates a new user in the database if there isn't one yet and returns it
 */
export declare function create(
  userID: string,
  guildID: string
): Promise<UserDoc>

/**
 * Adds a given amount of XP to the user, when max/min amounts are provided a random value inbetween will be chosen
 */
export declare function addXP(
  message: Message,
  userID: string,
  guildID: string,
  xp: string | number | { min: string | number; max: string | number }
): Promise<levelRole>

/**
 * Sets the amount of XP the user has and returns the new user data with the newly calculated level
 */
export declare function setXP(
  userID: string,
  guildID: string,
  xp: string | number
): Promise<User>

/**
 * Returns a list of users sorted by their amount of xp
 */
export declare function leaderboard(
  client: Client,
  guildID: string,
  limit?: string | number
): Promise<
  {
    guildID: string
    userID: string
    xp: number
    level: number
    shortxp: string
    position: number
    username: string
    tag: string
  }[]
>

/**
 * Fetches the user data from the database and returns it
 */
export declare function fetch(
  userID: string,
  guildID: string
): Promise<{
  level: number
  xp: number
  reqxp: number
  rank: number
  shortxp: string
  shortreq: string
}>

export type chartsOptions = {
  position?: string
  background?: HexColorString
  type?: 'bar' | 'line' | 'radar' | 'doughnut' | 'polarArea'
}

export declare function charts(
  message: Message,
  options?: chartsOptions
): Promise<MessageAttachment>

export type rankOptions = {
  slash?: boolean
  background?: string
  color?: HexColorString
}
/**
 * Returns a MessageAttachment with the generated rankCard image
 */
export declare function rank(
  message: Message,
  userID: string,
  guildID: string,
  options?: rankOptions
): Promise<MessageAttachment>

/**
 * Checks and gives the role if the user has the required level
 */
export declare function lvlRole(
  message: Message,
  userID: string,
  guildID: string
): Promise<void>

export type lvlAddOptions = {
  level: string
  role: string
}
export type lvlRemoveOptions = {
  level: string
}

export declare class roleSetup {
  public static add(
    client: Discord.Client,
    guildID: string,
    options?: lvlAddOptions
  ): Promise<string>

  public static add(
    client: Discord.Client,
    guildID: string,
    options?: lvlAddOptions
  ): Promise<string>

  public static fetch(
    client: any,
    guildID: any,
    options?: {}
  ): Promise<
    {
      lvl: string
      role: string
    }[]
  >
}

/** For levelUp event */
export type levelUpData = {
  xp: string
  level: number
  userID: string
  guildID: string
}

declare module 'discord.js' {
  export interface ClientEvents {
    levelUp: [Message, levelUpData]
  }
}
