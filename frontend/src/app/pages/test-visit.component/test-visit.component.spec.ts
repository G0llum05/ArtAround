import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestVisitComponent } from './test-visit.component';

describe('TestVisitComponent', () => {
  let component: TestVisitComponent;
  let fixture: ComponentFixture<TestVisitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestVisitComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestVisitComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
