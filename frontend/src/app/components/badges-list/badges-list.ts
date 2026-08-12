import { Component, signal, input } from '@angular/core';
import {VisitHomePresentationResponse} from '../../models/visit.model';

@Component({
  selector: 'app-badges-list',
  imports: [],
  templateUrl: './badges-list.html',
  styleUrl: './badges-list.css',
})
export class BadgesList{
  disableFriendly = input<boolean>(false);
  free = input<boolean>(false);
  verified = input<boolean>(false);
}
