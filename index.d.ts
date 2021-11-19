import { Message } from 'discord.js'

type HexColorString = `#${string}` | string

export type connectOptions = {
  notify?: boolean
}
export declare function connect(
  db: string,
  options?: connectOptions
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

export type lvladdOptions = {
  level: string
  role: string
}
export type lvlremoveOptions = {
  level: string
}
