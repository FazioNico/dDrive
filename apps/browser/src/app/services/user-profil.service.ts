import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IUserProfil } from "../interfaces/user-profil.interface";
import { CeramicService } from "./ceramic.service";


@Injectable()
export class UserProfilService {
  
  public userProfil$ = new BehaviorSubject<IUserProfil>(null as any);
  public latestNotifedISODatetime$ = new BehaviorSubject<string>(null as any);
  
  constructor(
    private readonly _ceramic: CeramicService
  ) { }

  async updateProfil(value: Partial<IUserProfil>) {
    const { 
      latestConnectionISODatetime = new Date().toISOString(),
      ...userData
     } = value;
    const {dDrive: profil} = await this._ceramic.updateUserProfil({
      ...userData,
      latestConnectionISODatetime
    })||{};
    if (!profil) {
      throw 'No dDrive found';
    }
    this.userProfil$.next(profil);
    return profil;
  }
  
}