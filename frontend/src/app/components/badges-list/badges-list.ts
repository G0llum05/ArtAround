import { Component, signal, input } from '@angular/core';
import {VisitHomePresentationResponse} from '../../models/visit.model';

@Component({
  selector: 'app-badges-list',
  imports: [],
  templateUrl: './badges-list.html',
  styleUrl: './badges-list.css',
})
export class BadgesList{
  visit = input.required<VisitHomePresentationResponse>();
}
