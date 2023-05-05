import * as db from './gen/sqlc/querier'

export interface Env {
  D1_TEST: D1Database
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const result = await db.createAccount(env.D1_TEST, {
        id: 'voluntas',
        displayName: 'V',
        email: 'v@example.com',
      })
    } catch (error) {
      // console.log(error)
    }

    const result = await db.listAccounts(env.D1_TEST)
    console.log(result)

    const account = await db.getAccount(env.D1_TEST, {
      id: 'voluntas'
    })
    if (!account) {
      return new Response('Not Found', { status: 404 })
    }
    console.log(account)

    return new Response(JSON.stringify(account), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  },
}
