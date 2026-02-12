import EventDetailClient from '@/components/EventDetailClient';

export const dynamicParams = true;

export function generateStaticParams() {
  // With output: 'export', we can't fetch during build
  // Return empty array - pages will be handled client-side
  return [];
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}

