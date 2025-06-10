import { CoinPackageCard } from '@/components/store/coin-package-card';
import type { CoinPackage } from '@/lib/types';

const mockCoinPackages: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    priceUSD: 0.99,
    description: 'A little boost to get you started.',
    image: 'https://placehold.co/300x200.png',
  },
  {
    id: 'booster',
    name: 'Booster Bundle',
    coins: 550,
    priceUSD: 4.99,
    description: 'Great value for active users.',
    image: 'https://placehold.co/300x200.png',
  },
  {
    id: 'mega-hoard',
    name: 'Mega Hoard',
    coins: 1200,
    priceUSD: 9.99,
    description: 'The best deal for true CommuniVerse fans!',
    image: 'https://placehold.co/300x200.png',
  },
];

export default function StorePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Coin Store</h1>
        <p className="text-muted-foreground">Purchase coins to enhance your CommuniVerse experience!</p>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCoinPackages.map((pkg) => (
            <CoinPackageCard key={pkg.id} coinPackage={pkg} />
          ))}
        </div>
      </section>
    </div>
  );
}
