import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sliceAddress'
})
export class SliceAddressPipe implements PipeTransform {

  transform(value?: string): string {
    if (!value) {
      return '';
    }
    if (value.length < 10) {
      return value;
    }
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
    
  }

}
