import { Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IAccessControlConditions,
  IMediaFile,
} from '../../interfaces/mediafile.interface';
import { NetwokNamePipe } from '../../pipes/network-name.pipe';

@Component({
  selector: 'd-drive-setup-encryption',
  templateUrl: './setup-encryption.component.html',
  styleUrls: ['./setup-encryption.component.scss'],
})
export class SetupEncryptionComponent {
  @Input() walletAddress!: string;
  @Input() chainId!: string;
  @Input() item!: IMediaFile;
  form!: FormGroup;
  isDisplayConditionForm = false;
  accordionsOpen: string[] = [];
  constructor(public readonly modalCtrl: ModalController) {}

  ionViewWillEnter() {
    this._buildForm();
    if (this.item?.accessControlConditions?.length) {
      this.isDisplayConditionForm = true;
      this._patchValues(this.item.accessControlConditions);
    }
  }

  private _buildForm() {
    this.form = new FormGroup({
      walletAddress: new FormGroup({
        selected: new FormControl(false),
        values: new FormArray([new FormControl(this.walletAddress)]),
      }),
      nftOwner: new FormGroup({
        selected: new FormControl(false),
        values: new FormArray([new FormControl()]),
      }),
      daoMember: new FormGroup({
        selected: new FormControl(false),
        values: new FormArray([new FormControl()]),
      }),
    });
  }

  private _patchValues(accessControlConditions: IAccessControlConditions[]) {
    const accordionsOpen: string[] = [];
    const walletsAddress: string[] = [];
    let nftContractAddress: string | undefined;
    let daoContractAddress: string | undefined;
    accessControlConditions.forEach((condition) => {
      if (this._isWalletAddressEcryptionCondition(condition)) {
        accordionsOpen.push('walletAddress');
        walletsAddress.push(condition.returnValueTest.value);
      }
    });
    this.form
      .get('walletAddress')
      ?.get('selected')
      ?.patchValue(walletsAddress.length > 0);
    this.form.get('walletAddress')?.get('values')?.patchValue(walletsAddress);
    // this.form.get('nftOwner')?.get('values')?.patchValue([nftContractAddress]);
    // this.form.get('daoMember')?.get('values')?.patchValue([daoContractAddress]);
    this.accordionsOpen = accordionsOpen;
  }

  public addValue(controlname: string, value: string) {
    const control = this.form.get(controlname) as FormArray;
    control.push(new FormControl(value));
  }

  public removeValue(controlname: string, index: number) {
    const control = this.form.get(controlname) as FormArray;
    control.removeAt(index);
  }

  public toggleCondition(controlname: string) {
    const control = this.form.get(controlname) as FormGroup;
    control.get('selected')?.setValue(!control.get('selected')?.value);
  }

  public async submit() {
    const result = {
      walletsAddress: [],
      nftContractAddress: undefined,
      daoContractAddress: undefined,
    };
    if (this.form.get('walletAddress')?.get('selected')?.value === true) {
      result.walletsAddress = this.form
        .get('walletAddress')
        ?.get('values')?.value;
    }
    if (this.form.get('nftOwner')?.get('selected')?.value === true) {
      result.nftContractAddress = this.form
        .get('nftOwner')
        ?.get('values')
        ?.value?.pop();
    }
    if (this.form.get('daoMember')?.get('selected')?.value === true) {
      result.daoContractAddress = this.form
        .get('daoMember')
        ?.get('values')
        ?.value?.pop();
    }
    const conditions = this._normalizeData(result);
    await this.modalCtrl.dismiss(conditions, 'ok');
  }

  private _normalizeData(data: {
    walletsAddress: string[];
    nftContractAddress?: string;
    daoContractAddress?: string;
  }) {
    const accessControlConditions = [];
    if (data.walletsAddress.length) {
      accessControlConditions.push(
        ...data.walletsAddress.map((value) => {
          return {
            contractAddress: '',
            standardContractType: '',
            method: '',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '=',
              value,
            },
          };
        })
      );
    }
    if (data.nftContractAddress) {
      accessControlConditions.push({
        contractAddress: data.nftContractAddress,
        standardContractType: 'ERC721',
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>',
          value: '0',
        },
      });
    }
    if (data.daoContractAddress) {
      accessControlConditions.push({
        contractAddress: data.daoContractAddress,
        standardContractType: 'ERC20',
        method: 'members',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: 'true',
        },
      });
    }
    // add object `or` condition between each condition
    const result = accessControlConditions
      .map((condition, i) => {
        if (i === accessControlConditions.length - 1) {
          return [condition];
        }
        return [condition, { operator: 'or' }];
      })
      .flat()
      .map((condition: any) => {
        if (condition.operator) {
          return condition;
        }
        return {
          chain: new NetwokNamePipe().transform(this.chainId),
          ...condition,
        };
      });
    return result;
  }

  private _isWalletAddressEcryptionCondition(
    encryptAccessCondition: IAccessControlConditions
  ) {
    return (
      encryptAccessCondition.method === '' &&
      encryptAccessCondition.parameters.includes(':userAddress')
    );
  }
}
