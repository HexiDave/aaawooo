export enum CommonMessage {
	RefreshCode
}

export const getCommonMessageName = (commonMessage: CommonMessage) => CommonMessage[commonMessage]
