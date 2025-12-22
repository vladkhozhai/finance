/**
 * Test if "Bearer TOKEN" is a valid cookie value according to HTTP spec
 * Cookie values must not contain: , ; \ " and certain control characters
 */

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseGV1dGVmbm5hZ2tzbWFhZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDEwMDksImV4cCI6MjA4MTgxNzAwOX0.gsHM2lsBeSCV2ShzFC7U4WtI5sOFpx8RPlQgI6KLXWo";

console.log("Token:", token);
console.log("Token length:", token.length);
console.log("\nChecking for invalid characters in cookie value...");

// Cookie value invalid characters: , ; \ " 0x00-0x1F 0x7F
const invalidChars = [",", ";", "\\", '"', "\x00", "\x01", "\x7F"];
const bearerToken = `Bearer ${token}`;

console.log("\nBearer Token:", bearerToken);
console.log("Bearer Token length:", bearerToken.length);

let hasInvalidChar = false;
for (const char of invalidChars) {
  if (bearerToken.includes(char)) {
    console.log(
      `❌ Found invalid character: ${char.charCodeAt(0)} ('${char}')`,
    );
    hasInvalidChar = true;
  }
}

// Check for space character (spaces are technically allowed but often cause issues)
if (bearerToken.includes(" ")) {
  console.log(
    "⚠️  Contains SPACE character - this is allowed but can cause issues in some implementations",
  );
}

if (!hasInvalidChar) {
  console.log("✅ No invalid characters found");
}

// Now check if the issue is the cookie VALUE being too long
console.log(`\nCookie value length check:`);
console.log(`- Bearer + Token: ${bearerToken.length} chars`);
console.log(`- Max cookie size: 4096 bytes (total name+value)`);
console.log(`- Typical max value: ~4000 chars`);

if (bearerToken.length > 4000) {
  console.log("❌ Cookie value may be too long!");
} else {
  console.log("✅ Cookie value length is OK");
}
