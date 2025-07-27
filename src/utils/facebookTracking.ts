export async function trackSubscriptionPageView(eventSourceUrl: string): Promise<void> {
  try {
    await fetch('/api/facebook/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'ViewContent',
        eventSourceUrl,
        customData: {
          content_type: 'subscription_plans',
          content_category: 'telehealth',
          content_ids: ['weight_management', 'hair_loss', 'cycle_management']
        }
      }),
    });
  } catch (error) {
    console.warn('Facebook tracking failed:', error);
  }
}