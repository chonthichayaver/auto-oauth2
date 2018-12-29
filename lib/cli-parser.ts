import commander from 'commander'
const pjson = require('../package.json')

export type ParserOption = {
  /**
   * command line arguments.
   */
  argv?: string[]

  /**
   * OAuth client id
   */
  oauthClientId?: string

  /**
   * OAuth secret key
   */
  oauthSecretKey?: string
}

export class CliParser {
  oauthClientId?: string
  oauthSecretKey?: string

  /**
   * parse cli arguments.
   *
   * @param options parser options.
   * or
   * process.env.AAUTH_CLIENT_ID
   * process.env.AAUTH_SECRET_ID
   */
  constructor(options: ParserOption = {}) {
    this.oauthClientId = options.oauthClientId || process.env.AAUTH_CLIENT_ID
    this.oauthSecretKey = options.oauthSecretKey || process.env.AAUTH_SECRET_KEY
    if (options.argv && 0 < options.argv.length) {
      commander
        .version(pjson.version)
        .option('-c, --client-id [value]', 'OAuth Client ID')
        .option('-s, --secret-key [value]', 'OAuth Secret Key')
        .parse(options.argv)

      if (commander.clientId) {
        this.oauthClientId = commander.clientId
      }
      if (commander.secretKey) {
        this.oauthSecretKey = commander.secretKey
      }
    }
  }
}
