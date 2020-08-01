import { GameServer } from './GameServer'

export type RoleEventFunc = (gameServer: GameServer) => number
export type AsyncRoleEventFunc = (gameServer: GameServer) => Promise<number>

export type RoleEventFuncType = RoleEventFunc | AsyncRoleEventFunc

export type RoleEventGenerator = Generator<number, void, void>
export type AsyncRoleEventGenerator = AsyncGenerator<number, void, void>

export type RoleEventGeneratorType = RoleEventGenerator | AsyncRoleEventGenerator

export type RoleEventGeneratorFunc = (gameServer: GameServer) => RoleEventGenerator
export type AsyncRoleEventGeneratorFunc = (gameServer: GameServer) => AsyncRoleEventGenerator
