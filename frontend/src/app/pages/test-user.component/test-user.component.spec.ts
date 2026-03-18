import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestUserComponent } from './test-user.component';

describe('TestUserComponent', () => {
  let component: TestUserComponent;
  let fixture: ComponentFixture<TestUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestUserComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestUserComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
