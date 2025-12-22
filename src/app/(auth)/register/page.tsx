import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte TennisMatchFinder et rejoignez la communauté',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
