import { Pipe, PipeTransform } from '@angular/core';
import { IAccessControlConditions } from '../interfaces/mediafile.interface';

@Pipe({
  name: 'isShared',
})
export class IsSharePipe implements PipeTransform {
  public transform(
    value: IAccessControlConditions[]|undefined,
    account: string
  ): boolean {
		if (!value) {
			return false;
		}
    return value.some((condition) => {
      return (
        condition?.parameters?.includes(':userAddress') &&
        condition?.returnValueTest?.value !== account &&
				condition?.returnValueTest?.comparator === '='
      );
    });
  }
}
