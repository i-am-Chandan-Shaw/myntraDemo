import {
  Component,
  input,
  signal,
  computed,
  effect,
  output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Product } from '../../services/api';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.html',
  imports: [CheckboxModule, SliderModule, RadioButtonModule, FormsModule],
})
export class Sidenav implements OnInit, OnDestroy {
  products = input.required<Product[]>();

  filteredProductsChange = output<Product[]>();

  selectedCategories = signal<string[]>([]);
  selectedBrands = signal<string[]>([]);
  selectedDiscountPercent = signal<number | null>(null);

  categories = computed(() => Array.from(new Set(this.products().map((p) => p.category))));
  brands = computed(() => Array.from(new Set(this.products().map((p) => p.brand))));

  minPrice = computed(() => {
    const prices = this.products().map((p) => p.price);
    return prices.length ? Math.min(...prices) : 0;
  });

  maxPrice = computed(() => {
    const prices = this.products().map((p) => p.price);
    return prices.length ? Math.max(...prices) : 0;
  });

  discountPercents = computed(() => [10, 20, 30, 40, 50]);

  rangeValues = signal<[number, number]>([0, 0]);

  private initializedFromURL = false;

  private readonly priceUpdateSubject = new Subject<[number, number]>();
  private readonly otherFiltersUpdateSubject = new Subject<void>();

  constructor(private readonly router: Router, private readonly route: ActivatedRoute) {
    effect(() => {
      const prods = this.products();
      if (prods.length && !this.initializedFromURL) {
        this.initializeFromURL();
        this.initializedFromURL = true;
      } else if (prods.length && this.initializedFromURL) {
        this.applyFilter();
      }
    });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.products().length) {
        this.syncFiltersFromURL();
      }
    });

    this.priceUpdateSubject.pipe(debounceTime(300)).subscribe((values) => {
      this.rangeValues.set(values);
      this.updateFiltersInternal();
    });

    this.otherFiltersUpdateSubject.pipe(debounceTime(100)).subscribe(() => {
      this.updateFiltersInternal();
    });
  }

  ngOnInit() {
    if (this.products().length) {
      this.initializeFromURL();
      this.initializedFromURL = true;
    }
  }

  ngOnDestroy() {
    this.priceUpdateSubject.complete();
    this.otherFiltersUpdateSubject.complete();
  }

  private initializeFromURL() {
    const defaultMin = this.minPrice();
    const defaultMax = this.maxPrice();
    this.rangeValues.set([defaultMin, defaultMax]);

    this.syncFiltersFromURL();
  }

  private syncFiltersFromURL() {
    const params = this.route.snapshot.queryParams;

    this.selectedCategories.set(params['category'] ? params['category'].split(',') : []);

    this.selectedBrands.set(params['brand'] ? params['brand'].split(',') : []);

    if (this.products().length > 0) {
      const currentRange = this.rangeValues();
      const defaultMin = this.minPrice();
      const defaultMax = this.maxPrice();

      const min = params['minPrice'] ? +params['minPrice'] : currentRange[0] || defaultMin;
      const max = params['maxPrice'] ? +params['maxPrice'] : currentRange[1] || defaultMax;
      this.rangeValues.set([min, max]);
    }

    this.selectedDiscountPercent.set(params['discountPercent'] ? +params['discountPercent'] : null);

    this.applyFilter();
  }

  private updateFiltersInternal() {
    const query: any = {};

    if (this.selectedCategories().length) query.category = this.selectedCategories().join(',');
    if (this.selectedBrands().length) query.brand = this.selectedBrands().join(',');
    if (this.rangeValues()[0] !== this.minPrice()) query.minPrice = this.rangeValues()[0];
    if (this.rangeValues()[1] !== this.maxPrice()) query.maxPrice = this.rangeValues()[1];
    if (this.selectedDiscountPercent() !== null)
      query.discountPercent = this.selectedDiscountPercent();

    this.router.navigate([], { queryParams: query });
  }

  updateFilters() {
    this.otherFiltersUpdateSubject.next();
  }

  clearFilters() {
    this.selectedCategories.set([]);
    this.selectedBrands.set([]);
    this.selectedDiscountPercent.set(null);

    const min = this.minPrice();
    const max = this.maxPrice();
    this.rangeValues.set([min, max]);

    this.router.navigate([], { queryParams: {} });
  }

  onCategoryChange(cat: string) {
    const current = this.selectedCategories();
    if (current.includes(cat)) {
      this.selectedCategories.set(current.filter((c) => c !== cat));
    } else {
      this.selectedCategories.set([...current, cat]);
    }
    this.updateFilters();
  }

  onBrandChange(brand: string) {
    const current = this.selectedBrands();
    if (current.includes(brand)) {
      this.selectedBrands.set(current.filter((b) => b !== brand));
    } else {
      this.selectedBrands.set([...current, brand]);
    }
    this.updateFilters();
  }

  onPriceChange(values: [number, number]) {
    this.priceUpdateSubject.next(values);

    this.rangeValues.set(values);
    this.applyFilter();
  }

  onDiscountChange(percent: number) {
    this.selectedDiscountPercent.set(percent);
    this.updateFilters();
  }

  private applyFilter() {
    let result = this.products();

    if (result.length === 0) {
      this.filteredProductsChange.emit([]);
      return;
    }

    // category filter
    if (this.selectedCategories().length) {
      result = result.filter((p) => this.selectedCategories().includes(p.category));
    }

    // brand filter
    if (this.selectedBrands().length) {
      result = result.filter((p) => this.selectedBrands().includes(p.brand));
    }

    // price filter
    const [minPrice, maxPrice] = this.rangeValues();
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // discount filter
    if (this.selectedDiscountPercent() !== null) {
      result = result.filter((p) => {
        const discountPercent = Math.round((100 * (p.price - p.discount_price)) / p.price);
        return discountPercent >= this.selectedDiscountPercent()!;
      });
    }

    this.filteredProductsChange.emit(result);
  }
}
