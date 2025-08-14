// src/sanity/schemaTypes/index.ts (update to include coupon type)
import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {subscriptionType} from './subscriptionType'
import {subscriptionCategoryType} from './subscriptionCategoryType'
import {appointmentType} from './appointmentType'
import {userSubscriptionType} from './userSubscriptionType'
import {userAppointmentType} from './userAppointmentType'
import {couponType} from './couponType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType, 
    categoryType, 
    postType, 
    authorType, 
    subscriptionType,
    subscriptionCategoryType,
    appointmentType,
    userSubscriptionType,
    userAppointmentType,
    couponType
  ],
}