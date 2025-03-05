import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venue } from '../interfaces';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  constructor(private http: HttpClient) {}

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(environment.apiVenues);
  }
}