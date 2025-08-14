// src/sanity/structure.ts
import type { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Blog content
      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('category').title('Categories'),
              S.documentTypeListItem('author').title('Authors'),
            ])
        ),
      
      
      // Subscriptions & Appointments
      S.listItem()
        .title('Subscriptions')
        .child(
          S.list()
            .title('Subscriptions')
            .items([
              S.documentTypeListItem('subscription').title('Subscription Plans'),
              S.documentTypeListItem('subscriptionCategory').title('Subscription Categories'),
              S.documentTypeListItem('userSubscription').title('User Subscriptions'),
              S.divider(),
              S.listItem()
                .title('Coupons & Discounts')
                .child(
                  S.list()
                    .title('Coupons & Discounts')
                    .items([
                      S.documentTypeListItem('coupon').title('All Coupons'),
                      S.divider(),
                      S.listItem()
                        .title('Active Coupons')
                        .child(
                          S.documentList()
                            .title('Active Coupons')
                            .filter('_type == "coupon" && isActive == true')
                        ),
                      S.listItem()
                        .title('Expired Coupons')
                        .child(
                          S.documentList()
                            .title('Expired Coupons')
                            .filter('_type == "coupon" && validUntil < now()')
                        ),
                      S.listItem()
                        .title('Usage Reports')
                        .child(
                          S.documentList()
                            .title('Coupon Usage Reports')
                            .filter('_type == "coupon"')
                        ),
                    ])
                ),
            ])
        ),
        
      S.listItem()
        .title('Appointments')
        .child(
          S.list()
            .title('Appointments')
            .items([
              S.documentTypeListItem('appointment').title('Appointment Types'),
              S.documentTypeListItem('userAppointment').title('User Appointments'),
            ])
        ),
      
      // Other content types
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && ![
          'post', 'category', 'author', 
          'subscription', 'subscriptionCategory', 'appointment', 
          'userSubscription', 'userAppointment', 'coupon'
        ].includes(item.getId()!),
      ),
    ])