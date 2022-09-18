import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { CeramicService } from './ceramic.service';
import { IPFSService } from './ipfs.service';
import { v4 as uuidV4 } from 'uuid';
import { LitService } from './lit.service';
import {
  IAccessControlConditions,
  IMediaFile,
} from '../interfaces/mediafile.interface';
import { DIDService } from './did.service';
import { NotificationService } from './notification.service';
import { NetwokNamePipe } from '../pipes/network-name.pipe';

@Injectable()
export class MediaFileService {
  private readonly _queryFilterBy$: BehaviorSubject<string | null> =
    new BehaviorSubject(null as any);
  private readonly _filterBy$: BehaviorSubject<string> = new BehaviorSubject(
    'root'
  );
  private readonly _items$: BehaviorSubject<IMediaFile[]> = new BehaviorSubject(
    null as any
  );
  public readonly breadcrumbs$ = combineLatest([
    this._items$.asObservable(),
    this._filterBy$.asObservable(),
  ]).pipe(
    map(([items, path]) => {
      const ROOT = { name: 'root', _id: 'root' };
      if (!items?.length) {
        return [ROOT];
      }
      const breadcrumbs: { _id: string; name: string }[] = [];
      // find `root` parent folder from current path
      while (!breadcrumbs.find((b) => b.name === 'root')) {
        const parent = items.find((item) => item._id === path && item.isFolder);
        if (!parent) {
          breadcrumbs.unshift(ROOT);
          break;
        }
        breadcrumbs.unshift({ name: parent.name, _id: parent._id });
        if (parent.name === 'root') {
          break;
        }
        path = parent.parent;
      }
      return breadcrumbs;
    })
  );
  public readonly items$ = combineLatest([
    this._items$.asObservable().pipe(filter(Boolean)),
    this._filterBy$.asObservable(),
    this._queryFilterBy$.asObservable(),
  ]).pipe(
    map(([items, filterBy, queryFilter]) =>
      items?.filter((item) =>
        queryFilter
          ? item.name.toLowerCase().includes(queryFilter.toLowerCase())
          : item.parent === filterBy
      )
    ),
    map((items) => {
      // extract filers & folders
      const folders = items.filter((item) => item?.isFolder);
      const filess = items.filter((item) => !item?.isFolder);
      // return sorted datas
      const result = [
        // sort folders first
        ...folders.sort((a, b) => a.name?.localeCompare(b.name)),
        ...filess.sort((a, b) => a.name?.localeCompare(b.name)),
      ];
      return result;
    })
  );
  public readonly allMedia$ = this._items$.asObservable();

  constructor(
    private readonly _dataService: CeramicService,
    private readonly _fileService: IPFSService,
    private readonly _litService: LitService,
    private readonly _didService: DIDService,
    private readonly _notificationSerivce: NotificationService
  ) {}

  async getFiles() {
    const { files = [] } = await this._dataService.getAll();
    console.log('[INFO] files: ', files);
    this._items$.next(files);
  }

  async getAllFolders() {
    const folders = this._items$.value.filter((item) => item.isFolder);
    return folders;
  }

  async upload(
    file: File | Blob,
    accessControlConditions: IAccessControlConditions[] = [],
    metaDataValue: IMediaFile|undefined = undefined
  ) {
    // build file metadata object
    const _id = uuidV4();
    const isoDateTime = new Date().toISOString();
    const metaData: IMediaFile = !metaDataValue 
      ? {
          parent: this._filterBy$.value,
          name: (file as File)?.name || _id,
          size: file.size,
          type: file.type,
          isFolder: false,
          createdIsoDateTime: isoDateTime,
          lastModifiedIsoDateTime: isoDateTime,
          _id,
        }
      : {
        ...metaDataValue,
        lastModifiedIsoDateTime: isoDateTime,
      };
    // encrypt file if needed
    if (accessControlConditions.length > 0) {
      const chainName = new NetwokNamePipe().transform(this._didService.chainId$.value);
      const { encryptedFile, encryptedSymmetricKey } =
        await this._litService.encrypt(file, accessControlConditions, chainName);
      // update file variable with encrypted file
      file = encryptedFile;
      // update variables with encrypted data
      metaData.encryptedSymmetricKey = encryptedSymmetricKey;
      metaData.accessControlConditions = accessControlConditions;
    }
    // upload file to ipfs
    const { cid } = await this._fileService.add(file);
    // add CID to file metadata
    metaData.cid = cid;
    // update files list with new file metadata
    const files = [...this._items$.value, metaData];
    // update object data to database
    await this._dataService.updateData({ files }, this._dataService.docId);
    // notify shared user
    const destinationAddress = this._isWalletAddressEcryptionCondition(
      accessControlConditions
    );
    if (destinationAddress) {
      await this._notificationSerivce.sendNotification(
        metaData,
        this._didService.accountId$.value,
        destinationAddress
      );
    }
    // update service state
    this._items$.next(files);
  }

  async createFolder(name: string) {
    // find parent folder from current path
    const currentPath = this._filterBy$.value;
    // handle unexisting parent folder
    if (!currentPath) {
      throw new Error('CurrentPath not found');
    }
    // run upload task
    const isoDateTime = new Date().toISOString();
    const metaData: IMediaFile = {
      parent: currentPath,
      name,
      size: 0,
      isFolder: true,
      _id: uuidV4(),
      createdIsoDateTime: isoDateTime,
      lastModifiedIsoDateTime: isoDateTime,
    };
    const currentFiles = [...this._items$.value];
    currentFiles.push(metaData);
    // update object data to database
    await this._dataService.updateData(
      { files: currentFiles },
      this._dataService.docId
    );
    // update state
    this._items$.next(currentFiles);
  }

  async delete(id: string) {
    const files = [...this._items$.value];
    const index = files.findIndex((item) => item._id === id);
    if (index === -1) {
      throw new Error('File not found');
    }
    const cid = files[index].cid;
    if (cid) {
      // unpin file from ipfs
      await this._fileService.unpin(cid).catch((err) => {
        console.log('[ERROR] unpin: ', err);
      });
    }
    // remove file from list
    files.splice(index, 1);
    // find all children files
    const children = files.filter((item) => item.parent === id);
    // unpin all children files
    await Promise.all(
      children.map(async (child) => {
        if (child.cid) {
          await this._fileService.unpin(child.cid);
        }
      })
    );
    // remove all children files
    children.forEach((child) => {
      const childIndex = files.findIndex((item) => item._id === child._id);
      if (childIndex !== -1) {
        files.splice(childIndex, 1);
      }
    });
    // update object data to database
    await this._dataService.updateData({ files }, this._dataService.docId);
    // update state
    this._items$.next(files);
  }

  async rename(_id: string, newName: string) {
    const files = [...this._items$.value];
    const index = this._items$.value.findIndex((item) => item._id === _id);
    if (index === -1) {
      throw new Error('File not found');
    }
    // rename file
    files[index].name = newName;
    // update object data to database
    await this._dataService.updateData({ files }, this._dataService.docId);
    // update state
    this._items$.next(files);
  }

  async moveTo(itemId: string, itemDestination: IMediaFile) {
    const files = [...this._items$.value];
    const index = files.findIndex((file) => file._id === itemId);
    if (index === -1) {
      throw new Error('File not found');
    }
    // move file
    files[index].parent = itemDestination._id;
    // update object data to database
    await this._dataService.updateData({ files }, this._dataService.docId);
    // update state
    this._items$.next(files);
  }

  async downloadFile(_id: string, inBorwser = true) {
    const { cid, name, encryptedSymmetricKey, accessControlConditions, type } =
      this._items$.value.find((item) => item._id === _id) || {};
    if (!cid) {
      throw new Error('File not found');
    }
    // get file from ipfs
    const fileFromCID = await this._fileService.getFromCID(cid);
    const result: { file: File } = { file: fileFromCID };
    // decrypt file if needed
    if (encryptedSymmetricKey && accessControlConditions) {
      const chainName = new NetwokNamePipe().transform(this._didService.chainId$.value);
      const { decryptedArrayBuffer } = await this._litService.decrypt(
        fileFromCID,
        encryptedSymmetricKey,
        accessControlConditions,
        chainName
      );
      // convert array buffer to file and overwrite result object
      result.file = new File([decryptedArrayBuffer], name || cid, { type });
    }
    console.log('[INFO] Creating download link...');
    if (inBorwser) {
      // download file from browser
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.file);
      link.download = name || cid;
      link.click();
    }
    return result;
  }

  async shareWithEncryption(file: IMediaFile) {
    const {cid, accessControlConditions, ...fileMetadata} = file;
    if (!cid) {
      throw new Error('File not found');
    }
    // get file from ipfs
    const {file: fileFromCID} = await this.downloadFile(file._id, false);
    // re upload file to ipfs with new encryption
    await this.upload(fileFromCID, accessControlConditions, fileMetadata);
    // delete old pin
    await this.delete(file._id);
  }

  searchByName(name: string | null) {
    if (name) {
      this._filterBy$.next('root');
    }
    this._queryFilterBy$.next(name);
  }

  navToFolderId(id: string) {
    this._queryFilterBy$.next(null);
    if (id === 'root') {
      this._filterBy$.next('root');
      return;
    }
    const folder = this._items$.value.find(
      (item) => item._id === id && item.isFolder
    );
    if (!folder) {
      throw new Error('Folder not found');
    }
    this._filterBy$.next(id);
  }

  private _isWalletAddressEcryptionCondition(
    encryptAccessCondition: IAccessControlConditions[] | undefined
  ) {
    // check existing shared users account with Notifs protocol
    const account = this._didService.accountId$.value;
    const isWalletAddressCondition = encryptAccessCondition?.find(
      (c) =>
        c.method === '' &&
        c.parameters.includes(':userAddress') &&
        c.returnValueTest.value !== account
    );
    const destinationAddress = isWalletAddressCondition?.returnValueTest?.value;
    return destinationAddress;
  }

  private _buildAbsolutPath(file: IMediaFile): string{
    const path = [file.name];
    let parent = this._items$.value.find((item) => item._id === file.parent);
    while (parent !== undefined) {
      path.unshift(parent.name);
      parent = this._items$.value.find((item) => item._id === parent?.parent);
    }
    return path.join('/');
  }
}
