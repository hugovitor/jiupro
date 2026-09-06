/** Longest-prefix AWS IPv6 → region, for rewriting Direct hosts to the Session pooler. */
const AWS_IPV6: [string, string][] = [
  ["2600:1f10:2000::/36", "us-east-1"],
  ["2600:1f10:4000::/36", "us-east-1"],
  ["2600:1f10:c000::/36", "us-east-1"],
  ["2600:1f11:4000::/36", "us-east-1"],
  ["2600:1f11:8000::/36", "us-east-1"],
  ["2600:1f12:4000::/36", "us-east-1"],
  ["2600:1f12:c000::/36", "us-east-1"],
  ["2600:1f18::/33", "us-east-1"],
  ["2600:1f13:c000::/36", "us-east-2"],
  ["2600:1f14:c000::/36", "us-east-2"],
  ["2600:1f16:8000::/36", "us-east-2"],
  ["2600:1f16::/34", "us-east-2"],
  ["2600:1f1c::/36", "us-west-1"],
  ["2600:1f2c::/36", "us-west-1"],
  ["2600:1f11:c000::/36", "us-west-2"],
  ["2600:1f12:8000::/36", "us-west-2"],
  ["2600:1f13::/36", "us-west-2"],
  ["2600:1f14:8000::/36", "us-west-2"],
  ["2600:1f14::/34", "us-west-2"],
  ["2600:1f11::/36", "ca-central-1"],
  ["2600:1f1e:2000::/36", "ca-central-1"],
  ["2600:1f1e::/36", "sa-east-1"],
  ["2600:1f2e::/36", "sa-east-1"],
  ["2a05:d018::/35", "eu-west-1"],
  ["2a05:d028::/36", "eu-west-1"],
  ["2a05:d01c::/35", "eu-west-2"],
  ["2a05:d017::/36", "eu-west-2"],
  ["2a05:d014::/35", "eu-central-1"],
  ["2a05:d012::/36", "eu-west-3"],
  ["2a05:d016::/36", "eu-north-1"],
  ["2406:da18::/35", "ap-southeast-1"],
  ["2406:da1c::/35", "ap-southeast-2"],
  ["2406:da14::/35", "ap-northeast-1"],
  ["2406:da12::/36", "ap-northeast-2"],
  ["2406:da1a::/35", "ap-south-1"],
  ["2406:da19::/36", "ap-southeast-3"],
  ["2406:da1e::/32", "ap-east-1"],
].slice()
  .sort((a, b) => Number(b[0].split("/")[1]) - Number(a[0].split("/")[1])) as [string, string][];

function expandIpv6(ip: string) {
  const [addr] = ip.split("%");
  const [head, tail] = addr.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const missing = 8 - headParts.length - tailParts.length;
  return [...headParts, ...Array(Math.max(0, missing)).fill("0"), ...tailParts]
    .map((part) => part.padStart(4, "0"))
    .join(":");
}

function ipv6ToBits(ip: string) {
  const full = expandIpv6(ip);
  let bits = "";
  for (const part of full.split(":")) {
    bits += parseInt(part, 16).toString(2).padStart(16, "0");
  }
  return bits;
}

export function awsRegionFromIpv6(ip: string): string | null {
  const bits = ipv6ToBits(ip);
  for (const [cidr, region] of AWS_IPV6) {
    const [net, size] = cidr.split("/");
    const n = Number(size);
    if (bits.startsWith(ipv6ToBits(net).slice(0, n))) return region;
  }
  return null;
}
