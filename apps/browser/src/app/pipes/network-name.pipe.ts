import { Pipe, PipeTransform } from '@angular/core';

const networks = {
  '1': 'mainnet',
  '3': 'ropsten',
  '4': 'rinkeby',
  '5': 'goerli',
  '42': 'kovan',
  '100': 'xdai',
  '137': 'polygon',
  '80001': 'mumbai',
  '13881': 'mumbai'
};
@Pipe({
  name: 'networkName'
})
export class NetwokNamePipe implements PipeTransform {

  transform(value?: string): string {
    if (!value) {
      return '';
    }
    value = value.replace('0x', '');
    const network = (networks as any)[value];
    return network||'unknown';
    
  }

}
