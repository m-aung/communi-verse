import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ShoppingCart } from 'lucide-react';
import type { CoinPackage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CoinPackageCardProps {
  coinPackage: CoinPackage;
}

export function CoinPackageCard({ coinPackage }: CoinPackageCardProps) {
  const { toast } = useToast();

  const handlePurchase = () => {
    toast({
      title: "Purchase Initiated",
      description: `You are about to purchase ${coinPackage.name}. (This is a demo)`,
      duration: 3000,
    });
    // Placeholder for actual purchase logic
  };

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
         {coinPackage.image && (
          <div className="relative h-40 w-full mb-4 rounded-t-md overflow-hidden bg-muted">
            <Image 
              src={coinPackage.image} 
              alt={coinPackage.name} 
              layout="fill" 
              objectFit="contain" 
              data-ai-hint="gold coins"
            />
          </div>
        )}
        <CardTitle className="font-headline text-xl flex items-center">
          <Coins className="mr-2 h-6 w-6 text-yellow-500" /> {coinPackage.name}
        </CardTitle>
        {coinPackage.description && <CardDescription>{coinPackage.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-2xl font-bold text-primary">{coinPackage.coins.toLocaleString()} Coins</p>
        <p className="text-lg text-foreground">${coinPackage.priceUSD.toFixed(2)}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePurchase} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <ShoppingCart className="mr-2 h-4 w-4" /> Buy Now
        </Button>
      </CardFooter>
    </Card>
  );
}
