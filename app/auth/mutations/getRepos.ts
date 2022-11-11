import { resolver, generateToken, hash256 } from "blitz"
import { createClient } from "redis"

function composeResponse(username, repos, cached) {
  return {
    username,
    repos,
    cached,
  }
}

import { RedisCommandArgument } from "@redis/client/dist/lib/commands"

const client = createClient({
  url: process.env.REDIS_ENDPOINT_URI,
  password: process.env.REDIS_PASSWORD,
})
let clientConnected = false

export default resolver.pipe(async () => {
  try {
    const username = "crondinini"
    if (!username) {
      throw new Error()
    }

    if (!clientConnected) {
      await client.connect()
      clientConnected = true
    }

    if (client) {
      const cacheHit = await client.get(username)
      console.log("cacheHit", cacheHit)
      if (cacheHit) {
        return composeResponse(username, cacheHit, true)
      }
    }

    const response = await fetch(`https://api.github.com/users/${username}`)

    const data = await response.json()

    const repos = data.public_repos

    if (!isNaN(repos)) {
      if (client) {
        console.log("setting")
        client.SETEX(username as RedisCommandArgument, 3600, JSON.stringify(repos))
      }
      return composeResponse(username, repos, false)
    } else {
      return {}
    }
  } catch (err) {
    throw err
  }
})
