import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFolderComponent } from './select-folder.component';

describe('SelectFolderComponent', () => {
  let component: SelectFolderComponent;
  let fixture: ComponentFixture<SelectFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectFolderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
