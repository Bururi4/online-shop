import {Component, Input, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {environment} from "../../../../environments/environment";
import {CartType} from "../../../../types/cart.type";
import {CartService} from "../../../shared/services/cart.service";
import {ProductType} from "../../../../types/product.type";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {

  products: FavoriteType[] = [];
  serverStaticPath = environment.serverStaticPath;
  cart: CartType | null = null;
  @Input() product!: ProductType;
  count: number = 1;
  @Input() isLight: boolean = false;
  @Input() countInCart: number | undefined = 0;
  productSet: Set<string> = new Set<string>();
  countProductMap: Map<string, number> = new Map<string, number>();

  constructor(private favoriteService: FavoriteService,
              private cartService: CartService) {
  }

  ngOnInit(): void {
    if (this.countInCart && this.countInCart > 1) {
      this.count = this.countInCart;
    }

    this.favoriteService.getFavorites()
      .subscribe((data: FavoriteType[] | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }

        this.products = data as FavoriteType[];
        const products = data as FavoriteType[];
        const currentProductExists = this.product?.id ? products.find(item => item.id === this.product.id) : false;

        this.cartService.getCart()
          .subscribe((cartData: CartType | DefaultResponseType) => {
            if ((cartData as DefaultResponseType).error !== undefined) {
              throw new Error((cartData as DefaultResponseType).message);
            }

            this.cart = cartData as CartType;
            const cartDataResponse = cartData as CartType;

            cartDataResponse.items.forEach(item => {
              const isFavorite = products.some(product => product.id === item.product.id);
              if (isFavorite) {
                this.productSet.add(item.product.id);
              }
            });
          });
      });
  }

  removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .subscribe((data: DefaultResponseType) => {
        if (data.error) {
          //..
          throw new Error(data.message);
        }

        this.products = this.products.filter(item => item.id !== id);
      });
  }

  addToCart(id: string) {
    const count = this.countProductMap.get(id);

    this.cartService.updateCart(id, count ?? 1)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }

        this.setCart(id);
      });
  }

  setCart(id: string) {
    this.cartService.getCart()
      .subscribe((cartData: CartType | DefaultResponseType) => {
        if ((cartData as DefaultResponseType).error !== undefined) {
          throw new Error((cartData as DefaultResponseType).message);
        }

        this.cart = cartData as CartType;
        const isInCart = (cartData as CartType).items.some(item => item.product.id === id);
        if (isInCart) {
          this.productSet.add(id);
        }
      });
  }

  isInCart(id: string) {
    return this.productSet.has(id);
  }

  updateCount(id: string, count: number) {
    this.countProductMap.set(id, count);
  }
}
