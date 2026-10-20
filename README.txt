# OAuthPath

Live site: https://oauthpathv2.vercel.app/

This is my take-home for the Composio APM Integrations assignment. You look up an app and get a guide for setting up its OAuth app and getting it approved. Each guide says how hard it is, how long it takes, what can block you, and what an agent can do versus what a human has to do.

## How I built it
I used AI agents for the research and for most of the code. I decided the scope, the guide format and the evidence rules, and I kept the agents to those rules. The agents read the official docs for each app and wrote the guides. I did not register any real OAuth apps. Every guide is "docs read, not tried". Each guide says so.

## Run it
It is a plain static site. No build step, no backend.

    python3 -m http.server 8000

Then open http://localhost:8000. You can also push the folder to any static host.

## What is in it
- **13 guides.** Notion, Slack, HubSpot, Gmail, LinkedIn, Zoom, Dropbox, Asana, Shopify, Discord, GitHub, Atlassian (Jira and Confluence), and Microsoft (Outlook and Entra ID). I picked them because their setups are very different. Some are instant and self-serve. Some have install caps, gated access, or yearly security reviews.
- **Evidence labels.** Every claim in a guide is marked verified, inferred or unverified. Verified means an official page says it and the guide links that page. If I could not find a review time or a fee, the guide says "not found". It does not guess.
- **Directory of 334 apps.** This is a snapshot of Composio's list of managed (123) and bring-your-own (211) OAuth apps, taken on 2026-10-20 from https://docs.composio.dev/toolkits/managed-auth. You can filter it. Apps with a guide open it. For the rest there is a Generate button. Only 13 of the 334 are researched, and the page says that.
- **Live generation for any app.** The browser calls the Gemini API with the visitor's own key. The key stays in their browser (localStorage). There is no key in the site or in this repo.
  1. Gemini lists the official doc pages for the app.
  2. Gemini reads those pages (url_context) and writes the guide.
  3. The page checks which pages were really fetched. It keeps only those as sources. Any claim marked verified that no fetched page supports is changed to unverified.
  4. If fewer than 2 pages load, it tries once more with different pages.
  Generated guides are labelled "generated live, not reviewed". They can be shared as a link.

## Why I made it this way
1. **Evidence labels on every claim.** A developer should know the answer and how far to trust it.
2. **Difficulty is about waiting and gatekeepers, not code.** Most OAuth flows use the same code. What differs is review, caps and who is allowed in. So each guide leads with time, approval wait and blockers.
3. **Agent versus human is explicit.** An agent can draft config, policy text and code. A human has to own the accounts, domains, legal identity and any paid review.
4. **No backend.** A key-in-browser setup works on any host and keeps secrets out of the repo. The cost is that a visitor needs their own Gemini key to use live generation.
5. **13 guides, not 100.** The brief says the goal is 100 apps, but this take-home only needs a few varied apps and the live flow. I chose depth on hard cases over a large number of weak guides.

## What I checked, fixed, and could not verify
| Item | Result |
|---|---|
| Google verification times | Source says 2-3 business days (brand), 10 business days (sensitive), about 6 weeks (restricted). It says these are estimates. The guide says the same. |
| Google 100-user cap | Source says it lasts for the life of the project and cannot be reset. I added it as a blocker and advise separate test and production projects. |
| Slack rate limit | I first read this wrongly. It only hits commercially distributed, non-Marketplace apps created after 2025-05-29, and new installs of older ones. Internal apps and older installs are not affected. Fixed. |
| Slack Marketplace review time | Could not find a stated time. Marked unverified. |
| HubSpot active installs | Source says 3 to list, 60 for certification, counted as active installs. The guide uses active installs. |
| HubSpot review time | Not found. Marked unverified. |
| LinkedIn tiers | Source confirms Development and Standard tiers, legal organizations only, and a screencast for Standard. I did not check Sign In and Share access. Marked unverified. |
| Notion approval | No approval step in two official pages. Marked inferred, not verified. |
| Google security assessment price | Not stated. Marked unverified. |
| Zoom, Dropbox, Asana, Shopify, Discord, GitHub, Atlassian, Microsoft | Written from the official pages listed in each guide's sources. Verified only where a fetched page states it. Docs read only. |

## Live generation tests
- I tested it in a real browser with a free Gemini key. Asana: 1 of 3 pages loaded, and 4 claims were changed to unverified. Calendly: 1 of 4 pages loaded, 1 claim was changed to unverified, and the guide was thin but honest.
- Zoom was tested by script. The model suggested 4 doc URLs and none could be fetched. It had still marked claims as verified. That is why step 3 exists.
- gemini-2.5-flash is closed to new users. Google Search grounding was refused for a free key. url_context works. The default model is gemini-3.1-flash-lite and you can change it in settings.

## Limitations
- I did not create real provider apps or run real OAuth flows.
- Live generation needs the visitor's own Gemini key. Without one, only the 13 library guides work.
- Live results are only as good as the pages the model picks. For unfamiliar apps, many claims end up unverified.
- The agent does not try setup in provider consoles. That needs the developer's login.
- Review times are only given where a provider states them.
- Provider docs change. Each guide lists its sources, so check them before you rely on a guide.
