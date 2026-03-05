import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {PictureComponent} from '../../components/picture/picture';
import {PrimaryButtonComponent} from '../../components/primary-button/primary-button';

@Component({
  selector: 'page-not-found',
  standalone: true,
  imports: [
    RouterLink,
    PictureComponent,
    PrimaryButtonComponent
  ],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFoundPage {

}
