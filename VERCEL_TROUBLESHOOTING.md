# Vercel Deployment Troubleshooting Guide

If your application shows a blank page or fails to load data on Vercel, please follow these steps.

## 1. Check Environment Variables (CRITICAL)
The most common cause for "it works locally but not on Vercel" is missing environment variables.

1. Go to your **Vercel Dashboard**.
2. Select your project (`teacher-report-app`).
3. Go to **Settings** > **Environment Variables**.
4. Ensure the following variables are present for the **Production** environment (checked icon under Production):

| Variable Name | Value Description |
|--------------|-------------------|
| `VITE_GOOGLE_SHEET_ID` | The ID of your Google Sheet |
| `VITE_GOOGLE_API_KEY` | Your Google Cloud API Key |
| `VITE_GOOGLE_WEBAPP_URL` | The URL of your Google Apps Script Web App |

> [!WARNING]
> If these are missing or only set for "Development", the app will crash or fail to load data in Production.

## 2. Check Build Logs
1. Go to **Deployments** tab in Vercel.
2. Click on the latest **Failed** or **Ready** deployment.
3. Click **Building** to expand the logs.
4. Look for any "Error" messages in red.

## 3. Check Browser Console
1. Open your live site: `https://teacher-s-report.vercel.app`
2. Right-click anywhere and select **Inspect** (or press F12).
3. Go to the **Console** tab.
4. Take a screenshot of any red errors you see and share them.
