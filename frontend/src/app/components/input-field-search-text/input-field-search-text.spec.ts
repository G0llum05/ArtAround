import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputFieldSearchText } from './input-field-search-text';

describe('InputFieldSearchText', () => {
  let component: InputFieldSearchText;
  let fixture: ComponentFixture<InputFieldSearchText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputFieldSearchText],
    }).compileComponents();

    fixture = TestBed.createComponent(InputFieldSearchText);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
