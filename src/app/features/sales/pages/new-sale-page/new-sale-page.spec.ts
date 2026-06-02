import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSalePage } from './new-sale-page';

describe('NewSalePage', () => {
  let component: NewSalePage;
  let fixture: ComponentFixture<NewSalePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSalePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewSalePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
