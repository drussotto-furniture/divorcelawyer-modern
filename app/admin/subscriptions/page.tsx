import { redirect } from 'next/navigation'

export default function SubscriptionsPage() {
  // Redirect to subscription types by default
  redirect('/admin/subscriptions/types')
}



