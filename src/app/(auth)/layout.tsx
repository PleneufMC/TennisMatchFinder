import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header simple */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="TMF Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-bold text-xl text-green-600">TennisMatchFinder</span>
          </Link>
        </div>
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer simple */}
      <footer className="border-t py-4">
        <div className="container flex justify-center px-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TennisMatchFinder. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
