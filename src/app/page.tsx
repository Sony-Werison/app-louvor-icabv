import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/schedule');
  return null;
}
