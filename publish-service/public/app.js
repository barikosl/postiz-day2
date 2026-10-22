// Owner "Post to TikTok" page. Every rule here comes from TikTok's Content
// Sharing Guidelines; the server re-checks all of them (server.mjs).
(function () {
  'use strict';

  var T = {
    he: {
      brand: 'Day2 Social Publisher', loading: 'טוען…', title: 'פרסום לטיקטוק',
      intro: 'הכנו לכם את הסרטון. בדקו אותו, בחרו את ההגדרות, והסרטון יעלה לחשבון הטיקטוק שלכם רק כשתלחצו על פרסום.',
      gone_title: 'הקישור לא בתוקף', gone_body: 'הקישור פג או שכבר נעשה בו שימוש. אם צריך קישור חדש, כתבו לנו בוואטסאפ.',
      posting_as: 'מפרסם לחשבון הטיקטוק', cannot_post: 'טיקטוק לא מאפשר לחשבון הזה לפרסם כרגע. נסו שוב מאוחר יותר.',
      preview: 'תצוגה מקדימה', caption: 'כיתוב', caption_hint: 'אפשר לערוך לפני הפרסום',
      who_can_see: 'מי יכול לראות את הסרטון?', select_privacy: 'בחרו…',
      PUBLIC_TO_EVERYONE: 'כולם', MUTUAL_FOLLOW_FRIENDS: 'חברים', FOLLOWER_OF_CREATOR: 'עוקבים', SELF_ONLY: 'רק אני',
      branded_not_private: 'תוכן ממומן לא יכול להיות פרטי.',
      allow_users: 'לאפשר לצופים', comment: 'תגובות', duet: 'דואט', stitch: "סטיץ'",
      interact_disabled: 'אפשרויות באפור כבויות בהגדרות חשבון הטיקטוק שלכם.',
      disclose: 'גילוי תוכן מסחרי',
      disclose_help: 'הפעילו אם הסרטון מקדם מוצרים או שירותים בתמורה למשהו בעל ערך. הסרטון יכול לקדם אתכם, צד שלישי, או את שניהם.',
      your_brand: 'המותג שלכם', your_brand_help: 'אתם מקדמים את עצמכם או את העסק שלכם.',
      branded: 'תוכן ממומן', branded_help: 'אתם מקדמים מותג אחר או צד שלישי.',
      label_promo: 'הסרטון יסומן "תוכן פרסומי" (Promotional content).',
      label_paid: 'הסרטון יסומן "שיתוף פעולה בתשלום" (Paid partnership).',
      pick_one: 'צריך לציין אם התוכן מקדם אתכם, צד שלישי, או את שניהם.',
      aigc: 'הסרטון נוצר בעזרת AI',
      decl_music: 'בלחיצה על פרסום, אתם מסכימים ל-{music} של טיקטוק.',
      decl_branded: 'בלחיצה על פרסום, אתם מסכימים ל-{bc} ול-{music} של טיקטוק.',
      music: 'אישור שימוש במוזיקה (Music Usage Confirmation)', bc: 'מדיניות התוכן הממומן (Branded Content Policy)',
      publish: 'פרסום לטיקטוק', publishing: 'מפרסם…',
      hint_privacy: 'בחרו מי יכול לראות את הסרטון כדי לפרסם.',
      hint_pick: 'בחרו "המותג שלכם" או "תוכן ממומן" כדי לפרסם.',
      hint_long: 'הסרטון ארוך מהמותר לחשבון הזה.',
      too_long: 'הסרטון ({d} שנ׳) ארוך מהמקסימום שטיקטוק מאפשר לחשבון הזה ({m} שנ׳).',
      processing_title: 'הסרטון נשלח לטיקטוק',
      processing_body: 'טיקטוק מעבד את הסרטון. ייתכן שיעברו כמה דקות עד שהוא יופיע בפרופיל שלכם.',
      published_title: 'הסרטון פורסם ✓', published_body: 'הסרטון עלה לחשבון הטיקטוק שלכם.',
      error_title: 'הפרסום לא הצליח', error_body: 'טיקטוק לא קיבל את הסרטון. קיבלנו התראה ונחזור אליכם.',
      unconfirmed_body: 'לא קיבלנו אישור מטיקטוק. אל תנסו שוב, נבדוק ונחזור אליכם.',
      view_post: 'לצפייה בפוסט', terms: 'תנאי שימוש', privacy_policy: 'מדיניות פרטיות',
      err_generic: 'משהו השתבש. נסו שוב בעוד רגע.'
    },
    en: {
      brand: 'Day2 Social Publisher', loading: 'Loading…', title: 'Post to TikTok',
      intro: 'Your video is ready. Review it and choose your settings. It is posted to your TikTok account only when you press Post.',
      gone_title: 'This link is no longer valid', gone_body: 'The link expired or was already used. Message us on WhatsApp for a new one.',
      posting_as: 'Posting to TikTok as', cannot_post: 'TikTok does not allow this account to post right now. Please try again later.',
      preview: 'Preview', caption: 'Caption', caption_hint: 'You can edit it before posting',
      who_can_see: 'Who can see this video?', select_privacy: 'Select…',
      PUBLIC_TO_EVERYONE: 'Everyone', MUTUAL_FOLLOW_FRIENDS: 'Friends', FOLLOWER_OF_CREATOR: 'Followers', SELF_ONLY: 'Only me',
      branded_not_private: 'Branded content visibility cannot be set to private.',
      allow_users: 'Allow users to', comment: 'Comment', duet: 'Duet', stitch: 'Stitch',
      interact_disabled: 'Greyed-out options are turned off in your TikTok account settings.',
      disclose: 'Disclose video content',
      disclose_help: 'Turn on to disclose that this video promotes goods or services in exchange for something of value. Your video could promote yourself, a third party, or both.',
      your_brand: 'Your brand', your_brand_help: 'You are promoting yourself or your own business.',
      branded: 'Branded content', branded_help: 'You are promoting another brand or a third party.',
      label_promo: "Your video will be labeled as 'Promotional content'.",
      label_paid: "Your video will be labeled as 'Paid partnership'.",
      pick_one: 'You need to indicate if your content promotes yourself, a third party, or both.',
      aigc: 'This video was made with AI',
      decl_music: "By posting, you agree to TikTok's {music}.",
      decl_branded: "By posting, you agree to TikTok's {bc} and {music}.",
      music: 'Music Usage Confirmation', bc: 'Branded Content Policy',
      publish: 'Post to TikTok', publishing: 'Posting…',
      hint_privacy: 'Select who can see this video to post.',
      hint_pick: "Select 'Your brand' or 'Branded content' to post.",
      hint_long: 'This video is longer than this account allows.',
      too_long: 'This video ({d}s) is longer than TikTok allows for this account ({m}s).',
      processing_title: 'Sent to TikTok',
      processing_body: 'TikTok is processing your video. It may take a few minutes for it to appear on your profile.',
      published_title: 'Posted ✓', published_body: 'Your video is on your TikTok account.',
      error_title: 'Posting failed', error_body: 'TikTok did not accept the video. We were notified and will get back to you.',
      unconfirmed_body: 'We did not get a confirmation from TikTok. Please do not retry; we will check and get back to you.',
      view_post: 'View the post', terms: 'Terms of Service', privacy_policy: 'Privacy Policy',
      err_generic: 'Something went wrong. Please try again in a moment.'
    }
  };
  var MUSIC_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
  var BC_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en';

  var token = location.pathname.split('/').filter(Boolean)[1];
  var params = new URLSearchParams(location.search);
  var lang = params.get('lang') === 'en' ? 'en' : 'he';
  var data = null;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k) { return (T[lang] && T[lang][k]) || T.en[k] || k; };

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    $('lang').textContent = lang === 'he' ? 'English' : 'עברית';
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute('data-t'));
    $('intro').textContent = t('intro');
    if (data) { fillPrivacy(); update(); }
  }

  $('lang').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    params.set('lang', lang);
    history.replaceState(null, '', location.pathname + '?' + params.toString());
    applyLang();
  });

  function show(id) { $(id).classList.remove('hidden'); }
  function hide(id) { $(id).classList.add('hidden'); }

  // Privacy dropdown (in-page listbox, so the open list is visible on any
  // device and in screen recordings). Options = exactly what creator_info
  // returned; nothing is preselected.
  function fillPrivacy() {
    var list = $('privacy_list');
    list.textContent = '';
    var opts = (data.creator && data.creator.privacyOptions) || [];
    for (var i = 0; i < opts.length; i++) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('data-value', opts[i]);
      li.setAttribute('tabindex', '-1');
      li.textContent = t(opts[i]);
      list.appendChild(li);
    }
    renderPrivacy();
  }

  function renderPrivacy() {
    var v = $('privacy').value;
    var label = $('privacy_label');
    label.textContent = v ? t(v) : t('select_privacy');
    label.className = v ? '' : 'placeholder';
    var branded = $('disclose').checked && $('brandedContent').checked;
    var items = $('privacy_list').children;
    for (var i = 0; i < items.length; i++) {
      var val = items[i].getAttribute('data-value');
      var off = branded && val === 'SELF_ONLY';
      items[i].setAttribute('aria-selected', String(val === v));
      items[i].setAttribute('aria-disabled', String(off));
      items[i].title = off ? t('branded_not_private') : '';
    }
  }

  function setPrivacyOpen(open) {
    $('privacy_list').classList.toggle('hidden', !open);
    $('privacy_btn').setAttribute('aria-expanded', String(open));
  }

  $('privacy_btn').addEventListener('click', function (e) {
    e.stopPropagation();
    setPrivacyOpen($('privacy_list').classList.contains('hidden'));
  });
  $('privacy_list').addEventListener('click', function (e) {
    var li = e.target.closest('li');
    if (!li || li.getAttribute('aria-disabled') === 'true') return;
    $('privacy').value = li.getAttribute('data-value');
    setPrivacyOpen(false);
    update();
  });
  document.addEventListener('click', function () { setPrivacyOpen(false); });

  function declaration(branded) {
    var el = $('declaration');
    el.textContent = '';
    var tpl = t(branded ? 'decl_branded' : 'decl_music');
    var partsRe = /\{(music|bc)\}/g, last = 0, m;
    while ((m = partsRe.exec(tpl))) {
      el.appendChild(document.createTextNode(tpl.slice(last, m.index)));
      var a = document.createElement('a');
      a.href = m[1] === 'music' ? MUSIC_URL : BC_URL;
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = t(m[1]);
      el.appendChild(a);
      last = partsRe.lastIndex;
    }
    el.appendChild(document.createTextNode(tpl.slice(last)));
  }

  function update() {
    var c = data.creator || {};
    var disclose = $('disclose').checked;
    var yourBrand = disclose && $('yourBrand').checked;
    var branded = disclose && $('brandedContent').checked;
    disclose ? show('disclose_box') : hide('disclose_box');

    // Branded content cannot be private: grey out "Only me" and clear it.
    var sel = $('privacy');
    if (branded && sel.value === 'SELF_ONLY') sel.value = '';
    renderPrivacy();
    branded ? show('privacy_note') : hide('privacy_note');

    var note = $('label_note');
    if (yourBrand || branded) { note.textContent = t(branded ? 'label_paid' : 'label_promo'); show('label_note'); }
    else hide('label_note');
    (disclose && !yourBrand && !branded) ? show('pick_one') : hide('pick_one');

    declaration(branded);
    $('count').textContent = $('caption').value.length;

    var tooLong = !!(c.maxDurationSec && data.durationSec && data.durationSec > c.maxDurationSec);
    var hint = '';
    if (c.error) hint = t('cannot_post');
    else if (tooLong) hint = t('hint_long');
    else if (!sel.value) hint = t('hint_privacy');
    else if (disclose && !yourBrand && !branded) hint = t('hint_pick');
    $('publish_hint').textContent = hint;
    $('publish').disabled = !!hint || !$('caption').value.trim();
    $('publish').title = hint;
  }

  function lock(id, disabled) {
    $(id).disabled = disabled;
    $(id).checked = false; // interactions are never on by default
    $('l_' + id).classList.toggle('disabled', disabled);
  }

  function render() {
    hide('loading');
    if (data.status !== 'ready') return finished(data.status, data.releaseURL);
    var c = data.creator || {};
    var handle = c.username ? '@' + c.username : '';
    $('nickname').textContent = c.nickname && c.nickname !== c.username ? c.nickname + (handle ? ' · ' + handle : '') : (handle || c.nickname || '');
    if (c.avatar) $('avatar').src = c.avatar; else hide('avatar');
    if (c.error) show('cannot');
    $('video').src = data.video;
    $('caption').value = data.caption || '';
    fillPrivacy();
    lock('comment', !!c.commentDisabled);
    lock('duet', !!c.duetDisabled);
    lock('stitch', !!c.stitchDisabled);
    (c.commentDisabled || c.duetDisabled || c.stitchDisabled) ? show('interact_note') : hide('interact_note');
    if (c.maxDurationSec && data.durationSec && data.durationSec > c.maxDurationSec) {
      $('toolong').textContent = t('too_long').replace('{d}', Math.round(data.durationSec)).replace('{m}', c.maxDurationSec);
      show('toolong');
    }
    show('form');
    update();
  }

  function finished(status, url) {
    hide('form');
    show('done');
    var k = status === 'published' ? 'published' : (status === 'error' || status === 'unconfirmed') ? 'error' : 'processing';
    $('done_title').textContent = t(k + '_title');
    $('done_body').textContent = status === 'unconfirmed' ? t('unconfirmed_body') : t(k + '_body');
    if (status === 'published' && url) { $('done_link').href = url; show('done_link'); }
    if (k === 'processing') setTimeout(poll, 5000);
  }

  var polls = 0;
  function poll() {
    if (++polls > 120) return;
    fetch('/publish/' + token + '/status').then(function (r) { return r.json(); }).then(function (s) {
      finished(s.status, s.releaseURL);
    }).catch(function () { setTimeout(poll, 10000); });
  }

  ['disclose', 'yourBrand', 'brandedContent', 'caption'].forEach(function (id) {
    $(id).addEventListener(id === 'caption' ? 'input' : 'change', update);
  });

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('publish').disabled) return;
    $('publish').disabled = true;
    $('publish').textContent = t('publishing');
    hide('error');
    var disclose = $('disclose').checked;
    var body = {
      caption: $('caption').value,
      privacy: $('privacy').value,
      comment: $('comment').checked,
      duet: $('duet').checked,
      stitch: $('stitch').checked,
      disclose: disclose,
      yourBrand: disclose && $('yourBrand').checked,
      brandedContent: disclose && $('brandedContent').checked,
      aigc: $('aigc').checked,
      consent: true // the owner pressed Post with the declaration shown above the button
    };
    fetch('/publish/' + token + '/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, body: j }; });
    }).then(function (r) {
      if (r.status === 202) return finished('processing');
      if (r.status === 502) return finished('unconfirmed');
      if (r.status === 409 || r.status === 410) { hide('form'); show('gone'); return; }
      $('error').textContent = t('err_generic') + (r.body && r.body.detail ? ' (' + r.body.detail + ')' : '');
      show('error');
      $('publish').textContent = t('publish');
      update();
    }).catch(function () {
      $('error').textContent = t('err_generic');
      show('error');
      $('publish').textContent = t('publish');
      update();
    });
  });

  applyLang();
  fetch('/publish/' + token + '/info').then(function (r) {
    if (r.status === 404 || r.status === 410) { hide('loading'); show('gone'); return null; }
    return r.json();
  }).then(function (d) {
    if (!d) return;
    data = d;
    if (!params.get('lang') && d.lang === 'en') { lang = 'en'; applyLang(); }
    render();
  }).catch(function () { hide('loading'); show('gone'); });
})();
