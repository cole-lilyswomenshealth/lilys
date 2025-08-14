import {CalendarIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const userAppointmentType = defineType({
  name: 'userAppointment',
  title: 'User Appointment',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'Supabase user ID',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'userEmail',
      title: 'User Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
    }),
    defineField({
      name: 'appointmentType',
      title: 'Appointment Type',
      type: 'reference',
      to: [{type: 'appointment'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'stripeSessionId',
      title: 'Stripe Session ID',
      type: 'string',
      description: 'Stripe payment session ID for this appointment',
    }),
    defineField({
      name: 'subscriptionId',
      title: 'Subscription ID',
      type: 'reference',
      to: [{type: 'userSubscription'}],
      description: 'Related subscription if this appointment is part of a subscription',
    }),
    defineField({
      name: 'isFromSubscription',
      title: 'From Subscription',
      type: 'boolean',
      description: 'Whether this appointment is from a subscription package',
      initialValue: false,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Scheduled', value: 'scheduled'},
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Completed', value: 'completed'},
          {title: 'Cancelled', value: 'cancelled'},
          {title: 'Rescheduled', value: 'rescheduled'},
          {title: 'No-Show', value: 'no-show'},
        ],
      },
      initialValue: 'scheduled',
    }),
    defineField({
      name: 'scheduledDate',
      title: 'Scheduled Date',
      type: 'datetime',
    }),
    defineField({
      name: 'completedDate',
      title: 'Completed Date',
      type: 'datetime',
    }),
    defineField({
      name: 'createdDate',
      title: 'Created Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
    }),
    defineField({
      name: 'qualiphyMeetingUrl',
      title: 'Qualiphy Meeting URL',
      type: 'url',
      description: 'URL for the Qualiphy meeting',
    }),
    defineField({
      name: 'qualiphyMeetingUuid',
      title: 'Qualiphy Meeting UUID',
      type: 'string',
      description: 'UUID of the Qualiphy meeting',
    }),
    defineField({
      name: 'qualiphyPatientExamId',
      title: 'Qualiphy Patient Exam ID',
      type: 'number',
      description: 'ID of the patient exam in Qualiphy',
    }),
    defineField({
      name: 'qualiphyExamId',
      title: 'Qualiphy Exam ID',
      type: 'number',
      description: 'ID of the exam in Qualiphy',
    }),
    defineField({
      name: 'qualiphyExamStatus',
      title: 'Qualiphy Exam Status',
      type: 'string',
      description: 'Status from Qualiphy API (Approved, Deferred, etc.)',
    }),
    defineField({
      name: 'qualiphyProviderName',
      title: 'Qualiphy Provider Name',
      type: 'string',
      description: 'Name of the provider from Qualiphy',
    }),
    defineField({
      name: 'isDeleted',
      title: 'Deleted',
      type: 'boolean',
      description: 'Soft deletion flag',
      initialValue: false,
      hidden: true, // Hide in the UI by default
    }),
  ],
  preview: {
    select: {
      title: 'userEmail',
      subtitle: 'status',
      date: 'scheduledDate',
      appointmentTitle: 'appointmentType.title',
      isDeleted: 'isDeleted',
    },
    prepare({title, subtitle, date, appointmentTitle, isDeleted}) {
      return {
        title: isDeleted ? `${title || 'No email'} (Deleted)` : (title || 'No email'),
        subtitle: `${appointmentTitle || 'Unknown type'} | ${subtitle || 'Unknown'} | ${
          date ? new Date(date).toLocaleString() : 'Not scheduled'
        }`,
        media: CalendarIcon
      }
    },
  },
})