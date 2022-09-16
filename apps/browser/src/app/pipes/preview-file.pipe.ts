import { Pipe, PipeTransform } from '@angular/core';
import { IMediaFile } from '../interfaces/mediafile.interface';
import { IPFSService } from '../services/ipfs.service';
import { LitService } from '../services/lit.service';
import { MediaFileService } from '../services/mediafile.service';

@Pipe({
  name: 'previewFile'
})
export class PreviewFilePipe implements PipeTransform {

  constructor(
    private readonly _fileService: IPFSService,
    private readonly _litService: LitService,
  ) {}

  async transform(value?: IMediaFile|undefined): Promise<string> {
    if (!value || !value.cid) {
      return '';
    }
    // get file from ipfs
    const fileFromCID = await this._fileService.getFromCID(value.cid);
    const result: { file: File } = { file: fileFromCID };
    // decrypt file if needed
    if (value.encryptedSymmetricKey && value.accessControlConditions) {
      const { decryptedArrayBuffer } = await this._litService.decrypt(
        fileFromCID,
        value.encryptedSymmetricKey,
        value.accessControlConditions,
      );
      // convert array buffer to file and overwrite result object
      result.file = new File([decryptedArrayBuffer], value.name || value.cid, { type: value.type });
    }
    const url = URL.createObjectURL(result.file);
    return url;    
  }

}
