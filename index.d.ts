import { Message, Client } from 'discord.js'

type HexColorString = `#${string}` | string

export type connectOptions = {
  notify?: boolean
}

export declare function connect(
  db: string,
  options?: connectOptions
): Promise<any>

export declare function addLevel(
  message: Message,
  userID: string,
  guildID: string,
  level: number
): Promise<any>

export declare function addXP(
  message: Message,
  userID: string,
  guildID: string,
  xp: number
): Promise<any>

export type chartsOptions = {
  position?: string
  background?: HexColorString
  type?: 'bar' | 'line' | 'radar' | 'doughnut' | 'polarArea'
}

export declare function charts(
  message: Message,
  options?: chartsOptions
): Promise<any>

export declare function create(userID: string, guildID: string): Promise<any>

export declare function fetch(userID: string, guildID: string): Promise<any>

export declare function leaderboard(
  userID: string,
  guildID: string,
  limit: number
): Promise<any>

export declare function lvlRole(
  message: Message,
  userID: string,
  guildID: string
): Promise<any>

export type rankOptions = {
  slash?: boolean
  background?: string
  color?: HexColorString
}
export declare function rank(
  message: Message,
  userID: string,
  guildID: string,
  options?: rankOptions
): Promise<any>

export declare function reset(userID: string, guildID: string): Promise<any>

export type lvladdOptions = {
  level: string
  role: string
}
export type lvlremoveOptions = {
  level: string
}

export declare function setLevel(
  message: Message,
  userID: string,
  guildID: string,
  level: number
): Promise<any>

export declare function setXP(
  userID: string,
  guildID: string,
  xp: number
): Promise<any>

/** For levelUp event */
export type Data = {
  xp: string
  level: number
  userID: string
  guildID: string
}

export type Role = {
  lvl: string
  role: string
}

declare module 'discord.js' {
  export interface ClientEvents {
    levelUp: [Message, Data, Role]
  }
}
