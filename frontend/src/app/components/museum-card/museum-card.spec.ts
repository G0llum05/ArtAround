import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuseumCard } from './museum-card';

describe('MuseumCard', () => {
  let component: MuseumCard;
  let fixture: ComponentFixture<MuseumCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuseumCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MuseumCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
