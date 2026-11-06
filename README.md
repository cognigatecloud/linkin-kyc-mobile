# Linkin KYC Mobile

Standalone Android-first React Native application for Linkin's identity-verification workflow.

## Architecture boundaries

- This repository contains the mobile client only.
- The existing Go KYC service and PostgreSQL database remain authoritative and are maintained in the separate `cognigatecloud/KYC` repository.
- Do not create or duplicate backend services, database migrations, or verification decisions here.
- Do not embed the KYC service bearer secret in the mobile app. The current KYC API contract is service-to-service authenticated; a trusted Linkin backend/BFF or another explicitly approved secure client-auth pattern must be resolved before direct mobile integration.
- Do not implement mobile-number OTP. The approved app flow uses user-originated CNIC SMS to 7000 and user-consented Android SMS User Consent capture. This is evidence supplied by the user, not cryptographic proof of NADRA origin.
- The backend remains authoritative for verification outcomes. The client must never independently declare a user verified.

## Approved 14-screen flow

1. Splash
2. Welcome / Introduction
3. Permissions and Privacy
4. CNIC Front Capture
5. CNIC Back Capture
6. CNIC Details Review
7. Face Capture
8. Liveness Check
9. Face Verification
10. NADRA SMS Instructions
11. Waiting / Fetch SMS
12. NADRA Response
13. Verification Processing
14. KYC Completion

No Linkin registration/login, mobile OTP, provider tools, or unrelated app functionality belongs in this standalone client.

## Design direction

Use the approved green-and-white reference:
- white canvas and dark text
- green primary actions and success indicators
- light-green secondary surfaces
- consistent spacing, typography, cards, and buttons
- clear document camera framing and guidance
- restrained motion and accessible interaction states

## Proposed implementation stack

React Native + TypeScript, Android-first; React Navigation; Axios; TanStack Query; React Hook Form; React Native Vision Camera; on-device OCR; Kotlin bridge for Google Play services SMS User Consent; secure session storage; Jest and React Native Testing Library.

Package versions and native integration choices must be checked for compatibility when the React Native application is initialized. Avoid unnecessary dependencies.

## Milestones

1. Repository and environment inspection; API contract review; React Native foundation; navigation and design system; Android build.
2. Screens 1–6.
3. Screens 7–9.
4. Screens 10–12 and Kotlin SMS User Consent integration.
5. Screens 13–14 and pending/error/retry states.
6. End-to-end testing against the existing backend and real Android devices.

## Existing KYC API contract — known limitations

The current `cognigatecloud/KYC` repository documents these implemented endpoints:
- `GET /health`, `GET /live`, `GET /ready`
- `POST /api/v1/kyc/sessions`
- `GET /api/v1/kyc/sessions/{session_id}`
- `POST /api/v1/kyc/sessions/{session_id}/consent`
- `GET /api/v1/kyc/me/status`

The backend README/OpenAPI currently lists CNIC evidence upload, OCR integration, face/liveness provider integration, NADRA SMS evidence ingestion, orchestration and final evidence processing as not yet implemented. Database tables and interfaces are not operational integrations.

The backend README also still describes phone OTP as required evidence, while the approved mobile workflow excludes mobile OTP. This policy/contract discrepancy must be resolved with the backend owner before the verification pipeline is integrated. Do not silently invent endpoint paths or payloads.

The OpenAPI server URL is a placeholder (`https://kyc.example.invalid`); obtain the real environment base URL from deployment configuration.

## Repository status

This repository is being initialized with architecture and implementation documentation first. It is not yet a runnable React Native app. Do not label native camera, OCR, face/liveness, SMS, or backend flows as implemented until they exist and have been tested.

## Local setup

The React Native project bootstrap is the next foundation step. Use the project-specific setup instructions added alongside the app scaffold. Android SDK/ADB availability and a compatible Android toolchain must be verified on the developer machine before claiming an Android build passes.
