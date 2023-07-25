import * as db from './gen/sqlc/querier'

export interface Env {
  D1_TEST: D1Database
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      await db.createOrg(env.D1_TEST, {
        id: 'example',
        displayName: 'Example Inc.',
      })
    } catch (error) {
      // console.log(error)
    }

    try {
      await db.createAccount(env.D1_TEST, {
        id: 'voluntas',
        displayName: 'V',
        email: 'v@example.com',
      })
    } catch (error) {
      // console.log(error)
    }

    try {
      await db.createOrgAccount(env.D1_TEST, {
        orgPk: 1,
        accountPk: 1,
      })
    } catch (error) {
      // console.log(error)
    }

    const r = await env.D1_TEST.prepare(
      'SELECT \
        account.pk, account.id, account.display_name, account.email, \
        org.pk, org.id, org.display_name \
       FROM account \
       JOIN org_account ON account.pk = org_account.account_pk \
       JOIN org ON org_account.org_pk = org.pk \
       WHERE org.id = $1 AND account.id = $2;',
    )
      .bind('example', 'voluntas')
      .raw()
    console.log('GetOrgAccountRaw: ', r)

    const r2 = await env.D1_TEST.prepare('INSERT INTO account_log (tag, data) VALUES ($1, $2);')
      .bind('debug', JSON.stringify({ a: 'b' }))
      .raw()
    console.log('CreateAccountLog: ', r2)

    const r4 = await env.D1_TEST.prepare(
      "SELECT json_extract(data, '$.a') AS a_value FROM account_log WHERE data IS NOT NULL;",
    ).raw()
    console.log('GetAccountLogRaw: ', r4)

    const r3 = await env.D1_TEST.prepare('SELECT * FROM account_log;').all()
    console.log('ListAccountLogs: ', r3)

    await db.listAccounts(env.D1_TEST)

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
