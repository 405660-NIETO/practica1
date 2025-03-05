import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { CreateBookingComponent } from './create-booking/create-booking.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'parcial-final';
}
