import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgesList } from './badges-list';

describe('BadgesList', () => {
  let component: BadgesList;
  let fixture: ComponentFixture<BadgesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgesList],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
