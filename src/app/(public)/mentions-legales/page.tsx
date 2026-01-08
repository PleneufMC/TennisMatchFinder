import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales - TennisMatchFinder',
  description: 'Mentions légales et informations sur l\'éditeur de TennisMatchFinder',
};

export default function MentionsLegalesPage() {
  return (
    <div className="container max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>
      
      <p className="text-muted-foreground mb-8">
        Dernière mise à jour : 8 janvier 2026
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-muted-foreground">
              <strong>TennisMatchFinder</strong><br />
              Site web : <a href="https://tennismatchfinder.net" className="text-primary hover:underline">tennismatchfinder.net</a><br />
              Email : <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">contact@tennismatchfinder.net</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Directeur de la publication</h2>
          <p className="text-muted-foreground">
            Le directeur de la publication est le représentant légal de TennisMatchFinder.
          </p>
          <p className="text-muted-foreground mt-2">
            Contact : <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">contact@tennismatchfinder.net</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Hébergement</h2>
          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-muted-foreground">
              <strong>Netlify, Inc.</strong><br />
              512 2nd Street, Suite 200<br />
              San Francisco, CA 94107<br />
              États-Unis<br />
              Site web : <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.netlify.com</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble du contenu du site TennisMatchFinder, incluant mais sans s&apos;y limiter, 
            les textes, images, graphismes, logo, icônes, sons, logiciels, est la propriété 
            exclusive de TennisMatchFinder ou de ses partenaires.
          </p>
          <p className="text-muted-foreground mt-2">
            Toute reproduction, représentation, modification, publication, adaptation de tout 
            ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, 
            est interdite, sauf autorisation écrite préalable de TennisMatchFinder.
          </p>
          <p className="text-muted-foreground mt-2">
            Toute exploitation non autorisée du site ou de l&apos;un quelconque des éléments qu&apos;il 
            contient sera considérée comme constitutive d&apos;une contrefaçon et poursuivie 
            conformément aux dispositions du Code de la propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Marques</h2>
          <p className="text-muted-foreground">
            TennisMatchFinder et le logo TennisMatchFinder sont des marques de TennisMatchFinder. 
            Toute reproduction totale ou partielle de ces marques sans autorisation préalable 
            est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Limitation de responsabilité</h2>
          <p className="text-muted-foreground">
            TennisMatchFinder s&apos;efforce d&apos;assurer au mieux de ses possibilités l&apos;exactitude 
            et la mise à jour des informations diffusées sur son site. Cependant, 
            TennisMatchFinder ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité 
            des informations mises à disposition sur ce site.
          </p>
          <p className="text-muted-foreground mt-2">
            En conséquence, TennisMatchFinder décline toute responsabilité :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
            <li>pour tous dommages résultant d&apos;une intrusion frauduleuse d&apos;un tiers</li>
            <li>pour tous dommages, directs ou indirects, quelles qu&apos;en soient les causes, origines, natures ou conséquences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Liens hypertextes</h2>
          <p className="text-muted-foreground">
            Le site TennisMatchFinder peut contenir des liens hypertextes vers d&apos;autres sites. 
            TennisMatchFinder n&apos;exerce aucun contrôle sur ces sites et n&apos;assume aucune 
            responsabilité quant à leur contenu ou aux pratiques de protection des données 
            personnelles de ces tiers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Données personnelles</h2>
          <p className="text-muted-foreground">
            Pour toute information relative à la collecte et au traitement de vos données 
            personnelles, veuillez consulter notre{' '}
            <a href="/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
          <p className="text-muted-foreground">
            Pour toute information relative aux cookies utilisés sur ce site, veuillez 
            consulter notre{' '}
            <a href="/cookies" className="text-primary hover:underline">Politique de Cookies</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Droit applicable</h2>
          <p className="text-muted-foreground">
            Les présentes mentions légales sont régies par le droit français. En cas de 
            litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
            <li>Par email : <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">contact@tennismatchfinder.net</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
