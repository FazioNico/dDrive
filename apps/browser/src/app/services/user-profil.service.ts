import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IUserProfil } from "../interfaces/user-profil.interface";
import { CeramicService } from "./ceramic.service";


@Injectable()
export class UserProfilService {
  
  public userProfil = new BehaviorSubject(null as any);
  constructor(
    private readonly _ceramic: CeramicService
  ) { }

  async updateProfil(value: IUserProfil) {
    const { latestConnectionISODatetime } = value;
    const profil = await this._ceramic.updateUserProfil({latestConnectionISODatetime});
    this.userProfil.next(profil);
    return profil;
  }
  
}