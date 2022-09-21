import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupEncryptionComponent } from './setup-encryption.component';

describe('SetupEncryptionComponent', () => {
  let component: SetupEncryptionComponent;
  let fixture: ComponentFixture<SetupEncryptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SetupEncryptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupEncryptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
