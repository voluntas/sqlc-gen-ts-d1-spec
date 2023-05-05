import * as db from './gen/sqlc/querier'

export interface Env {
  D1_TEST: D1Database
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const result = await db.createOrg(env.D1_TEST, {
        id: 'example',
        displayName: 'Example Inc.',
      })
    } catch (error) {
      // console.log(error)
    }

    try {
      const result = await db.createAccount(env.D1_TEST, {
        id: 'voluntas',
        displayName: 'V',
        email: 'v@example.com',
      })
    } catch (error) {
      // console.log(error)
    }

    try {
      const result = await db.createOrgAccount(env.D1_TEST, {
        orgPk: 1,
        accountPk: 1,
      })
    } catch (error) {
      console.log(error)
    }

    const r = await env.D1_TEST.prepare(
      'SELECT \
        account.*, \
        org.* \
       FROM account \
       JOIN org_account ON account.pk = org_account.account_pk \
       JOIN org ON org_account.org_pk = org.pk \
       WHERE org.id = $1 AND account.id = $2;',
    )
      .bind('example', 'voluntas')
      .first()
    console.log('複雑なやつ', r)

    const result = await db.listAccounts(env.D1_TEST)

    const account = await db.getAccount(env.D1_TEST, {
      id: 'voluntas',
    })
    if (!account) {
      return new Response('Not Found', { status: 404 })
    }

    return new Response(JSON.stringify(account), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  },
}
