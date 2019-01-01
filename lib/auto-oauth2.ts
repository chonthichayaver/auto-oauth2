import { CliParserOption } from './cli-parser'
import ClientOauth2 from 'client-oauth2'
import fs from 'fs'
import readline from 'readline'
import { exec } from 'child_process'

const DEFAULT_TOKEN_FILE_PATH = './.accesstoken.json'

export type AutoOauthOptions = CliParserOption & {
  authorizeUri: string
  redirectUri: string
  accessTokenUri: string
  responseType?: 'code' | 'token' | 'code_and_token'
  scopes: string[]
  noGui?: boolean
  platform?: string
  tokenSavePath?: string
}

export type AccessToken = {
  access_token: string
  expires_in?: number
  refresh_token?: string
}

export class AutoOauth2 {
  private accessToken?: AccessToken
  private auth2: ClientOauth2
  private tokenFilePath: string
  constructor(private options: AutoOauthOptions) {
    this.auth2 = new ClientOauth2({
      clientId: this.options.oauthClientId,
      clientSecret: this.options.oauthSecretKey,
      accessTokenUri: this.options.accessTokenUri,
      authorizationUri: this.options.authorizeUri,
      redirectUri: this.options.redirectUri,
      scopes: this.options.scopes
    })
    this.tokenFilePath = this.options.tokenSavePath || DEFAULT_TOKEN_FILE_PATH
    this.options.platform = this.options.platform || process.platform
  }

  async autoAuthorize(): Promise<AccessToken> {
    this.accessToken = await this.loadAccessToken()
    if (this.accessToken) {
      return this.accessToken
    }

    const code = await this.requestAuthorizeCode()
    await this.requestAccessToken(code)

    return { access_token: 'access_token', refresh_token: 'refresh_token', expires_in: 3000 }
  }

  /**
   * load access token from file.
   */
  private async loadAccessToken() {
    if (fs.existsSync(this.tokenFilePath)) {
      return JSON.parse(fs.readFileSync(this.tokenFilePath).toString()) as AccessToken
    }
    return undefined
  }

  /**
   * open authorize uri.
   */
  private async requestAuthorizeCode() {
    const uri = this.auth2.code.getUri({
      query: { response_type: this.options.responseType! }
    })

    const code = await new Promise((resolve, reject) => {
      const rl = readline.createInterface(process.stdin, process.stdout)
      if (!this.options.noGui) {
        switch (this.options.platform) {
          case 'darwin': {
            // mac only
            exec(`open '${uri}'`)
            break
          }
        }
      }
      console.log(`open authorize uri: ${uri}`)
      rl.question('input code: ', code => {
        if (!code) {
          return reject(Error('empty code.'))
        }
        console.log(`code: ${code}`)
        resolve(code)
      })
    })

    return code as string
  }

  private async requestAccessToken(code: string) {
    const token = await this.auth2.token.getToken(this.options.redirectUri, { body: { code } })
    // const token = await this.auth2.code.getToken(this.options.accessTokenUri, { body: { code } })
    console.log('receive access token:', token)
    return this.saveAccessToken(token)
  }

  private saveAccessToken(token: ClientOauth2.Token) {
    const accessToken: AccessToken = {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expires_in: Number(token.data.expires_in)
    }
    fs.writeFileSync(this.tokenFilePath, accessToken)
    return accessToken
  }
}