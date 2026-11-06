# Implementation status

## Mobile client
- [x] 14-step UI navigation and green/white design system
- [x] Consent checkbox gate (local UI gate only)
- [x] Android camera capture integration via image picker for CNIC front, CNIC back and face
- [x] Manual CNIC field entry
- [x] Open SMS composer for recipient 7000
- [x] Explicit pending states for provider/backend-dependent checks
- [ ] OCR and CNIC consistency
- [ ] Real liveness and face comparison
- [ ] Android SMS User Consent API bridge
- [ ] API client and authenticated BFF contract
- [ ] Evidence upload and encrypted local lifecycle
- [ ] Server-recorded consent and verification polling

## Backend blockers
The separate KYC Go repository currently has session, status and consent endpoints, but its own README states that CNIC upload, OCR, face/liveness, SMS ingestion and final orchestration are not implemented. The service authentication is trusted service-to-service; never embed its bearer key in the app. The existing backend also still describes phone OTP as required evidence, conflicting with the approved mobile flow.

## Release policy
Never show "KYC Verified" based solely on a local step, local photo, pasted SMS, OCR result, or UI state. Only show verified after the authoritative backend returns a verified status based on configured evidence providers.
