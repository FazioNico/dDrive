import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'networkName'
})
export class NetwokNamePipe implements PipeTransform {
  
  transform(value?: string): string {
    if (!value) {
      return '';
    }
    const networks = environment.availableChainsId;
    // value = value.replace('0x', '');
    const network = (networks as any)[value];
    return network||'unknown';
    
  }

}
