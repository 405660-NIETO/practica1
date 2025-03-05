import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, ReactiveFormsModule, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { VenueService } from '../services/venue.service';
import { BookingService } from '../services/booking.service';
import { ServiceService } from '../services/service.service';
import { Booking, BookingService as BookingServiceItem, Service, Venue } from '../interfaces';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../services/aviability.service';
import { Observable, catchError, debounceTime, map, of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CreateBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  venues: Venue[] = [];
  servicesList: Service[] = [];
  totalAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private venueService: VenueService,
    private bookingService: BookingService,
    private serviceService: ServiceService,
    private availabilityService: AvailabilityService,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm() {
    this.bookingForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(5)]],
      companyEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required]],
      venueId: ['', {
        validators: [Validators.required],
        asyncValidators: [this.checkAvailabilityValidator()],
        updateOn: 'blur'
      }],
      eventDate: ['', [Validators.required, this.futureDateValidator()]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      totalPeople: [null, [Validators.required, Validators.min(1)]],
      services: this.fb.array([]),
      status: ['pending'],
      totalAmount: [0]
    }, { validators: this.timeRangeValidator() });

    this.bookingForm.get('eventDate')?.valueChanges.subscribe(() => {
      this.bookingForm.get('venueId')?.updateValueAndValidity();
    });
  }

  private timeRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startTime = group.get('startTime')?.value;
      const endTime = group.get('endTime')?.value;
  
      if (!startTime || !endTime) {
        return null;
      }
  
      if (startTime >= endTime) {
        return { invalidTimeRange: true };
      }
  
      const services = (group.get('services') as FormArray)?.controls;
      if (services?.length) {
        for (let service of services) {
          const serviceStart = service.get('startTime')?.value;
          const serviceEnd = service.get('endTime')?.value;
          
          if (serviceStart && serviceEnd) {
            if (serviceStart >= serviceEnd) {
              return { invalidServiceTimeRange: true };
            }
            if (serviceStart < startTime || serviceEnd > endTime) {
              return { serviceOutOfRange: true };
            }
          }
        }
      }
  
      return null;
    };
  }

  private checkAvailabilityValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const venueId = control.value;
      const date = this.bookingForm?.get('eventDate')?.value;
  
      if (!venueId || !date) {
        return of(null);
      }
  
      return this.availabilityService.checkAvailability(venueId, date).pipe(
        map(isAvailable => isAvailable ? null : { notAvailable: true }),
        catchError(() => of(null))
      );
    };
  }

private futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate < today ? { pastDate: true } : null;
  };
}

  ngOnInit() {
    this.loadInitialData();
    
    this.bookingForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.calculateTotal();
    });
  }

  private loadInitialData() {
    this.venueService.getVenues().subscribe(venues => this.venues = venues);
    this.serviceService.getServices().subscribe(services => this.servicesList = services);
  }

  get services(): FormArray {
    return this.bookingForm.get('services') as FormArray;
  }

  addService() {
    const serviceGroup = this.fb.group({
      serviceId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(10)]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
    this.services.push(serviceGroup);
  }

  removeService(index: number) {
    this.services.removeAt(index);
  }

  calculateServiceSubtotal(index: number): number {
    const serviceControl = this.services.at(index);
    if (!serviceControl) return 0;
    
    const quantity = serviceControl.get('quantity')?.value || 0;
    const serviceId = serviceControl.get('serviceId')?.value;
    const service = this.servicesList.find(s => s.id === serviceId);
    return service ? quantity * service.pricePerPerson : 0;
  }

  calculateTotal() {
    let subtotal = 0;
    
    // CALCULO DEL SUBTOTL
    this.services.controls.forEach((control, index) => {
      subtotal += this.calculateServiceSubtotal(index);
    });

    // DESCUENTO
    const totalPeople = this.bookingForm.get('totalPeople')?.value || 0;
    if (totalPeople > 100) {
      subtotal *= 0.85; // ES EL 15%
    }

    this.totalAmount = subtotal;
  }

  submitBooking() {
    if (this.bookingForm.valid) {
      const bookingData = {
        ...this.bookingForm.value,
        bookingCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        totalAmount: this.totalAmount
      };

      this.bookingService.createBooking(bookingData).subscribe({
        next: () => {
          console.log('Reserva creada exitosamente');
          this.router.navigate(['/bookings']);
        },
        error: (error) => {
          console.error('Error al crear la reserva:', error);
        }
      });
    }
  }
}