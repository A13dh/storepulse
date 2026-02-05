
"use client";

import { use } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function OrderConfirmationPage({ params }: { params: Promise<{ locale: string, subdomain: string }> }) {
    const { subdomain } = use(params);

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Commande Confirmée !</h1>
            <p className="text-gray-600 max-w-md">
                Merci pour votre achat. Vous recevrez un email de confirmation et un SMS avec les détails de livraison.
            </p>
            <div className="pt-6">
                <Link href={`/store/${subdomain}`}>
                    <Button variant="outline">Continuer vos achats</Button>
                </Link>
            </div>
        </div>
    );
}
