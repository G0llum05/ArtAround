import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryWallComponent } from './gallery-wall.component';

describe('GalleryWallComponent', () => {
  let component: GalleryWallComponent;
  let fixture: ComponentFixture<GalleryWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryWallComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryWallComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
