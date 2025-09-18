import { Component, input } from '@angular/core';
import { Product } from '../../shared/services/api';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.html',
  imports: [],
})
export class ProductList {
  products = input.required<Product[]>();
  Math: Math = Math;
}
