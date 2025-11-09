
"use client";

import React from 'react';
import SecureNotesClient from './SecureNotesClient';

// This is now a simple wrapper component.
// All logic is deferred to the client-side component.
export default function SecureNotes() {
  return <SecureNotesClient />;
}
