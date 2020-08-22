import { GameServer } from './GameServer'
import { NightRoleOrderType } from '../../../common'

export type RoleEventGenerator = Generator<number, void, void>

export type RoleEventGeneratorFunc = (role: NightRoleOrderType, gameServer: GameServer) => RoleEventGenerator
