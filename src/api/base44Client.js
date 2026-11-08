// Compatibility shim: the app historically imported `base44` from here.
// The implementation is now Firebase-backed (see ./firebaseClient.js).
export { base44, hasBackend } from "./firebaseClient";
