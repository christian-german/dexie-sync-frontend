import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatCardPrimaryComponent } from './mat-card-primary.component';

describe('MatCardPrimaryComponent', () => {
  let component: MatCardPrimaryComponent;
  let fixture: ComponentFixture<MatCardPrimaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatCardPrimaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatCardPrimaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
