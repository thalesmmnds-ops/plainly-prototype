# Plainly prototype

An early, clickable prototype of Plainly, a baby-gear guide for expecting and new parents. It is shared to collect feedback.

**Status:** draft. The verdicts and descriptions come from the Plainly guide and are still under review. Nothing here is medical or safety advice.

## What is in here

- `index.html`: the prototype (generated, do not edit by hand).
- `api/feedback.js`: a small Vercel function that emails feedback from the in-page form.
- `source/`: the template, the guide data (`items.json`) and the build script.
- `vercel.json`: keeps the site out of search engines.

## Change the prototype

Edit `source/template.html` (or the extras in `source/`), then run:

```
node source/build.js
```

Commit and push. Vercel redeploys on every push to `main`.

## Deploy on Vercel

1. In Vercel, choose Add New, then Project, and import this repository. No build settings are needed.
2. In Project Settings, then Environment Variables, add:
   - `RESEND_API_KEY`: an API key from resend.com
   - `FEEDBACK_TO`: the email address that should receive feedback
   - `FEEDBACK_FROM` (optional): a verified sender. Without it, Resend's test sender is used, and it can only email the Resend account owner.
3. Redeploy once so the variables apply.

Until the two required variables are set, the feedback form tells people that feedback is not switched on yet.
