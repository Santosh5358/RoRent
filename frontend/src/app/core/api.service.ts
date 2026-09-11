import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bill,
  Dashboard,
  ElectricityRate,
  MeterReading,
  OcrScanResponse,
  Payment,
  PaymentSubmission,
  Property,
  Room,
  Tenant,
  TenantProfile,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Dashboard
  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  // Properties
  properties(): Observable<Property[]> {
    return this.http.get<Property[]>('/api/properties');
  }
  createProperty(body: Partial<Property>): Observable<Property> {
    return this.http.post<Property>('/api/properties', body);
  }
  updateProperty(id: number, body: Partial<Property>): Observable<Property> {
    return this.http.put<Property>(`/api/properties/${id}`, body);
  }
  deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`/api/properties/${id}`);
  }

  // Rooms
  rooms(propertyId?: number): Observable<Room[]> {
    const q = propertyId ? `?propertyId=${propertyId}` : '';
    return this.http.get<Room[]>(`/api/rooms${q}`);
  }
  room(id: number): Observable<Room> {
    return this.http.get<Room>(`/api/rooms/${id}`);
  }
  createRoom(body: Partial<Room>): Observable<Room> {
    return this.http.post<Room>('/api/rooms', body);
  }
  updateRoom(id: number, body: Partial<Room>): Observable<Room> {
    return this.http.put<Room>(`/api/rooms/${id}`, body);
  }
  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`/api/rooms/${id}`);
  }

  // Tenants
  tenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>('/api/tenants');
  }
  createTenant(body: Partial<Tenant>): Observable<Tenant> {
    return this.http.post<Tenant>('/api/tenants', body);
  }
  updateTenant(id: number, body: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`/api/tenants/${id}`, body);
  }
  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`/api/tenants/${id}`);
  }
  assignTenant(id: number, body: { roomId: number; startDate: string; monthlyRent?: number }): Observable<Tenant> {
    return this.http.post<Tenant>(`/api/tenants/${id}/assign`, body);
  }
  unassignTenant(id: number): Observable<Tenant> {
    return this.http.post<Tenant>(`/api/tenants/${id}/unassign`, {});
  }
  resetTenantPassword(id: number): Observable<{ password: string }> {
    return this.http.post<{ password: string }>(`/api/tenants/${id}/reset-password`, {});
  }

  // Meter readings
  readings(roomId?: number): Observable<MeterReading[]> {
    const q = roomId ? `?roomId=${roomId}` : '';
    return this.http.get<MeterReading[]>(`/api/meter-readings${q}`);
  }
  previousReading(roomId: number): Observable<{ previousReading: number }> {
    return this.http.get<{ previousReading: number }>(`/api/meter-readings/previous?roomId=${roomId}`);
  }
  scanMeter(roomId: number, image: File): Observable<OcrScanResponse> {
    const form = new FormData();
    form.append('image', image);
    return this.http.post<OcrScanResponse>(`/api/meter-readings/scan?roomId=${roomId}`, form);
  }
  saveReading(body: {
    roomId: number;
    readingDate: string;
    currentReading: number;
    meterReset?: boolean;
    pricePerUnit?: number;
    imageUrl?: string;
    readingSource?: string;
    ocrDetectedReading?: string;
    confirmLowerReading?: boolean;
  }): Observable<MeterReading> {
    return this.http.post<MeterReading>('/api/meter-readings', body);
  }

  // Bills
  bills(roomId?: number): Observable<Bill[]> {
    const q = roomId ? `?roomId=${roomId}` : '';
    return this.http.get<Bill[]>(`/api/bills${q}`);
  }
  generateBill(body: {
    roomId: number;
    billingMonth: string;
    meterReadingId?: number;
    otherCharges?: number;
    discount?: number;
    dueDate?: string;
    regenerate?: boolean;
  }): Observable<Bill> {
    return this.http.post<Bill>('/api/bills/generate', body);
  }
  receiptUrl(id: number): string {
    return `/api/bills/${id}/receipt`;
  }
  downloadReceipt(id: number): Observable<Blob> {
    return this.http.get(`/api/bills/${id}/receipt`, { responseType: 'blob' });
  }

  // Payments
  payments(billId?: number): Observable<Payment[]> {
    const q = billId ? `?billId=${billId}` : '';
    return this.http.get<Payment[]>(`/api/payments${q}`);
  }
  recordPayment(body: {
    billId: number;
    amount: number;
    paymentDate?: string;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  }): Observable<Payment> {
    return this.http.post<Payment>('/api/payments', body);
  }

  // Electricity rates
  rates(): Observable<ElectricityRate[]> {
    return this.http.get<ElectricityRate[]>('/api/electricity-rates');
  }
  createRate(body: Partial<ElectricityRate>): Observable<ElectricityRate> {
    return this.http.post<ElectricityRate>('/api/electricity-rates', body);
  }

  // Owner: payment slip approvals
  submissions(status?: string): Observable<PaymentSubmission[]> {
    const q = status ? `?status=${status}` : '';
    return this.http.get<PaymentSubmission[]>(`/api/payment-submissions${q}`);
  }
  pendingSubmissionCount(): Observable<{ pending: number }> {
    return this.http.get<{ pending: number }>('/api/payment-submissions/pending-count');
  }
  approveSubmission(id: number, reason?: string): Observable<PaymentSubmission> {
    return this.http.post<PaymentSubmission>(`/api/payment-submissions/${id}/approve`, { reason });
  }
  rejectSubmission(id: number, reason?: string): Observable<PaymentSubmission> {
    return this.http.post<PaymentSubmission>(`/api/payment-submissions/${id}/reject`, { reason });
  }

  // Tenant portal
  portalProfile(): Observable<TenantProfile> {
    return this.http.get<TenantProfile>('/api/portal/me');
  }
  portalBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>('/api/portal/bills');
  }
  portalReadings(): Observable<MeterReading[]> {
    return this.http.get<MeterReading[]>('/api/portal/readings');
  }
  portalPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>('/api/portal/payments');
  }
  portalSubmissions(): Observable<PaymentSubmission[]> {
    return this.http.get<PaymentSubmission[]>('/api/portal/submissions');
  }
  portalDownloadReceipt(id: number): Observable<Blob> {
    return this.http.get(`/api/portal/bills/${id}/receipt`, { responseType: 'blob' });
  }
  portalSubmitSlip(body: {
    billId: number;
    amount: number;
    category?: string;
    paymentMethod?: string;
    transactionReference?: string;
    note?: string;
    slip: File;
  }): Observable<PaymentSubmission> {
    const form = new FormData();
    form.append('billId', String(body.billId));
    form.append('amount', String(body.amount));
    if (body.category) form.append('category', body.category);
    if (body.paymentMethod) form.append('paymentMethod', body.paymentMethod);
    if (body.transactionReference) form.append('transactionReference', body.transactionReference);
    if (body.note) form.append('note', body.note);
    form.append('slip', body.slip);
    return this.http.post<PaymentSubmission>('/api/portal/submissions', form);
  }
}
