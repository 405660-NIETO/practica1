import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../interfaces';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(private http: HttpClient) {}

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(environment.apiBookings);
  }

  createBooking(booking: Booking): Observable<Booking> {
    return this.http.post<Booking>(environment.apiBookings, booking);
  }
}