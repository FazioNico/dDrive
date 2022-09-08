import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { CeramicService } from './ceramic.service';
import { IPFSService } from './ipfs.service';
import { v4 as uuidV4 } from 'uuid';
import { LitService } from './lit.service';
import { IAccessControlConditions, IMediaFile } from '../interfaces/mediafile.interface';
import { XMTPService } from './xmtp.service';
import { DIDService } from './did.service';

@Injectable()
export class MediaFileService {
  private readonly _queryFilterBy$: BehaviorSubject<string | null> =
    new BehaviorSubject(null as any);
  private readonly _filterBy$: BehaviorSubject<string> = new BehaviorSubject(
    'root'
  );
  private readonly _items$: BehaviorSubject<IMediaFile[]> = new BehaviorSubject(
    [] as IMediaFile[]
  );
  public readonly breadcrumbs$ = combineLatest([
    this._items$.asObservable(),
    this._filterBy$.asObservable(),
  ]).pipe(
    map(([items, path]) => {
      if (!items.length) {
        return [];
      }
      const breadcrumbs: { _id: string; name: string }[] = [];
      // find `root` parent folder from current path
      while (!breadcrumbs.find((b) => b.name === 'root')) {
        const parent = items.find((item) => item._id === path && item.isFolder);
        if (!parent) {
          breadcrumbs.unshift({ name: 'root', _id: 'root' });
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
      items.filter((item) =>
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
    private readonly _xmtpService: XMTPService,
    private readonly _didService: DIDService
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

  async upload(file: File, encryptAccessCondition?: IAccessControlConditions[]) {
    let fileToUpload: File | Blob = file;
    const _id = uuidV4();
    const isoDateTime = new Date().toISOString();
    const metaData: IMediaFile & { conversation?: any } = {
      parent: this._filterBy$.value,
      name: file.name || _id,
      size: file.size,
      type: file.type,
      isFolder: false,
      createdIsoDateTime: isoDateTime,
      lastModifiedIsoDateTime: isoDateTime,
      _id,
    };
    // check existing shared users account with Notifs protocol
    const account = this._didService.accountId$.value;
    const isWalletAddressCondition = encryptAccessCondition?.find(
      (c) => c.method === '' && c.parameters.includes(':userAddress') && c.returnValueTest.value !== account
    );
    const destinationAddress = isWalletAddressCondition?.returnValueTest?.value;
    if (
      encryptAccessCondition &&
      encryptAccessCondition.length > 0 &&
      isWalletAddressCondition &&
      destinationAddress &&
      destinationAddress !== account
    ) {
      console.log('[INFO] notify shared users: ', destinationAddress);
      const { conversations = [] } = await this._xmtpService.getConversations();
      const conversation = conversations.find(
        (c) => c.peerAddress === destinationAddress
      );
      if (conversation) {
        console.log('[INFO] conversation found: ', conversation);
        metaData.conversation = conversation;
      } else {
        console.log('[INFO] conversation not found');
        metaData.conversation = await this._xmtpService.startNewConversation(
          destinationAddress
        ).catch((e) => {
          // TODO: use display error service and do not throw error
          console.log('[ERROR] startNewConversation: ', e);
          return null;
        });
      }
    }
    // encrypt file
    if (encryptAccessCondition && encryptAccessCondition.length > 0) {
      const { encryptedFile, encryptedSymmetricKey } =
        await this._litService.encrypt(file, encryptAccessCondition);
      // update variables
      fileToUpload = encryptedFile;
      metaData.encryptedSymmetricKey = encryptedSymmetricKey;
      metaData.accessControlConditions = encryptAccessCondition;
    }
    // upload file to ipfs
    const { cid } = await this._fileService.add(fileToUpload);
    // build final object data and save to database
    const { conversation = null, ...fileData } = metaData;
    const files = [...this._items$.value, { ...fileData, cid }];
    // update object data to database
    await this._dataService.updateData({ files }, this._dataService.docId);
    // notify shared user
    if (conversation && isWalletAddressCondition) {
      const { name } = fileData;
      const message = `You have a new file shared with you: ${name}`;
      await this._xmtpService.sendMessage(conversation, message);
      console.log('[INFO] message sent: ', message);
    }
    // update state
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
    // remove file from list
    files.splice(index, 1);
    // filter files by parent to exclude all files in current folder
    const filesToPreserve: any[] = files.filter((item) => item.parent !== id);
    // update object data to database
    await this._dataService.updateData(
      { files: filesToPreserve },
      this._dataService.docId
    );
    // update state
    this._items$.next(filesToPreserve);
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
      const { decryptedArrayBuffer } = await this._litService.decrypt(
        fileFromCID,
        encryptedSymmetricKey,
        accessControlConditions
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

  async share(id: string) {
    const { cid } = this._items$.value.find((item) => item._id === id) || {};
    if (!cid) {
      throw new Error('File not found');
    }
    throw new Error('Not implemented');
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

  private async _asyncLoad(file: File | Blob, type: string) {
    const blob = new Blob([file], { type });
    const previewUrl = URL.createObjectURL(blob);
    // preload img for faster rendering
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = previewUrl;
    });
    return { previewUrl };
  }
}
