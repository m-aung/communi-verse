import { CoinPackageCard } from '@/components/store/coin-package-card';
import type { CoinPackage } from '@/lib/types';

const mockCoinPackages: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    priceUSD: 0.99,
    description: 'A little boost to get you started.',
    image: 'https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-56ac-61f7-b2a1-2614308276f3/raw?se=2025-06-13T22%3A10%3A52Z&sp=r&sv=2024-08-04&sr=b&scid=ea8b6ac6-5ffd-59a7-8b70-f725f1ccf7ce&skoid=864daabb-d06a-46b3-a747-d35075313a83&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T20%3A59%3A45Z&ske=2025-06-14T20%3A59%3A45Z&sks=b&skv=2024-08-04&sig=n8M3rcujdH8CFZI5/IGuZ/frbCAfwWmoF1nSuG7s27s%3D',
  },
  {
    id: 'booster',
    name: 'Booster Bundle',
    coins: 550,
    priceUSD: 4.99,
    description: 'Great value for active users.',
    image: 'https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-56ac-61f7-b2a1-2614308276f3/raw?se=2025-06-13T22%3A10%3A52Z&sp=r&sv=2024-08-04&sr=b&scid=ea8b6ac6-5ffd-59a7-8b70-f725f1ccf7ce&skoid=864daabb-d06a-46b3-a747-d35075313a83&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T20%3A59%3A45Z&ske=2025-06-14T20%3A59%3A45Z&sks=b&skv=2024-08-04&sig=n8M3rcujdH8CFZI5/IGuZ/frbCAfwWmoF1nSuG7s27s%3D',
  },
  {
    id: 'mega-hoard',
    name: 'Mega Hoard',
    coins: 1200,
    priceUSD: 9.99,
    description: 'The best deal for true CommuniVerse fans!',
    image: 'https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-56ac-61f7-b2a1-2614308276f3/raw?se=2025-06-13T22%3A10%3A52Z&sp=r&sv=2024-08-04&sr=b&scid=ea8b6ac6-5ffd-59a7-8b70-f725f1ccf7ce&skoid=864daabb-d06a-46b3-a747-d35075313a83&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T20%3A59%3A45Z&ske=2025-06-14T20%3A59%3A45Z&sks=b&skv=2024-08-04&sig=n8M3rcujdH8CFZI5/IGuZ/frbCAfwWmoF1nSuG7s27s%3D',
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
