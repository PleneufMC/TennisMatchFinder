import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Cookies - TennisMatchFinder',
  description: 'Politique d\'utilisation des cookies sur TennisMatchFinder',
};

export default function CookiesPage() {
  return (
    <div className="container max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politique de Cookies</h1>
      
      <p className="text-muted-foreground mb-8">
        Dernière mise à jour : 8 janvier 2026
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p className="text-muted-foreground">
            Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) 
            lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et 
            préférences pendant une période donnée.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Cookies utilisés par TennisMatchFinder</h2>
          
          <h3 className="text-xl font-medium mb-4">2.1 Cookies essentiels (strictement nécessaires)</h3>
          <p className="text-muted-foreground mb-4">
            Ces cookies sont indispensables au fonctionnement du site. Ils ne peuvent pas être désactivés.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Nom</th>
                  <th className="text-left py-2 pr-4">Finalité</th>
                  <th className="text-left py-2 pr-4">Durée</th>
                  <th className="text-left py-2">Fournisseur</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-sm">next-auth.session-token</td>
                  <td className="py-2 pr-4">Authentification et session utilisateur</td>
                  <td className="py-2 pr-4">30 jours</td>
                  <td className="py-2">TennisMatchFinder</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-sm">next-auth.csrf-token</td>
                  <td className="py-2 pr-4">Protection contre les attaques CSRF</td>
                  <td className="py-2 pr-4">Session</td>
                  <td className="py-2">TennisMatchFinder</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-sm">next-auth.callback-url</td>
                  <td className="py-2 pr-4">Redirection après connexion</td>
                  <td className="py-2 pr-4">Session</td>
                  <td className="py-2">TennisMatchFinder</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">__stripe_mid</td>
                  <td className="py-2 pr-4">Prévention de la fraude aux paiements</td>
                  <td className="py-2 pr-4">1 an</td>
                  <td className="py-2">Stripe</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-medium mb-4 mt-8">2.2 Cookies fonctionnels</h3>
          <p className="text-muted-foreground mb-4">
            Ces cookies permettent d&apos;améliorer les fonctionnalités du site et de personnaliser votre expérience.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Nom</th>
                  <th className="text-left py-2 pr-4">Finalité</th>
                  <th className="text-left py-2 pr-4">Durée</th>
                  <th className="text-left py-2">Fournisseur</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-sm">theme</td>
                  <td className="py-2 pr-4">Préférence de thème (clair/sombre)</td>
                  <td className="py-2 pr-4">1 an</td>
                  <td className="py-2">TennisMatchFinder</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">pusher-*</td>
                  <td className="py-2 pr-4">Connexion temps réel pour le chat</td>
                  <td className="py-2 pr-4">Session</td>
                  <td className="py-2">Pusher</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-medium mb-4 mt-8">2.3 Cookies analytiques</h3>
          <p className="text-muted-foreground mb-4">
            <strong>Actuellement, TennisMatchFinder n&apos;utilise pas de cookies analytiques tiers</strong> 
            (Google Analytics, etc.). Si nous en ajoutons à l&apos;avenir, cette politique sera mise à jour 
            et votre consentement sera demandé.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Gestion des cookies</h2>
          
          <h3 className="text-xl font-medium mb-2">3.1 Via votre navigateur</h3>
          <p className="text-muted-foreground">
            Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies. 
            Voici les liens vers les instructions des principaux navigateurs :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/fr/kb/effacer-les-cookies-pour-supprimer-les-information" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Microsoft Edge
              </a>
            </li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">3.2 Conséquences du refus</h3>
          <p className="text-muted-foreground">
            Si vous désactivez les cookies essentiels, certaines fonctionnalités de TennisMatchFinder 
            ne fonctionneront pas correctement, notamment :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Vous ne pourrez pas rester connecté</li>
            <li>Le chat en temps réel peut ne pas fonctionner</li>
            <li>Les paiements peuvent échouer</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Durée de conservation</h2>
          <p className="text-muted-foreground">
            Les cookies de session sont supprimés lorsque vous fermez votre navigateur. 
            Les cookies persistants sont conservés pour la durée indiquée dans le tableau ci-dessus, 
            sauf si vous les supprimez manuellement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Cookies tiers</h2>
          <p className="text-muted-foreground">
            Certains cookies sont déposés par des services tiers que nous utilisons :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li>
              <strong>Stripe</strong> : pour sécuriser les paiements. 
              <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                Politique de confidentialité Stripe
              </a>
            </li>
            <li>
              <strong>Pusher</strong> : pour les fonctionnalités temps réel. 
              <a href="https://pusher.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                Politique de confidentialité Pusher
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Modifications de cette politique</h2>
          <p className="text-muted-foreground">
            Nous pouvons mettre à jour cette politique de cookies à tout moment. La date de dernière 
            mise à jour est indiquée en haut de cette page. En cas d&apos;ajout de cookies analytiques 
            ou publicitaires, nous vous demanderons votre consentement explicite.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question relative aux cookies, contactez-nous :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Email : <a href="mailto:privacy@tennismatchfinder.net" className="text-primary hover:underline">privacy@tennismatchfinder.net</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
