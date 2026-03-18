import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestMuseumComponent } from './test-museum.component';

describe('TestMuseumComponent', () => {
  let component: TestMuseumComponent;
  let fixture: ComponentFixture<TestMuseumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestMuseumComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestMuseumComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
