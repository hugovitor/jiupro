/** Vercel sets VERCEL_ENV on every deployment. Locally this is "development". */
export type DeploymentEnv = "production" | "preview" | "development";

export function deploymentEnv(): DeploymentEnv {
  const value = process.env.VERCEL_ENV?.trim();
  if (value === "production" || value === "preview") return value;
  return "development";
}

export function isPreviewDeployment() {
  return deploymentEnv() === "preview";
}

export function isProductionDeployment() {
  return deploymentEnv() === "production";
}
