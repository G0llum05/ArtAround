import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigatorSettings } from './navigator-settings';

describe('NavigatorSettings', () => {
  let component: NavigatorSettings;
  let fixture: ComponentFixture<NavigatorSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigatorSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigatorSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
