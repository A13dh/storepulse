
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1132d4] rounded-lg"></div>
          <span className="text-xl font-bold">{t('title')}</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="#features" className="hover:text-[#1132d4]">{t('features')}</Link>
          <Link href="#pricing" className="hover:text-[#1132d4]">{t('pricing')}</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link href="/signup">
            <Button>Commencer</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup?role=STORE_OWNER">
              <Button size="lg" className="w-full sm:w-auto h-12 text-base">
                {t('ctaCreate')}
              </Button>
            </Link>
            <Link href="/signup?role=AFFILIATE">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-base">
                {t('ctaAffiliate')}
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="py-20 bg-gray-50 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 text-[#1132d4] rounded-lg flex items-center justify-center mb-4 font-bold">1</div>
              <h3 className="text-xl font-bold mb-2">Créez en minutes</h3>
              <p className="text-gray-600">Lancez votre boutique sans compétences techniques. Choisissez un template et vendez.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 text-[#1132d4] rounded-lg flex items-center justify-center mb-4 font-bold">2</div>
              <h3 className="text-xl font-bold mb-2">Affiliation Native</h3>
              <p className="text-gray-600">Transformez vos clients en ambassadeurs avec notre système de commissions intégré.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 text-[#1132d4] rounded-lg flex items-center justify-center mb-4 font-bold">3</div>
              <h3 className="text-xl font-bold mb-2">Paiements Locaux</h3>
              <p className="text-gray-600">Acceptez Flouci et le Paiement à la livraison. Retraits simples pour les affiliés.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} StorePulse Tunisie. Tous droits réservés.
      </footer>
    </div>
  );
}
