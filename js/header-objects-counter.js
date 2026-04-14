(function () {
    'use strict';

    function formatAge(publishedAt) {
        if (!publishedAt) return '';

        const date = new Date(publishedAt);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 60) {
            return 'только что добавлен';
        } else if (diffHours < 24) {
            const h = diffHours;
            const label = h === 1 ? 'час' : h < 5 ? 'часа' : 'часов';
            return `последний — ${h} ${label} назад`;
        } else if (diffDays < 30) {
            const d = diffDays;
            const label = d === 1 ? 'день' : d < 5 ? 'дня' : 'дней';
            return `последний — ${d} ${label} назад`;
        } else {
            const months = Math.floor(diffDays / 30);
            const label = months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев';
            return `последний — ${months} ${label} назад`;
        }
    }

    function initCounter() {
        const counterEl = document.getElementById('headerObjectsCounter');
        const countEl = document.getElementById('counterCount');
        const ageEl = document.getElementById('counterAge');

        if (!counterEl || !countEl || !ageEl) return;

        fetch('/data/objects.json', { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('fetch failed');
                return res.json();
            })
            .then(function (objects) {
                if (!Array.isArray(objects)) return;

                const total = objects.length;
                countEl.textContent = total;

                const withDate = objects
                    .filter(function (o) { return o.publishedAt; })
                    .sort(function (a, b) { return new Date(b.publishedAt) - new Date(a.publishedAt); });

                if (withDate.length > 0) {
                    const age = formatAge(withDate[0].publishedAt);
                    if (age) ageEl.textContent = age;
                }

                counterEl.classList.add('is-loaded');
            })
            .catch(function () {
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounter);
    } else {
        initCounter();
    }
})();
