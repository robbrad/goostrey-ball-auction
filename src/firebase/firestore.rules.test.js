/**
 * Integration tests for Firestore security rules.
 *
 * These tests require the Firebase Firestore emulator to be running:
 *   firebase emulators:start --only firestore
 *
 * Run with: npx vitest --run src/firebase/firestore.rules.test.js
 *
 * @vitest-environment node
 */
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { setDoc, doc, getDoc, updateDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ID = "goostrey-ball-auction-test";

let testEnv;

beforeAll(async () => {
  const rulesPath = resolve(__dirname, "../../firestore.rules");
  const rules = readFileSync(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/**
 * Helper: seed a user document with admin data so the rules can resolve roles.
 */
async function seedUserDoc(uid, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", uid), data);
  });
}

describe("Firestore Security Rules - users collection", () => {
  const adminUid = "admin-user-1";
  const regularUid = "regular-user-1";
  const otherUid = "other-user-1";

  beforeEach(async () => {
    // Seed admin user document
    await seedUserDoc(adminUid, {
      firstName: "Admin",
      surname: "User",
      email: "admin@example.com",
      role: "admin",
    });

    // Seed regular user document
    await seedUserDoc(regularUid, {
      firstName: "Regular",
      surname: "User",
      email: "regular@example.com",
      role: "",
    });

    // Seed another user document
    await seedUserDoc(otherUid, {
      firstName: "Other",
      surname: "Person",
      email: "other@example.com",
      role: "editor",
    });
  });

  describe("Requirement 7.1: Admin can read any user document", () => {
    it("admin can read another user's document", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(getDoc(doc(db, "users", regularUid)));
    });

    it("admin can read all user documents", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(getDoc(doc(db, "users", otherUid)));
    });
  });

  describe("Requirement 7.2: Non-admin cannot read other user docs", () => {
    it("regular user cannot read another user's document", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertFails(getDoc(doc(db, "users", otherUid)));
    });

    it("editor cannot read another user's document", async () => {
      const editorContext = testEnv.authenticatedContext(otherUid);
      const db = editorContext.firestore();

      await assertFails(getDoc(doc(db, "users", regularUid)));
    });
  });

  describe("Requirement 7.3: Any authenticated user can read own doc", () => {
    it("regular user can read their own document", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertSucceeds(getDoc(doc(db, "users", regularUid)));
    });

    it("editor can read their own document", async () => {
      const editorContext = testEnv.authenticatedContext(otherUid);
      const db = editorContext.firestore();

      await assertSucceeds(getDoc(doc(db, "users", otherUid)));
    });

    it("admin can read their own document", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(getDoc(doc(db, "users", adminUid)));
    });
  });

  describe("Requirement 7.4: Admin can update role field on other users", () => {
    it("admin can change another user's role to admin", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", regularUid), { role: "admin" })
      );
    });

    it("admin can change another user's role to editor", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", regularUid), { role: "editor" })
      );
    });

    it("admin can change another user's role to regular user", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", otherUid), { role: "" })
      );
    });
  });

  describe("Requirement 7.5: Non-admin cannot update role field", () => {
    it("regular user cannot change their own role", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", regularUid), { role: "admin" })
      );
    });

    it("regular user cannot change another user's role", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", otherUid), { role: "admin" })
      );
    });

    it("editor cannot change their own role", async () => {
      const editorContext = testEnv.authenticatedContext(otherUid);
      const db = editorContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", otherUid), { role: "admin" })
      );
    });

    it("editor cannot change another user's role", async () => {
      const editorContext = testEnv.authenticatedContext(otherUid);
      const db = editorContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", regularUid), { role: "admin" })
      );
    });
  });

  describe("Requirement 7.6: User can write own doc without role change", () => {
    it("regular user can update their own name", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", regularUid), { firstName: "Updated" })
      );
    });

    it("regular user can update their own email", async () => {
      const regularContext = testEnv.authenticatedContext(regularUid);
      const db = regularContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", regularUid), {
          email: "newemail@example.com",
        })
      );
    });

    it("editor can update their own name without changing role", async () => {
      const editorContext = testEnv.authenticatedContext(otherUid);
      const db = editorContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", otherUid), { surname: "NewSurname" })
      );
    });
  });

  describe("Requirement 7.7: Unauthenticated access is denied", () => {
    it("unauthenticated user cannot read any user document", async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const db = unauthContext.firestore();

      await assertFails(getDoc(doc(db, "users", regularUid)));
    });

    it("unauthenticated user cannot write any user document", async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const db = unauthContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", regularUid), { firstName: "Hacked" })
      );
    });

    it("unauthenticated user cannot read admin document", async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const db = unauthContext.firestore();

      await assertFails(getDoc(doc(db, "users", adminUid)));
    });
  });

  describe("Requirement 5.3: Admin cannot change own role field", () => {
    it("admin cannot change their own role to editor", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", adminUid), { role: "editor" })
      );
    });

    it("admin cannot change their own role to regular user", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertFails(
        updateDoc(doc(db, "users", adminUid), { role: "" })
      );
    });

    it("admin can update their own non-role fields", async () => {
      const adminContext = testEnv.authenticatedContext(adminUid);
      const db = adminContext.firestore();

      await assertSucceeds(
        updateDoc(doc(db, "users", adminUid), { firstName: "SuperAdmin" })
      );
    });
  });
});
