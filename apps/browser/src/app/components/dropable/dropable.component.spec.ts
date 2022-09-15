import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropableComponent } from './dropable.component';

describe('DropableComponent', () => {
  let component: DropableComponent;
  let fixture: ComponentFixture<DropableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DropableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
