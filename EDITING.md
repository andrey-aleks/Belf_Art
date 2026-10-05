# Editing the Belfegor website

You can change the products, photos and texts of the website from your browser — no
software to install, works on a computer or a phone.

**Editor address:** https://andrey-aleks.github.io/Belf_Art/admin/

> ⚠️ **Everything you save is public, immediately and permanently.** The website's
> files are stored in a public GitHub repository: anyone can see every change ever made,
> including old versions of texts and photos, even after you delete them. Don't put
> anything private into the editor (home address, phone number, personal notes, drafts
> you don't want seen).

## One-time setup

You need a GitHub account and a "token" (a password that only works for the editor).

1. **Create a GitHub account** at https://github.com/signup. We recommend a *separate*
   account used only for this shop, not a personal one — the token below can access
   every repository the account can, so an account that only has this shop is safest.
2. **Hide your email address**: go to https://github.com/settings/emails and tick
   **"Keep my email addresses private"**. Every change you save is signed with your
   account, and without this your email address would be published with it.
3. **Turn on two-factor authentication** at https://github.com/settings/security.
4. **Send your GitHub username to the site owner** and accept the invitation email
   (or https://github.com/andrey-aleks/Belf_Art/invitations).
5. **Create the token:**
   1. Open https://github.com/settings/tokens/new (this is a *classic* token — GitHub's
      newer "fine-grained" tokens don't work for editing someone else's repository).
   2. **Note:** `Belfegor website editor`
   3. **Expiration:** 90 days. (When it expires, just create a new one the same way.)
   4. **Scopes:** tick **`repo`** only. Leave everything else unticked.
   5. Click **Generate token** and copy it (it starts with `ghp_`). You won't see it again.
6. Open the editor address above, click **Sign In Using Access Token**, and paste it.
   The browser remembers you, so sign out (from the account menu) on shared computers.

**Keep the token secret** — anyone who has it can change the website. Never send it by
message or email or paste it anywhere except the editor. If you think it leaked, delete
it at https://github.com/settings/tokens and create a new one.

## Editing

The editor has two sections:

- **Shop**
  - **Products** — every product, in the order shown on the site (drag the ═ handle to reorder).
    Each has a name and description (in every language), a price in EUR, a category,
    a "Sold out" switch, and photos (the first photo is shown in the product grid; all
    photos appear when a customer opens the product).
  - **Categories** — the tiles above the products (Necklaces, Chokers, …). To use a new
    category, add it here first, then pick it on the product.
- **Site**
  - **Page texts** — every text on the website, grouped by page. Keep things like `{name}` or `{n}` exactly as they are; the site fills
    them in automatically. Bracketed notes like `[Your City]` are placeholders waiting
    for real details.
  - **Page photos** — the big photo at the top of the shop, and the About page photo.

### Languages

The site is in English, Russian, Ukrainian and Polish. In the editor, **English is the
main language**: you add and remove products, change prices, categories and photos in
English, and the other languages follow automatically. For the other languages you only
edit the *texts* (names, descriptions, page texts). The editor shows English and one
other language side by side; switch the other language from the language menu above the
fields. Every text must be filled in for all four languages before you can save.

### Auto-translate

The editor can translate texts for you with Google's Gemini AI, for free (no credit card
needed).

**One-time setup — get a free Gemini key:**

1. Open https://aistudio.google.com/api-keys and sign in with a Google account.
2. A key is created for you automatically (if not, click **Create API key**). Copy it.
3. In the editor, click a **Translate** button (see below), choose **Google Gemini**, and
   paste the key when asked. The editor remembers it in this browser, so you only do
   this once per browser. (You can also change it later under **Settings**.)

**Translating:**

- **Translate** button at the top of a language's side — fills in **only the empty**
  texts of that language from English. Useful after adding a new product: write it in
  English, then switch to each other language and click Translate.
- **Translate** button on a single field — re-translates that one text, **replacing**
  what's there. Useful after changing an English text.

Machine translation is good but not perfect — read the result before saving, especially
names and anything with jewelry terms. Like the rest of the site, the texts you send for
translation are public anyway; Google may use what you send through a free key to
improve its products, so don't translate anything private. Keep the key private too —
anyone with it can use your free allowance. If it leaks, delete it on the page from
step 1 and create a new one.

### Publishing

Click **Save** to publish. The website updates about 1–2 minutes later (refresh the
page to see it).

### Photos

Upload photos straight from your phone or camera. The editor automatically shrinks
them and **removes hidden photo information** (such as the GPS location where the
photo was taken) before publishing. Please still avoid photos that show private things
in the background.

### If something looks wrong

Every save is checked automatically. If a check fails, GitHub emails **you** (the
person who saved), and the site owner sees a red ✗ on the change. Common causes: an
empty translation, or a product without a photo. Fix it in the editor and save again —
or ask the site owner, who can undo any change.
