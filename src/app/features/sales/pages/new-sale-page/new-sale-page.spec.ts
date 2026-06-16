import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSalePage } from './new-sale-page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('NewSalePage', () => {
  let component: NewSalePage;
  let fixture: ComponentFixture<NewSalePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSalePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),]
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
