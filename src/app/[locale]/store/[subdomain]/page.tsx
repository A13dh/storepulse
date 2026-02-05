
"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function StorePage({ params }: { params: Promise<{ locale: string, subdomain: string }> }) {
    const { locale, subdomain } = use(params);
    const [products, setProducts] = useState<any[]>([]);
    const currentLocale = locale === 'ar' ? 'ar' : 'fr';

    useEffect(() => {
        setProducts([
            { id: '1', name: 'Céramique Artisanale', price: 45.5, image: 'placeholder' },
            { id: '2', name: 'Tapis Berbère', price: 120.0, image: 'placeholder' },
            { id: '3', name: 'Huile d\'Olive Bio', price: 25.0, image: 'placeholder' },
        ]);
    }, []);

    return (
        <div>
            <div className="relative bg-gray-900 text-white rounded-2xl overflow-hidden mb-12 h-64 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1132d4]/80 text-center flex flex-col items-center justify-center p-6">
                    <h2 className="text-3xl font-bold mb-2">Bienvenue chez {subdomain}</h2>
                    <p className="max-w-xl">Découvrez nos produits uniques fabriqués en Tunisie.</p>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-6">Produits Récents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow border-none shadow-sm">
                        <div className="aspect-square bg-gray-100 relative rounded-t-lg overflow-hidden">
                            <div className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform"></div>
                        </div>
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900">{product.name}</h4>
                            <p className="text-[#1132d4] font-bold mt-1">{formatCurrency(product.price, currentLocale)}</p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full bg-[#1132d4] hover:bg-blue-800">Ajouter au panier</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
