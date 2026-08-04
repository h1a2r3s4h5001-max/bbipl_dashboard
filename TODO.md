# TODO - Fix OTP failure when served via Live Server

## Goal
Make the frontend automatically detect the Node backend (port 3001) when the
static pages are opened through Live Server (port 5500) so OTP emails are sent
via the real SMTP server instead of falling back to demo mode.

## Steps
- [x] 1. Analyze root cause: `/api/status` hits Live Server (5500) -> 404; backend lives on 3001
- [x] 2. Get user approval on the plan
- [x] 3. Add API server URL detection (`_candidateUrls()` + `detectServer()`) in `js/email.js`
- [x] 4. Rewire `checkServerStatus()` to use the new detection
- [x] 5. Update `sendEmail()` to probe/detect the backend before sending OTP
- [x] 6. Update `js/settings.js` "Check Server Status" to use the same detection
- [x] 7. Start the Node backend (port 3001) and verify `/api/status` returns 200 configured

