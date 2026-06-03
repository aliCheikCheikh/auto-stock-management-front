import { Component, inject, OnInit } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ActivatedRoute , RouterLink} from '@angular/router';
import { ProductStockSummary } from '../../models/product.model';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage implements OnInit {
  private readonly productsApi = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);

  summary: ProductStockSummary | null = null;



  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('productId');

    if (productId === null) {
      return;
    }

    this.productsApi.getProductStockSummary(productId).subscribe({
      next: (summary) => {
        this.summary = summary;
      }
    });
  }

}
