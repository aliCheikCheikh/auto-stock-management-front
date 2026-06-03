import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStockTransfersPage } from './new-stock-transfers-page';

describe('NewStockTransfersPage', () => {
  let component: NewStockTransfersPage;
  let fixture: ComponentFixture<NewStockTransfersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStockTransfersPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewStockTransfersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
