import { IMediaFile } from "./mediafile.interface";

export interface ISharedMediaFile {
  metadata: IMediaFile;
  senderAddress: string;
  status: string;
  createdISODateTime: string;
}