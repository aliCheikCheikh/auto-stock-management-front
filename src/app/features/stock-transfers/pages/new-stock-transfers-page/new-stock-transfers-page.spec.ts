import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStockTransfersPage } from './new-stock-transfers-page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('NewStockTransfersPage', () => {
  let component: NewStockTransfersPage;
  let fixture: ComponentFixture<NewStockTransfersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStockTransfersPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
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
