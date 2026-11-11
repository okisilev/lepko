/* Лепко — студия керамики */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- Шторка записи ---------- */
  var sheet = $('#sheet'), sheetMsg = $('#sheetMsg'), lastFocus = null, current = '';

  function openSheet(msg) {
    current = msg || 'Хочу записаться на мастер-класс';
    sheetMsg.textContent = current;
    lastFocus = doc.activeElement;
    sheet.hidden = false;
    doc.body.classList.add('lock');
    var first = $('.slink', sheet);
    if (first) first.focus();
  }
  function closeSheet() {
    sheet.hidden = true;
    doc.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  doc.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-book]') : null;
    if (b) { e.preventDefault(); openSheet(b.getAttribute('data-book')); }
  });
  $$('[data-close]', sheet).forEach(function (el) { el.addEventListener('click', closeSheet); });
  sheet.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab') {
      var f = $$('a,button', sheet).filter(function (x) { return x.offsetParent !== null; });
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* ---------- Копирование и Поделиться ---------- */
  function toast(text) {
    var t = doc.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
    doc.body.appendChild(t);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 2600);
  }

  function legacyCopy(text) {
    try {
      var ta = doc.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = doc.execCommand('copy'); doc.body.removeChild(ta); return ok;
    } catch (err) { return false; }
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  // Обработка кликов по кнопкам мессенджеров
  $$('[data-copy]', sheet).forEach(function (a) {
    a.addEventListener('click', function (e) {
      // Проверяем, поддерживает ли устройство Web Share API
      if (navigator.share) {
        e.preventDefault(); // Отменяем стандартный переход по ссылке
        navigator.share({
          title: 'Запись в студию «Лепко»',
          text: current // Передаем наш сформированный текст
        }).then(function () {
          // Пользователь успешно отправил (или закрыл меню)
        }).catch(function (err) {
          // Если произошла ошибка или пользователь отменил, копируем в буфер
          if (err.name !== 'AbortError') {
            copy(current).then(function (ok) {
              if (ok) toast('Текст скопирован. Вставьте его в чат.');
            });
          }
        });
      } else {
        // Фолбэк для старых устройств (копируем в буфер и переходим по ссылке)
        copy(current).then(function (ok) {
          if (ok) {
            toast('Текст скопирован. Вставьте его в чат (долгое нажатие → Вставить)');
          }
        });
      }
    });
  });

  /* ---------- Сертификат ---------- */
  var form = $('#giftForm'), tTo = $('#tTo'), tFrom = $('#tFrom'), tValue = $('#tValue');
  if (form) {
    var giftData = function () {
      var to = $('#giftTo').value.trim();
      var from = $('#giftFrom').value.trim();
      var v = form.querySelector('input[name="value"]:checked');
      var k = form.querySelector('input[name="kind"]:checked');
      return { to: to, from: from, value: v ? v.value : '', kind: k ? k.value : '' };
    };
    var renderGift = function () {
      var d = giftData();
      tTo.textContent = d.to || 'вас';
      tFrom.textContent = d.from ? 'с любовью от ' + d.from : '';
      tValue.textContent = d.value;
    };
    form.addEventListener('input', renderGift);
    form.addEventListener('change', renderGift);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = giftData();

      // Формируем красивый текст заявки
      var msg = 'Хочу купить подарочный сертификат!\n';
      msg += 'Номинал/формат: ' + d.value + '\n';
      if (d.to) msg += 'Кому: ' + d.to + '\n';
      if (d.from) msg += 'От кого: ' + d.from + '\n';
      msg += 'Вариант: ' + d.kind;

      openSheet(msg);
    });
    renderGift();
  }

  /* ---------- Карта ---------- */
  var mapBtn = $('#mapLoad');
  function loadMap() {
    if (!mapBtn || !mapBtn.parentNode) return;
    var f = doc.createElement('iframe');
    f.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Иркутск, улица Киевская, 1, студия керамики Лепко') + '&z=17';
    f.title = 'Студия керамики «Лепко» на карте: Иркутск, ул. Киевская, 1';
    f.loading = 'lazy'; f.setAttribute('allowfullscreen', '');
    mapBtn.parentNode.replaceChild(f, mapBtn); mapBtn = null;
  }
  if (mapBtn) {
    mapBtn.addEventListener('click', loadMap);
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { loadMap(); mo.disconnect(); }
      }, { rootMargin: '200px' });
      mo.observe($('#map'));
    }
  }
})();