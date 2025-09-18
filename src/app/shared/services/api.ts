import { environment } from '../../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  discount_price: number;
  sizes: string[];
  color: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class Api {
  private readonly apiUrl = environment.apiUrl;
  products = signal<Product[]>([]);

  constructor(private readonly http: HttpClient) {}

  getProducts() {
    this.http.get<Product[]>(`${this.apiUrl}/products`).subscribe((data) => {
      this.products.set(data);
    });
  }
}
