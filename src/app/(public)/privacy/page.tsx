import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - TennisMatchFinder',
  description: 'Politique de confidentialité et protection des données personnelles de TennisMatchFinder',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
      
      <p className="text-muted-foreground mb-8">
        Dernière mise à jour : 8 janvier 2026
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground">
            TennisMatchFinder s&apos;engage à protéger la vie privée de ses utilisateurs. Cette politique 
            de confidentialité explique comment nous collectons, utilisons et protégeons vos données 
            personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Responsable du traitement</h2>
          <p className="text-muted-foreground">
            Le responsable du traitement des données personnelles est :
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mt-2">
            <p className="text-muted-foreground">
              TennisMatchFinder<br />
              Email : <a href="mailto:privacy@tennismatchfinder.net" className="text-primary hover:underline">privacy@tennismatchfinder.net</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Données collectées</h2>
          
          <h3 className="text-xl font-medium mb-2">3.1 Données d&apos;identification</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone (optionnel)</li>
            <li>Photo de profil (optionnel)</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">3.2 Données de profil joueur</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Niveau auto-évalué</li>
            <li>Disponibilités</li>
            <li>Préférences de jeu (simple, double, surface)</li>
            <li>Club d&apos;appartenance</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">3.3 Données d&apos;activité</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Résultats de matchs</li>
            <li>Score ELO et historique</li>
            <li>Messages sur le forum et le chat</li>
            <li>Propositions de matchs</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">3.4 Données techniques</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Adresse IP</li>
            <li>Type de navigateur et appareil</li>
            <li>Données de cookies (voir notre Politique Cookies)</li>
            <li>Journaux de connexion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Finalités du traitement</h2>
          <p className="text-muted-foreground">Vos données sont utilisées pour :</p>
          
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Finalité</th>
                  <th className="text-left py-2 pr-4">Base légale</th>
                  <th className="text-left py-2">Durée de conservation</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4">Gestion de votre compte</td>
                  <td className="py-2 pr-4">Exécution du contrat</td>
                  <td className="py-2">Durée du compte + 3 ans</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Calcul du classement ELO</td>
                  <td className="py-2 pr-4">Exécution du contrat</td>
                  <td className="py-2">Durée du compte</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Suggestions d&apos;adversaires</td>
                  <td className="py-2 pr-4">Exécution du contrat</td>
                  <td className="py-2">Durée du compte</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Communications par email</td>
                  <td className="py-2 pr-4">Intérêt légitime</td>
                  <td className="py-2">Jusqu&apos;à désinscription</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Amélioration du service</td>
                  <td className="py-2 pr-4">Intérêt légitime</td>
                  <td className="py-2">26 mois (anonymisé)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Facturation (Premium)</td>
                  <td className="py-2 pr-4">Obligation légale</td>
                  <td className="py-2">10 ans</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Partage des données</h2>
          <h3 className="text-xl font-medium mb-2">5.1 Au sein du club</h3>
          <p className="text-muted-foreground">
            Les autres membres de votre club peuvent voir votre profil, votre classement ELO, 
            vos statistiques et vos messages publics.
          </p>

          <h3 className="text-xl font-medium mb-2 mt-4">5.2 Sous-traitants</h3>
          <p className="text-muted-foreground">Nous travaillons avec les prestataires suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li><strong>Neon</strong> (hébergement base de données) - États-Unis (Privacy Shield)</li>
            <li><strong>Netlify</strong> (hébergement web) - États-Unis (Privacy Shield)</li>
            <li><strong>Stripe</strong> (paiements) - États-Unis (Privacy Shield)</li>
            <li><strong>Pusher</strong> (notifications temps réel) - Royaume-Uni</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">5.3 Autres cas</h3>
          <p className="text-muted-foreground">
            Nous ne vendons jamais vos données. Nous pouvons les transmettre en cas d&apos;obligation 
            légale (réquisition judiciaire) ou pour protéger nos droits.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Vos droits</h2>
          <p className="text-muted-foreground">Conformément au RGPD, vous disposez des droits suivants :</p>
          
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit d&apos;accès</h4>
              <p className="text-sm text-muted-foreground">Obtenir une copie de vos données</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit de rectification</h4>
              <p className="text-sm text-muted-foreground">Corriger vos données inexactes</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit à l&apos;effacement</h4>
              <p className="text-sm text-muted-foreground">Supprimer vos données personnelles</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit à la limitation</h4>
              <p className="text-sm text-muted-foreground">Restreindre le traitement</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit à la portabilité</h4>
              <p className="text-sm text-muted-foreground">Récupérer vos données dans un format standard</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-1">Droit d&apos;opposition</h4>
              <p className="text-sm text-muted-foreground">Vous opposer à certains traitements</p>
            </div>
          </div>

          <p className="text-muted-foreground mt-4">
            Pour exercer ces droits, contactez-nous à{' '}
            <a href="mailto:privacy@tennismatchfinder.net" className="text-primary hover:underline">
              privacy@tennismatchfinder.net
            </a>
            . Nous répondrons dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Sécurité des données</h2>
          <p className="text-muted-foreground">
            Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Chiffrement des données en transit (HTTPS/TLS)</li>
            <li>Chiffrement des données au repos</li>
            <li>Authentification sécurisée (magic links, pas de mots de passe stockés)</li>
            <li>Accès limité aux données sur le principe du besoin d&apos;en connaître</li>
            <li>Sauvegardes régulières</li>
            <li>Mises à jour de sécurité régulières</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Transferts internationaux</h2>
          <p className="text-muted-foreground">
            Certains de nos sous-traitants sont basés aux États-Unis. Ces transferts sont encadrés par :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Le Data Privacy Framework (successeur du Privacy Shield)</li>
            <li>Des clauses contractuelles types de la Commission européenne</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Mineurs</h2>
          <p className="text-muted-foreground">
            TennisMatchFinder est destiné aux personnes de 16 ans et plus. Si vous êtes parent ou tuteur 
            et pensez que votre enfant nous a fourni des données personnelles, contactez-nous pour les 
            faire supprimer.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Modifications</h2>
          <p className="text-muted-foreground">
            Nous pouvons mettre à jour cette politique de confidentialité. Les modifications importantes 
            vous seront notifiées par email. La date de dernière mise à jour est indiquée en haut de cette page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Réclamation</h2>
          <p className="text-muted-foreground">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation 
            auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              www.cnil.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question relative à cette politique de confidentialité ou à vos données personnelles :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Email : <a href="mailto:privacy@tennismatchfinder.net" className="text-primary hover:underline">privacy@tennismatchfinder.net</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
