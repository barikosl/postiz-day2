// Owner "Connect TikTok" page: explains what is connected, then the button goes
// to /go, which mints a fresh TikTok authorize URL (Login Kit consent screen).
(function () {
  'use strict';
  var T = {
    he: {
      title: 'חיבור חשבון הטיקטוק שלכם', for_: 'עבור {b}',
      what_title: 'מה החיבור מאפשר',
      what_1: 'לראות את שם המשתמש והתמונה של החשבון, כדי שתדעו לאיזה חשבון מפרסמים.',
      what_2: 'להכין לכם סרטונים שאתם בודקים ומפרסמים בעצמכם, בלחיצה שלכם.',
      what_3: 'לשלוח סרטון כטיוטה לתיבה שלכם בטיקטוק, אם תעדיפו לסיים באפליקציה.',
      revoke: 'שום דבר לא מתפרסם בלי שתלחצו "פרסום". אפשר לבטל את הגישה בכל רגע בהגדרות הטיקטוק (אבטחה והרשאות ← הרשאות אפליקציות).',
      cta: 'חיבור עם טיקטוק', next: 'תועברו למסך האישור של טיקטוק.',
      gone_title: 'הקישור לא בתוקף', gone_body: 'כתבו לנו בוואטסאפ ונשלח קישור חדש.',
      about: 'על השירות', terms: 'תנאי שימוש', privacy_policy: 'מדיניות פרטיות'
    },
    en: {
      title: 'Connect your TikTok account', for_: 'For {b}',
      what_title: 'What connecting allows',
      what_1: "Read your account's display name and avatar, so you always see which account you are posting to.",
      what_2: 'Prepare videos that you review and post yourself, with your own click.',
      what_3: 'Send a video as a draft to your TikTok inbox, if you prefer to finish in the TikTok app.',
      revoke: 'Nothing is posted until you press "Post". You can remove access at any time in TikTok settings (Security & permissions → Manage app permissions).',
      cta: 'Continue with TikTok', next: "You will be taken to TikTok's authorization screen.",
      gone_title: 'This link is no longer valid', gone_body: 'Message us on WhatsApp for a new one.',
      about: 'About', terms: 'Terms of Service', privacy_policy: 'Privacy Policy'
    }
  };
  var token = location.pathname.split('/').filter(Boolean)[2];
  var params = new URLSearchParams(location.search);
  var lang = params.get('lang') === 'en' ? 'en' : 'he';
  var business = '';
  var $ = function (id) { return document.getElementById(id); };
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    $('lang').textContent = lang === 'he' ? 'English' : 'עברית';
    var n = document.querySelectorAll('[data-t]');
    for (var i = 0; i < n.length; i++) n[i].textContent = T[lang][n[i].getAttribute('data-t')] || '';
    $('for').textContent = business ? T[lang].for_.replace('{b}', business) : '';
    $('go').href = '/publish/connect/' + token + '/go';
  }
  $('lang').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    params.set('lang', lang);
    history.replaceState(null, '', location.pathname + '?' + params.toString());
    apply();
  });
  fetch('/publish/connect/' + token + '/info').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d) { $('gone').classList.remove('hidden'); apply(); return; }
    business = d.business || '';
    if (!params.get('lang') && d.lang === 'en') lang = 'en';
    $('main').classList.remove('hidden');
    apply();
  });
})();
