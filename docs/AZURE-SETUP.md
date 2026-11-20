# Azure setup — deployment identity for Forge Fair

Goal: give the build a deployment identity it can use to create and update one App Service,
without handing over your own account. Everything below runs in the terminal — no portal clicking.

**Never paste a credential into chat.** Values go into the Secrets panel only.

---

## Step 1 — Open Azure Cloud Shell

Open <https://shell.azure.com> (or the `>_` icon in the portal). Pick **Bash** if asked.
It is already signed in as you and already has `az` and `jq`.

Check the subscription you want to bill:

```bash
az account show --query '{name:name, id:id, tenant:tenantId}' -o table
```

If that is not the right one: `az account set --subscription "<name or id>"`.

## Step 2 — One command that prints the four values

```bash
SUB=$(az account show --query id -o tsv)
az ad sp create-for-rbac --name forge-fair-deploy --role Contributor \
    --scopes /subscriptions/$SUB -o json \
  | jq --arg s "$SUB" '{AZURE_CLIENT_ID:.appId, AZURE_CLIENT_SECRET:.password,
                        AZURE_TENANT_ID:.tenant, AZURE_SUBSCRIPTION_ID:$s}'
```

The output is exactly what the Secrets panel asks for:

```json
{
  "AZURE_CLIENT_ID": "00000000-0000-0000-0000-000000000000",
  "AZURE_CLIENT_SECRET": "<long random string>",
  "AZURE_TENANT_ID": "00000000-0000-0000-0000-000000000000",
  "AZURE_SUBSCRIPTION_ID": "00000000-0000-0000-0000-000000000000"
}
```

Paste each value into the matching key in the Secrets panel. The client secret is shown
once — it cannot be read back later; if you lose it, run
`az ad sp credential reset --name forge-fair-deploy` and paste the new `password`.

This identity stays valid until you delete it, so redeploys need nothing from you.

### If it fails with a permission error

`Insufficient privileges to complete the operation` means your account may not create
service principals or subscription-level role assignments (common on student subscriptions).
Two things still work:

- **Narrower scope** — create the resource group first, then grant on it:
  ```bash
  az group create --name forge-fair-rg --location westeurope
  az ad sp create-for-rbac --name forge-fair-deploy --role Contributor \
      --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/forge-fair-rg -o json \
    | jq --arg s "$(az account show --query id -o tsv)" \
        '{AZURE_CLIENT_ID:.appId, AZURE_CLIENT_SECRET:.password, AZURE_TENANT_ID:.tenant, AZURE_SUBSCRIPTION_ID:$s}'
  ```
- **Short-lived token fallback** — no service principal at all:
  ```bash
  az account get-access-token --resource https://management.azure.com --query accessToken -o tsv
  ```
  Paste it as `AZURE_ACCESS_TOKEN` plus the `id` and `tenantId` from Step 1. It expires in
  about an hour, so it only covers a single deploy pass and must be re-issued afterwards.

## Step 3 — Optional, for the settlement proof anchor

If the settlement proof is anchored through zkVerify Kurier, add its key as well:

```
KURIER_API_KEY = <from the zkVerify Kurier dashboard>
```

Without it the app still plays and settles locally; only the external anchor is skipped.

---

## What happens next

The build creates a resource group, a Linux App Service plan (B1, always-on) and one Web App,
deploys the server, and verifies the public HTTPS endpoint answers. Redeploys reuse the same
identity.

## If something goes wrong

- **"Insufficient privileges to complete the operation"** → use one of the fallbacks in Step 2.
- **`Secret shows as hidden`** → the value is write-only; reset the credential and paste again.
- **Subscription not listed** → the student subscription may need re-activation at
  <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>;
  nothing in the build can work around that.
