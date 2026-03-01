import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {PictureComponent} from '../../components/picture/picture';

@Component({
  selector: 'page-not-found',
  imports: [
    RouterLink,
    PictureComponent
  ],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFoundComponent {

}
