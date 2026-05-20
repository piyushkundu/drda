const fetch = require('node-fetch');
async function test() {
  const res1 = await fetch('https://api.sarvam.ai/transliterate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'api-subscription-key': 'sk_m1nd33fo_iQ5jcdXRTXkpmRQoZQzndkVB' },
    body: JSON.stringify({ input: 'jila vikas adakri baghpat', source_language_code: 'en-IN', target_language_code: 'hi-IN' })
  }).then(r=>r.json());
  
  const res2 = await fetch('https://api.sarvam.ai/translate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'api-subscription-key': 'sk_m1nd33fo_iQ5jcdXRTXkpmRQoZQzndkVB' },
    body: JSON.stringify({ input: 'jila vikas adakri baghpat', source_language_code: 'en-IN', target_language_code: 'hi-IN', speaker_gender: 'Male', mode: 'formal' })
  }).then(r=>r.json());
  
  console.log('Transliterate:', res1.transliterated_text);
  console.log('Translate:', res2.translated_text);
}
test();
