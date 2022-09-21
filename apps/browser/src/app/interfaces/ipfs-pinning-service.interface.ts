
export interface IPFSPinningService {
  pin(cid: string, name?: string): Promise<void>;
  unpin(cid: string): Promise<void>;
}