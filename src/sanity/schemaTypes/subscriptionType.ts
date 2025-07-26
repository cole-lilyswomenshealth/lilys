// src/sanity/schemaTypes/subscriptionType.ts
import { defineField, defineType } from 'sanity'
import { CreditCardIcon, CalendarIcon } from '@heroicons/react/24/solid'

interface ValidationContext {
  document?: {
    hasVariants?: boolean;
    billingPeriod?: string;
    customBillingPeriodMonths?: number;
  };
}

export const subscriptionType = defineType({
  name: 'subscription',
  title: 'Subscription',
  type: 'document',
  icon: CreditCardIcon,
  groups: [
    {
      name: 'content',
      title: 'Content',
    },
    {
      name: 'pricing',
      title: 'Pricing',
    },
    {
      name: 'variants',
      title: 'Variants',
    },
    {
      name: 'seo',
      title: 'SEO',
    },
    {
      name: 'settings',
      title: 'Settings',
    },
  ],
  fields: [
    // Basic Information
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description: 'The name of the subscription plan',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'titleEs',
      title: 'Title (Spanish)',
      type: 'string',
      description: 'Spanish translation of the subscription plan name',
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly version of the title',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      group: 'seo',
    }),
    defineField({
      name: 'description',
      title: 'Description (English)',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Detailed description of the subscription plan',
      group: 'content',
    }),
    defineField({
      name: 'descriptionEs',
      title: 'Description (Spanish)',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Spanish translation of the subscription plan description',
      group: 'content',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'subscriptionCategory' }],
        },
      ],
      description: 'Categories this subscription belongs to',
      group: 'content',
    }),

    // FAQ Items
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            {
              name: 'question',
              title: 'Question (English)',
              type: 'string',
              validation: (Rule) => Rule.required()
            },
            {
              name: 'questionEs',
              title: 'Question (Spanish)',
              type: 'string'
            },
            {
              name: 'answer',
              title: 'Answer (English)',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required()
            },
            {
              name: 'answerEs',
              title: 'Answer (Spanish)',
              type: 'text',
              rows: 4
            }
          ],
          preview: {
            select: {
              title: 'question',
              subtitle: 'answer'
            },
            prepare({ title, subtitle }) {
              return {
                title: title || 'No question provided',
                subtitle: subtitle ? `${subtitle.substring(0, 60)}...` : 'No answer provided'
              };
            }
          }
        }
      ],
      description: 'Frequently asked questions specific to this subscription plan',
      group: 'content',
    }),

    // Features
    defineField({
      name: 'features',
      title: 'Features (English)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'feature',
          fields: [
            {
              name: 'featureText',
              title: 'Feature',
              type: 'string'
            }
          ],
          preview: {
            select: {
              title: 'featureText'
            }
          }
        }
      ],
      description: 'List of features included in this subscription (English)',
      group: 'content',
    }),
    defineField({
      name: 'featuresEs',
      title: 'Features (Spanish)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'feature',
          fields: [
            {
              name: 'featureText',
              title: 'Feature',
              type: 'string'
            }
          ],
          preview: {
            select: {
              title: 'featureText'
            }
          }
        }
      ],
      description: 'List of features included in this subscription (Spanish)',
      group: 'content',
    }),

    // Variants Support
    defineField({
      name: 'hasVariants',
      title: 'Has Variants',
      type: 'boolean',
      description: 'Enable if this subscription has multiple variants (e.g., different dosages)',
      initialValue: false,
      group: 'variants',
    }),
    defineField({
      name: 'variants',
      title: 'Subscription Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'variant',
          title: 'Variant',
          fields: [
            {
              name: 'title',
              title: 'Variant Title (English)',
              type: 'string',
              description: 'E.g., "Standard Dosage", "High Dosage", etc.',
              validation: (Rule) => Rule.required()
            },
            {
              name: 'titleEs',
              title: 'Variant Title (Spanish)',
              type: 'string',
              description: 'Spanish translation of the variant title',
            },
            {
              name: 'description',
              title: 'Variant Description (English)',
              type: 'text',
              description: 'Brief description of this variant',
            },
            {
              name: 'descriptionEs',
              title: 'Variant Description (Spanish)',
              type: 'text',
              description: 'Spanish translation of the variant description',
            },
            {
              name: 'dosageAmount',
              title: 'Dosage Amount',
              type: 'number',
              description: 'The amount of product included (e.g., number of doses)',
              validation: (Rule) => Rule.required().positive()
            },
            {
              name: 'dosageUnit',
              title: 'Dosage Unit',
              type: 'string',
              description: 'The unit of measurement (e.g., "tablets", "bottles")',
              validation: (Rule) => Rule.required()
            },
            {
              name: 'price',
              title: 'Variant Price',
              type: 'number',
              description: 'The actual price used for Stripe and calculations',
              validation: (Rule) => Rule.required().positive()
            },
            // NEW: Monthly Display Price for Variants
            {
              name: 'monthlyDisplayPrice',
              title: 'Monthly Display Price',
              type: 'number',
              description: 'Price to display as monthly equivalent (display only, not used for billing)',
            },
            {
              name: 'compareAtPrice',
              title: 'Compare At Price',
              type: 'number',
              description: 'Original price to show a discount (if applicable)',
            },
            {
              name: 'billingPeriod',
              title: 'Billing Period',
              type: 'string',
              options: {
                list: [
                  {title: '1 Month', value: 'monthly'},
                  {title: '3 Months', value: 'three_month'},
                  {title: '6 Months', value: 'six_month'},
                  {title: '1 Year', value: 'annually'},
                  {title: 'Other', value: 'other'}
                ],
              },
              validation: (Rule) => Rule.required()
            },
            {
              name: 'customBillingPeriodMonths',
              title: 'Custom Billing Period (in months)',
              type: 'number',
              description: 'If billing period is "Other", specify the number of months',
              validation: (Rule) => 
                Rule.custom((currentValue, context) => {
                  const parent = context.parent as any;
                  if (parent?.billingPeriod === 'other' && !currentValue) {
                    return 'Required when billing period is set to "Other"';
                  }
                  return true;
                })
            },
            {
              name: 'stripePriceId',
              title: 'Stripe Price ID',
              type: 'string',
              description: 'The ID of the corresponding price in Stripe',
            },
            {
              name: 'isDefault',
              title: 'Default Variant',
              type: 'boolean',
              description: 'Mark this as the default selected variant',
              initialValue: false
            },
            {
              name: 'isPopular',
              title: 'Popular Variant',
              type: 'boolean',
              description: 'Mark this variant as popular (shows badge)',
              initialValue: false
            },
            {
              name: 'subVariants',
              title: 'Sub-Variants',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'subVariant',
                  title: 'Sub-Variant',
                  fields: [
                    {
                      name: 'name',
                      title: 'Name (English)',
                      type: 'string',
                      description: 'Name of the sub-variant',
                      validation: (Rule) => Rule.required()
                    },
                    {
                      name: 'nameEs',
                      title: 'Name (Spanish)',
                      type: 'string',
                      description: 'Spanish translation of the sub-variant name'
                    },
                    {
                      name: 'stripePriceId',
                      title: 'Stripe Price ID',
                      type: 'string',
                      description: 'The ID of the corresponding price in Stripe for this sub-variant',
                      validation: (Rule) => Rule.required()
                    },
                    {
                      name: 'price',
                      title: 'Price',
                      type: 'number',
                      description: 'The price for this sub-variant',
                      validation: (Rule) => Rule.required().positive()
                    }
                  ],
                  preview: {
                    select: {
                      title: 'name',
                      price: 'price',
                      stripePriceId: 'stripePriceId'
                    },
                    prepare({ title, price, stripePriceId }) {
                      return {
                        title: title || 'Untitled Sub-Variant',
                        subtitle: `$${price} - ${stripePriceId || 'No Stripe ID'}`,
                        media: CreditCardIcon
                      };
                    }
                  }
                }
              ],
              description: 'Sub-variants for this variant (inherits billing period from parent variant)'
            }
          ],
          preview: {
            select: {
              title: 'title',
              price: 'price',
              monthlyDisplayPrice: 'monthlyDisplayPrice',
              period: 'billingPeriod',
              isDefault: 'isDefault',
              isPopular: 'isPopular'
            },
            prepare({ title, price, monthlyDisplayPrice, period, isDefault, isPopular }) {
              let subtitle = `$${price}`;
              
              // Show monthly display price if different from calculated
              if (monthlyDisplayPrice) {
                subtitle += ` (Display: $${monthlyDisplayPrice}/month)`;
              }
              
              switch (period) {
                case 'monthly': subtitle += ' monthly'; break;
                case 'three_month': subtitle += ' 3 months'; break;
                case 'six_month': subtitle += ' 6 months'; break;
                case 'annually': subtitle += ' year'; break;
                case 'other': subtitle += ' custom period'; break;
                default: subtitle += period || ' month';
              }
              
              let badgeText = '';
              if (isDefault) badgeText += '✓ Default ';
              if (isPopular) badgeText += '🔥 Popular ';
              
              return {
                title: title || 'Untitled Variant',
                subtitle: subtitle,
                media: CreditCardIcon,
                description: badgeText
              };
            }
          }
        }
      ],
      description: 'Different variants of this subscription (dosages, pricing options)',
      group: 'variants',
      validation: (Rule) => Rule.custom((variants, context) => {
        const typedContext = context as ValidationContext;
        const hasVariants = typedContext.document?.hasVariants;
        
        if (hasVariants && (!variants || variants.length === 0)) {
          return 'At least one variant is required when "Has Variants" is enabled';
        }
        
        if (variants && variants.length > 0) {
          const defaultVariants = variants.filter((v: any) => v.isDefault);
          if (defaultVariants.length > 1) {
            return 'Only one variant can be marked as default';
          }
        }
        
        return true;
      })
    }),

    // Base Pricing (for non-variant subscriptions)
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'The actual price used for Stripe and calculations (if no variants)',
      group: 'pricing',
      validation: (Rule) => Rule.custom((price, context) => {
        const typedContext = context as ValidationContext;
        const hasVariants = typedContext.document?.hasVariants;
        
        if (!hasVariants && (price === undefined || price === null)) {
          return 'Price is required when variants are not used';
        }
        
        return true;
      })
    }),
    // NEW: Monthly Display Price for Base Subscription
    defineField({
      name: 'monthlyDisplayPrice',
      title: 'Monthly Display Price',
      type: 'number',
      description: 'Price to display as monthly equivalent (display only, not used for billing)',
      group: 'pricing',
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare At Price',
      type: 'number',
      description: 'Original price to show a discount (if applicable)',
      group: 'pricing',
    }),
    defineField({
      name: 'billingPeriod',
      title: 'Billing Period',
      type: 'string',
      description: 'The billing period (if no variants)',
      options: {
        list: [
          {title: '1 Month', value: 'monthly'},
          {title: '3 Months', value: 'three_month'},
          {title: '6 Months', value: 'six_month'},
          {title: '1 Year', value: 'annually'},
          {title: 'Other', value: 'other'}
        ],
      },
      group: 'pricing',
      validation: (Rule) => Rule.custom((billingPeriod, context) => {
        const typedContext = context as ValidationContext;
        const hasVariants = typedContext.document?.hasVariants;
        
        if (!hasVariants && !billingPeriod) {
          return 'Billing period is required when variants are not used';
        }
        
        return true;
      })
    }),
    defineField({
      name: 'customBillingPeriodMonths',
      title: 'Custom Billing Period (in months)',
      type: 'number',
      description: 'If billing period is set to "Other", specify the number of months here',
      group: 'pricing',
      validation: (Rule) => 
        Rule.custom((currentValue, context) => {
          const typedContext = context as ValidationContext;
          const hasVariants = typedContext.document?.hasVariants;
          const billingPeriod = typedContext.document?.billingPeriod;
          
          if (!hasVariants && billingPeriod === 'other' && !currentValue) {
            return 'Required when billing period is set to "Other"';
          }
          return true;
        })
    }),
    defineField({
      name: 'isDefault',
      title: 'Default Subscription',
      type: 'boolean',
      description: 'Mark this as the default subscription to display prominently',
      initialValue: false,
      group: 'pricing',
    }),

    // Stripe Integration
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      description: 'The ID of the corresponding price in Stripe (if no variants)',
      group: 'settings',
    }),
    defineField({
      name: 'stripeProductId',
      title: 'Stripe Product ID',
      type: 'string',
      description: 'The ID of the corresponding product in Stripe',
      group: 'settings',
    }),

    // Status and Display Settings
    defineField({
      name: 'isFeatured',
      title: 'Featured Subscription',
      type: 'boolean',
      description: 'Whether to show this subscription in the featured section',
      initialValue: false,
      group: 'settings',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this subscription is currently available for purchase',
      initialValue: true,
      group: 'settings',
    }),

    // Images
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'The main product image used on detail pages and throughout the site',
      group: 'content',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Catalog Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Optimized image for display in subscription catalog cards (if different from main image)',
      group: 'content',
    }),

    // Soft Deletion
    defineField({
      name: 'isDeleted',
      title: 'Deleted',
      type: 'boolean',
      description: 'Soft deletion flag',
      initialValue: false,
      hidden: true,
      group: 'settings',
    }),

    // Coupon Settings
    defineField({
      name: 'allowCoupons',
      title: 'Allow Coupons',
      type: 'boolean',
      description: 'Enable coupon codes for this subscription plan',
      initialValue: true,
      group: 'settings',
    }),
    defineField({
      name: 'excludedCoupons',
      title: 'Excluded Coupons',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'coupon' }],
        },
      ],
      description: 'Specific coupons that should NOT work with this subscription',
      hidden: ({ document }) => !document?.allowCoupons,
      group: 'settings',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'billingPeriod',
      media: 'image',
      price: 'price',
      monthlyDisplayPrice: 'monthlyDisplayPrice',
      isDeleted: 'isDeleted',
      isFeatured: 'isFeatured',
      customPeriod: 'customBillingPeriodMonths',
      hasVariants: 'hasVariants',
      variants: 'variants'
    },
    prepare({title, subtitle, media, price, monthlyDisplayPrice, isDeleted, isFeatured, customPeriod, hasVariants, variants}) {
      let displayPeriod = subtitle;
      let displayPrice = price;
      
      if (hasVariants && variants && variants.length > 0) {
        const variantCount = variants.length;
        return {
          title: `${isDeleted ? `${title} (Deleted)` : title}${isFeatured ? ' ⭐' : ''}`,
          subtitle: `${variantCount} variant${variantCount > 1 ? 's' : ''}`,
          media,
        };
      }
      
      // Format subtitle for non-variant subscriptions
      if (subtitle === 'monthly') displayPeriod = 'monthly';
      else if (subtitle === 'three_month') displayPeriod = '3 months';
      else if (subtitle === 'six_month') displayPeriod = '6 months';
      else if (subtitle === 'annually') displayPeriod = 'annual';
      else if (subtitle === 'other' && customPeriod) displayPeriod = `${customPeriod} months`;
      
      let priceDisplay = `$${displayPrice}`;
      if (monthlyDisplayPrice) {
        priceDisplay += ` (Display: $${monthlyDisplayPrice}/month)`;
      }
      
      return {
        title: `${isDeleted ? `${title} (Deleted)` : title}${isFeatured ? ' ⭐' : ''}`,
        subtitle: `${priceDisplay} ${displayPeriod}`,
        media,
      };
    },
  },
});