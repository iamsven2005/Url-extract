export const resolveIpAddress = async (hostname: string): Promise<{ ip?: string; error?: string }> => {
  try {
    // Using Google's DNS-over-HTTPS API
    const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`)
    const data = await response.json()

    if (data.Answer && data.Answer.length > 0) {
      // Get the first A record
      const aRecord = data.Answer.find((record: any) => record.type === 1)
      if (aRecord) {
        return { ip: aRecord.data }
      } else {
        return { error: "No A record found" }
      }
    } else {
      return { error: "No DNS records found" }
    }
  } catch (error) {
    return { error: "Failed to resolve" }
  }
}

export const resolveUrlIp = async (url: string): Promise<{ ip?: string; error?: string }> => {
  try {
    const hostname = new URL(url).hostname
    return await resolveIpAddress(hostname)
  } catch (error) {
    return { error: "Invalid URL" }
  }
}
