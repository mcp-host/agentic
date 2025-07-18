import type { AdminDeployment } from '@agentic/platform-types'

import type { AdminConsumer } from './types'

// TODO: support custom auth providers
// const authProviders = ['github', 'google', 'spotify', 'linkedin', 'twitter']

export function updateOriginRequest(
  originRequest: Request,
  {
    deployment,
    consumer,
    cacheControl
  }: {
    deployment: AdminDeployment
    consumer?: AdminConsumer
    cacheControl?: string
  }
) {
  // originRequest.headers.delete('authorization')

  // for (const provider of authProviders) {
  //   const headerAccessToken = `x-${provider}-access-token`
  //   const headerRefreshToken = `x-${provider}-refresh-token`
  //   const headerAccessTokenSecret = `x-${provider}-access-token-secret`
  //   const headerId = `x-${provider}-id`
  //   const headerUsername = `x-${provider}-username`

  //   originRequest.headers.delete(headerAccessToken)
  //   originRequest.headers.delete(headerRefreshToken)
  //   originRequest.headers.delete(headerAccessTokenSecret)
  //   originRequest.headers.delete(headerId)
  //   originRequest.headers.delete(headerUsername)
  // }

  // Delete all Cloudflare headers since we want origin requests to be agnostic
  // to Agentic's choice of hosting provider.
  for (const headerKey of Object.keys(
    Object.fromEntries(originRequest.headers.entries())
  )) {
    if (headerKey.startsWith('cf-')) {
      originRequest.headers.delete(headerKey)
    }
  }

  originRequest.headers.delete('x-agentic-consumer')
  originRequest.headers.delete('x-agentic-user')
  originRequest.headers.delete('x-agentic-plan')
  originRequest.headers.delete('x-agentic-is-subscription-active')
  originRequest.headers.delete('x-agentic-subscription-status')
  originRequest.headers.delete('x-agentic-user-email')
  originRequest.headers.delete('x-agentic-user-username')
  originRequest.headers.delete('x-agentic-user-name')
  originRequest.headers.delete('x-agentic-user-created-at')
  originRequest.headers.delete('x-forwarded-for')

  if (consumer) {
    originRequest.headers.set('x-agentic-customer-id', consumer.id)

    originRequest.headers.set(
      'x-agentic-is-customer-subscription-active',
      consumer.isStripeSubscriptionActive.toString()
    )
    originRequest.headers.set(
      'x-agentic-customer-subscription-status',
      consumer.stripeStatus
    )

    originRequest.headers.set('x-agentic-user-id', consumer.user.id)
    originRequest.headers.set('x-agentic-user-email', consumer.user.email)
    originRequest.headers.set('x-agentic-user-username', consumer.user.username)
    originRequest.headers.set(
      'x-agentic-user-created-at',
      consumer.user.createdAt
    )
    originRequest.headers.set(
      'x-agentic-user-updated-at',
      consumer.user.updatedAt
    )

    if (consumer.plan) {
      originRequest.headers.set(
        'x-agentic-customer-subscription-plan',
        consumer.plan
      )
    }

    if (consumer.user.name) {
      originRequest.headers.set('x-agentic-user-name', consumer.user.name)
    }
  } else {
    originRequest.headers.set(
      'x-agentic-is-customer-subscription-active',
      'false'
    )
  }

  // TODO: this header is causing some random upstream cloudflare errors
  // https://support.cloudflare.com/hc/en-us/articles/360029779472-Troubleshooting-Cloudflare-1XXX-errors#error1000
  // originRequest.headers.set('x-forwarded-for', ip)

  if (cacheControl) {
    originRequest.headers.set('cache-control', cacheControl)
  }

  originRequest.headers.set('x-agentic-deployment-id', deployment.id)
  originRequest.headers.set(
    'x-agentic-deployment-identifier',
    deployment.identifier
  )
  originRequest.headers.set('x-agentic-proxy-secret', deployment._secret)
}
