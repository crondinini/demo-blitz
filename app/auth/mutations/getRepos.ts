import { resolver, generateToken, hash256 } from "blitz"
import { createClient } from "redis"

function composeResponse(username, repos, cached) {
  return {
    username,
    repos,
    cached,
  }
}

console.log("process.env.REDIS_ENDPOINT_URI", process.env.REDIS_ENDPOINT_URI)
const client = createClient({
  url: process.env.REDIS_ENDPOINT_URI,
})

export default resolver.pipe(async () => {
  try {
    const username = "crondinini"
    if (!username) {
      throw new Error()
    }

    console.log("client.isOpen", client.isOpen)
    if (!client.isOpen) {
      await client.connect()
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
        client.SETEX(username, 3600, JSON.stringify(repos))
      }
      return composeResponse(username, repos, false)
    } else {
      return {}
    }
  } catch (err) {
    throw err
  }
})
