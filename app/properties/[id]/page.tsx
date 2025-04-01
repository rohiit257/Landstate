import { supabase } from '@/lib/supabase';
import PropertyDetails from './property-details';

// This function is required for static site generation
export async function generateStaticParams() {
  const { data: properties } = await supabase
    .from('properties')
    .select('id');

  return (properties || []).map((property) => ({
    id: property.id,
  }));
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  return <PropertyDetails id={params.id} />;
}