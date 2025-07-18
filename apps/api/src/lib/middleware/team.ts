import { assert } from '@agentic/platform-core'
import { createMiddleware } from 'hono/factory'

import type { AuthenticatedHonoEnv } from '@/lib/types'
import { and, db, eq, schema } from '@/db'
import { aclTeamMember } from '@/lib/acl-team-member'

// TODO: Instead of accepting `teamId` query param, change the authenticate
// middleware to accept a different JWT payload and then use that to
// determine the intended user and/or team.

export const team = createMiddleware<AuthenticatedHonoEnv>(
  async function teamMiddleware(ctx, next) {
    const teamId = ctx.req.query('teamId')
    const userId = ctx.get('userId')

    if (teamId && userId) {
      const teamMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(schema.teamMembers.teamId, teamId),
          eq(schema.teamMembers.userId, userId)
        )
      })
      assert(teamMember, 403, 'Unauthorized')

      await aclTeamMember(ctx, { teamMember })

      ctx.set('teamMember', teamMember)
    }

    await next()
  }
)
