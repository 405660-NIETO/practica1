import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { Booking } from '../interfaces';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styles: [`
    .badge { text-transform: capitalize; }
  `],
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule
  ],
  standalone: true
})
export class BookingsListComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  searchForm: FormGroup;

  constructor(
    private bookingService: BookingService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit() {
    this.loadBookings();
    this.setupSearch();
  }

  private loadBookings() {
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        console.log('Received bookings:', bookings); // DESP LO BORRO NO OLVIDAR!
        // FILTRAR LOS BOOKINGS Q NO SON VALIDOS
        this.bookings = bookings.filter(booking => 
          booking && booking.companyName && booking.bookingCode
        );
        this.filteredBookings = this.bookings;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
      }
    });
  }

  private setupSearch() {
    console.log('Setting up search...');
    this.searchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(term => {
        console.log('Search term changed:', term);
        this.filterBookings(term);
      });
  }
  
  private filterBookings(term: string) {
    if (!term) {
      this.filteredBookings = this.bookings;
      return;
    }
  
    term = term.toLowerCase();
    this.filteredBookings = this.bookings.filter(booking => {
      if (!booking) return false;
  
      const companyNameMatch = booking.companyName 
        ? booking.companyName.toLowerCase().includes(term)
        : false;
  
      const bookingCodeMatch = booking.bookingCode 
        ? String(booking.bookingCode).toLowerCase().includes(term)
        : false;
  
      return companyNameMatch || bookingCodeMatch;
    });
  }
  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'confirmed': return 'badge bg-success';
      case 'pending': return 'badge bg-warning text-dark';
      case 'cancelled': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}