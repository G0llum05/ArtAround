import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitResultsGrid } from './visit-results-grid';

describe('VisitResultsGrid', () => {
  let component: VisitResultsGrid;
  let fixture: ComponentFixture<VisitResultsGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitResultsGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitResultsGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
