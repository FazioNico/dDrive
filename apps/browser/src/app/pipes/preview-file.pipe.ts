import { Pipe, PipeTransform } from '@angular/core';
import { IMediaFile } from '../interfaces/mediafile.interface';
import { MediaFileService } from '../services/mediafile.service';

@Pipe({
  name: 'previewFile'
})
export class PreviewFilePipe implements PipeTransform {

  constructor(
    private readonly _service: MediaFileService
  ) {}

  async transform(value?: IMediaFile|undefined): Promise<string> {
    if (!value) {
      return '';
    }
    const {file} = await this._service.downloadFile(value._id, false);
    const url = URL.createObjectURL(file);
    return url;    
  }

}
