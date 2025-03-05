import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  constructor(private http: HttpClient) {}

  checkAvailability(venueId: string, date: string): Observable<boolean> {
    return this.http.get<any[]>(`${environment.apiAvailability}?venueId=${venueId}&date=${date}`)
    .pipe(
      map(response => {
        if (response.length === 0) return true;
        return response.some(item => item.available);
      })
    );
  }
}