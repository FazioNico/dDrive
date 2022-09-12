import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NFTPageComponent } from './nft-page.component';

describe('NFTPageComponent', () => {
  let component: NFTPageComponent;
  let fixture: ComponentFixture<NFTPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NFTPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NFTPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
