import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PictureComponent } from '../../components/picture/picture.component';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button.component';

@Component({
  selector: 'page-not-found',
  standalone: true,
  imports: [
    RouterLink,
    PictureComponent,
    PrimaryButtonComponent
  ],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css',
})
export class PageNotFoundPage {

}
