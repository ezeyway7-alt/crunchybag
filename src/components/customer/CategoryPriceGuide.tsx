import React from 'react';
import { productPriceSummary } from '../../lib/menuPricing';
import { productPath } from '../../lib/productRoutes';
import { Product } from '../../types';

export function CategoryPriceGuide({ name, products }: { name: string; products: Product[] }) {
  if (!products.length) return null;
  return <details className="border border-zinc-800 rounded-sm p-4 text-sm">
    <summary className="cursor-pointer font-semibold text-zinc-200">Compare {name.toLowerCase()} prices, portions &amp; extras</summary>
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left text-zinc-400">
        <caption className="text-left mb-3">Listed base prices in Nepalese rupees. Portion choices and extras may change the total; check your selected options before ordering.</caption>
        <thead><tr><th scope="col" className="p-2">Food</th><th scope="col" className="p-2">Base price</th><th scope="col" className="p-2">Portion options</th></tr></thead>
        <tbody>{products.map(product => {
          const price = productPriceSummary(product);
          return <tr key={product.id} className="border-t border-zinc-800"><th scope="row" className="p-2 font-normal"><a className="text-amber-400" href={productPath(product)}>{price.name}</a></th><td className="p-2 whitespace-nowrap">{price.base || 'Check item'}</td><td className="p-2">{price.variants.map((variant: any) => `${variant.name}: ${variant.price}`).join('; ') || 'See item for available choices'}</td></tr>;
        })}</tbody>
      </table>
    </div>
    <p className="mt-3 text-zinc-400">Delivery across Kathmandu, Lalitpur and Bhaktapur is charged separately. <a className="text-amber-400" href="/delivery">Delivery details</a> · <a className="text-amber-400" href="/takeaway">24/7 takeaway in Imadol</a></p>
  </details>;
}
