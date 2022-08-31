
export interface IMediaFile {
  _id: string;
  parent: string;
  name: string;
  lastModifiedIsoDateTime: string;
  createdIsoDateTime: string;
  type?: string;
  size?: number;
  cid?: string;
  isFolder?: boolean;
  encryptedSymmetricKey?: string;
}