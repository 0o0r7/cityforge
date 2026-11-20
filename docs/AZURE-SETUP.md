# Azure setup — service principal for Forge Fair

Goal: give the build a deployment identity it can use to create and update one App Service, without you
handing over your own account. You do four steps; the whole thing takes about six minutes.

**Never paste the secret value into chat.** It goes into the Secrets panel only.

---

## Step 1 — Create the app registration

Open: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

1. **New registration**
2. Name: `forge-fair-deploy`
3. Supported account types: *Accounts in this organizational directory only (single tenant)*
4. **Register**

On the overview page, copy these two values:

| Value | Where | Key name |
|---|---|---|
| Application (client) ID | Overview → *Application (client) ID* | `AZURE_CLIENT_ID` |
| Directory (tenant) ID | Overview → *Directory (tenant) ID* | `AZURE_TENANT_ID` |

## Step 2 — Create the client secret

In the same app registration: **Certificates & secrets → Client secrets → New client secret**

- Description: `forge-fair-deploy`
- Expires: 24 months (anything past 1 Dec works)

Copy the **Value** column immediately — it is shown once. The *Secret ID* is not the secret.

| Value | Key name |
|---|---|
| Secret **Value** | `AZURE_CLIENT_SECRET` |

## Step 3 — Give it permission to deploy

Open: https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade

1. Open your subscription
2. **Access control (IAM) → Add → Add role assignment**
3. Role: **Contributor**
4. Assign access to: *User, group, or service principal*
5. Search `forge-fair-deploy`, select it, **Review + assign**

**If that page refuses the assignment** (student subscriptions sometimes restrict subscription-level IAM),
do this instead — same effect, narrower:

1. Open https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups → **Create**
2. Resource group: `forge-fair-rg`, region: **West Europe**
3. Open `forge-fair-rg` → **Access control (IAM)** → add **Contributor** for `forge-fair-deploy`

Either way, tell me which one you used.

## Step 4 — Hand over the three values

Open the Secrets panel (Base44 → Secrets) and add:

```
AZURE_TENANT_ID      = <Directory (tenant) ID>
AZURE_CLIENT_ID      = <Application (client) ID>
AZURE_CLIENT_SECRET  = <secret Value>
```

Also add this one when you have it — it is the second hard dependency:

```
KURIER_API_KEY       = <from the zkVerify Kurier dashboard>
```

---

## What happens next

I create the App Service (Linux, B1, always-on), deploy the container, and verify the public HTTPS endpoint
answers. From then on every push redeploys — no manual step for you.

## If something goes wrong

- **"Insufficient privileges to complete the operation"** → use the resource-group fallback in Step 3.
- **Secret shows as "Value: hidden"** → create a new secret; the value cannot be retrieved twice.
- **Subscription not listed** → the student subscription may need to be re-activated at
  https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade; nothing here can work around it.
