import { Component, signal, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Header } from './shared/components/header/header';
import { Sidenav } from './shared/components/sidenav/sidenav';
import { Api, Product } from './shared/services/api';
import { ProductList } from './feature/product-list/product-list';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, Header, Sidenav, ProductList],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('myntra');
  private readonly api = inject(Api);
  products = this.api.products;

  // Signal to hold filtered products from sidenav
  filteredProducts = signal<Product[]>([]);

  ngOnInit() {
    this.api.getProducts();
  }

  onFilteredProductsChange(filteredProducts: Product[]) {
    this.filteredProducts.set(filteredProducts);
  }
}
