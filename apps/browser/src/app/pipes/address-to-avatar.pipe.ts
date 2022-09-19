import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addressToAvatar'
})
export class AddressToAvatarPipe implements PipeTransform {

  async transform(value?: string, theme: 'jazzicons'|'blockies' = 'blockies'): Promise<string> {
    if (!value) {
      return '';
    }
    if (theme === 'jazzicons') {
      // return import('@metamask/jazzicon').then(jazzicon => jazzicon.default( 97, value ));
      throw 'Not implemented';
    } else {
      return import('ethereum-blockies-base64').then(blockies => blockies.default(value));
    }    
  }

}
