import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitPreview } from './visit-preview';

describe('VisitPreview', () => {
  let component: VisitPreview;
  let fixture: ComponentFixture<VisitPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
