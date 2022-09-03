import { Pipe, PipeTransform } from '@angular/core';
import makeBlockie from 'ethereum-blockies-base64';

@Pipe({
  name: 'addressToAvatar'
})
export class AddressToAvatarPipe implements PipeTransform {

  transform(value?: string): string {
    if (!value) {
      return '';
    }
    const imgUrl = makeBlockie(value);
    return imgUrl;
    
  }

}
