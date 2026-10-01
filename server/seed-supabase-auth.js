/**
 * seed-supabase-auth.js
 * Creates the seeded demo users in Supabase Auth using the Admin API.
 * Run once: node seed-supabase-auth.js
 */

const SUPABASE_URL = 'https://kxieqdunbgzdunctuies.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_FuqpICJkPD8TAddtX2kZIQ_jagjQ93F';

const users = [
  { email: 'owner@dentacare.com', password: 'DentaCare@2026' },
  { email: 'doctor@dentacare.com', password: 'DentaCare@2026' },
  { email: 'assistant@dentacare.com', password: 'DentaCare@2026' },
];

async function createUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,   // skip the confirmation email
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.message && data.message.toLowerCase().includes('already been registered')) {
      console.log(`  [SKIP] ${email} — already exists in Supabase Auth`);
    } else {
      console.error(`  [FAIL] ${email} — ${data.message || JSON.stringify(data)}`);
    }
  } else {
    console.log(`  [OK]   ${email} created (id: ${data.id})`);
  }
}

(async () => {
  console.log('Creating demo users in Supabase Auth...\n');
  for (const user of users) {
    await createUser(user.email, user.password);
  }
  console.log('\nDone. You can now log in at http://localhost:5173');
})();
