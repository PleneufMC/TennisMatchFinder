import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation - TennisMatchFinder',
  description: 'Conditions générales d\'utilisation de la plateforme TennisMatchFinder',
};

export default function TermsPage() {
  return (
    <div className="container max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Conditions Générales d&apos;Utilisation</h1>
      
      <p className="text-muted-foreground mb-8">
        Dernière mise à jour : 8 janvier 2026
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme 
            TennisMatchFinder, accessible à l&apos;adresse <a href="https://tennismatchfinder.net" className="text-primary hover:underline">tennismatchfinder.net</a>.
          </p>
          <p className="text-muted-foreground mt-2">
            TennisMatchFinder est une plateforme de mise en relation entre joueurs de tennis au sein de clubs privés, 
            proposant un système de classement ELO, des outils de matchmaking et des fonctionnalités communautaires.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Acceptation des CGU</h2>
          <p className="text-muted-foreground">
            L&apos;inscription et l&apos;utilisation de TennisMatchFinder impliquent l&apos;acceptation pleine et entière 
            des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Inscription et compte utilisateur</h2>
          <h3 className="text-xl font-medium mb-2">3.1 Conditions d&apos;inscription</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Être âgé d&apos;au moins 16 ans</li>
            <li>Fournir une adresse email valide</li>
            <li>Être membre ou invité d&apos;un club partenaire</li>
            <li>Fournir des informations exactes et à jour</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">3.2 Responsabilité du compte</h3>
          <p className="text-muted-foreground">
            Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les 
            activités effectuées depuis votre compte. Vous vous engagez à nous informer immédiatement de 
            toute utilisation non autorisée.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Services proposés</h2>
          <h3 className="text-xl font-medium mb-2">4.1 Services gratuits</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Création de profil joueur</li>
            <li>Accès au classement du club</li>
            <li>Suggestions d&apos;adversaires limitées</li>
            <li>Enregistrement de matchs</li>
            <li>Accès au forum en lecture</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-4">4.2 Services Premium (payants)</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Suggestions d&apos;adversaires illimitées</li>
            <li>Statistiques avancées et analytics</li>
            <li>Accès complet au forum</li>
            <li>Chat illimité</li>
            <li>Participation aux tournois et Box Leagues</li>
            <li>Export des données personnelles</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Système ELO et classement</h2>
          <p className="text-muted-foreground">
            Le système de classement ELO de TennisMatchFinder est propre à chaque club. Les points ELO sont 
            calculés selon un algorithme propriétaire qui prend en compte :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Le résultat du match</li>
            <li>L&apos;écart de niveau entre les joueurs</li>
            <li>La diversité des adversaires rencontrés</li>
            <li>L&apos;activité récente</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Le classement ELO n&apos;a aucune valeur officielle et ne peut être utilisé comme référence 
            pour des compétitions fédérales.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Règles de conduite</h2>
          <p className="text-muted-foreground">Les utilisateurs s&apos;engagent à :</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Respecter les autres membres et adopter un comportement fair-play</li>
            <li>Ne pas publier de contenu offensant, discriminatoire ou illégal</li>
            <li>Enregistrer des résultats de matchs véridiques</li>
            <li>Ne pas tenter de manipuler le système de classement</li>
            <li>Ne pas utiliser de moyens automatisés pour accéder à la plateforme</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Tout manquement à ces règles peut entraîner la suspension ou la suppression du compte.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble des éléments de TennisMatchFinder (marque, logo, design, algorithmes, code source) 
            est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation 
            non autorisée est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Responsabilité</h2>
          <p className="text-muted-foreground">
            TennisMatchFinder met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme, 
            mais ne peut garantir un fonctionnement sans interruption. Nous ne sommes pas responsables :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Des dommages directs ou indirects liés à l&apos;utilisation de la plateforme</li>
            <li>Du contenu publié par les utilisateurs</li>
            <li>Des blessures survenues lors de matchs organisés via la plateforme</li>
            <li>Des litiges entre utilisateurs</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Abonnement et paiement</h2>
          <h3 className="text-xl font-medium mb-2">9.1 Tarifs</h3>
          <p className="text-muted-foreground">
            Les tarifs des abonnements Premium sont affichés sur la page Tarifs. Ils peuvent être modifiés 
            à tout moment, les modifications s&apos;appliquant aux nouveaux abonnements uniquement.
          </p>

          <h3 className="text-xl font-medium mb-2 mt-4">9.2 Paiement</h3>
          <p className="text-muted-foreground">
            Les paiements sont effectués via Stripe, plateforme de paiement sécurisée. Nous ne stockons 
            pas vos données bancaires.
          </p>

          <h3 className="text-xl font-medium mb-2 mt-4">9.3 Droit de rétractation</h3>
          <p className="text-muted-foreground">
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne 
            s&apos;applique pas aux services numériques commencés avant la fin du délai de rétractation avec 
            l&apos;accord du consommateur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Modification des CGU</h2>
          <p className="text-muted-foreground">
            Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les utilisateurs 
            seront informés par email des modifications substantielles. La poursuite de l&apos;utilisation 
            de la plateforme vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Résiliation</h2>
          <p className="text-muted-foreground">
            Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre profil. 
            En cas d&apos;abonnement Premium actif, vous conserverez l&apos;accès aux fonctionnalités jusqu&apos;à 
            la fin de la période payée.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Droit applicable et litiges</h2>
          <p className="text-muted-foreground">
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;engagent 
            à rechercher une solution amiable. À défaut, les tribunaux de Monaco seront compétents.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Par email : <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">contact@tennismatchfinder.net</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
