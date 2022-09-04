import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { CeramicService } from './ceramic.service';
import { IPFSService } from './ipfs.service';
import { v4 as uuidV4 } from 'uuid';
import { LitService } from './lit.service';
import { IMediaFile } from '../interfaces/mediafile.interface';

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

  constructor(
    private readonly _dataService: CeramicService,
    private readonly _fileService: IPFSService,
    private readonly _litService: LitService
  ) {}

  async getFiles() {
    const { files = [] } = await this._dataService.getAll();
    console.log('[INFO] files: ', files);
    this._items$.next(files);
  }

  async upload(file: File, encrypt = false) {
    let mediaToUpload: File | Blob = file;
    const _id = uuidV4();
    const isoDateTime = new Date().toISOString();
    const metaData: IMediaFile = {
      parent: this._filterBy$.value,
      name: file.name || _id,
      size: file.size,
      type: file.type,
      isFolder: false,
      createdIsoDateTime: isoDateTime,
      lastModifiedIsoDateTime: isoDateTime,
      _id,
    };
    // encrypt file
    if (encrypt) {
      const { encryptedFile, encryptedSymmetricKey } =
        await this._litService.encrypt(file);
      // update variables
      mediaToUpload = encryptedFile;
      metaData.encryptedSymmetricKey = encryptedSymmetricKey;
    }
    // upload file to ipfs
    const { cid } = await this._fileService.add(mediaToUpload);
    // build final object data and save to database
    const files = [
      ...this._items$.value,
      { ...metaData, cid }
    ];
    // update object data to database
    await this._dataService.updateData(
      { files },
      this._dataService.docId
    );
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
    const filesToPreserve: any[] = files.filter(
      (item) => item.parent !== id
    );
    // update object data to database
    await this._dataService.updateData(
      { files: filesToPreserve },
      this._dataService.docId
    );
    // update state
    this._items$.next(filesToPreserve);
  }

  async downloadFile(_id: string) {
    const { cid, name, encryptedSymmetricKey, type } =
      this._items$.value.find((item) => item._id === _id) || {};
    if (!cid) {
      throw new Error('File not found');
    }
    // get file from ipfs
    const fileFromCID = await this._fileService.getFromCID(cid);
    const result: { file: File } = { file: fileFromCID };
    // decrypt file if needed
    if (encryptedSymmetricKey) {
      const { decryptedArrayBuffer } = await this._litService.decrypt(
        fileFromCID,
        encryptedSymmetricKey
      );
      // convert array buffer to file and overwrite result object
      result.file = new File([decryptedArrayBuffer], name || cid, { type });
    }
    console.log('[INFO] Creating download link...');
    // download file from browser
    const link = document.createElement('a');
    link.href = URL.createObjectURL(result.file);
    link.download = name || cid;
    link.click();
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
