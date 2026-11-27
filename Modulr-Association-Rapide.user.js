// ==UserScript==
// @name         Modulr - Association Rapide Fiches Récentes
// @namespace    https://github.com/BiggerThanTheMall/classer_mail_fiche_recentes
// @version      1.1.1
// @description  Permet d'associer rapidement un email à une fiche client en utilisant les dernières fiches consultées.
// @author       BiggerThanTheMall
// @match        https://courtage.modulr.fr/fr/scripts/emails/emails_view.php*
// @match        https://courtage.modulr.fr/fr/scripts/emails/emails_list.php*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEHklEQVR4nL1WTWhdRRg938y97+XnRetCNxVra9JKUrB7F8nCjUKJKC9StdhF60LRRdNSXNibuwy1VRQFUdxkkXqjWEXqTptFQQQpKAmSPoLSnVFoEvOS9+7Md1y8JM3PTXLzQw/cxXsz853zffPNmQF2BQpI2V2MnaCcWEQ0y7+jyKCc2PtDHkXLxO3R9QcORN/sWx7bQTW2tyCiQSza3n/1uA0Kb6j6YwCsWDsG776YuNQ3hCgyiGPdewGL5E+cvRqHLaWLVAVdvRHEhpCgAFed+bxy+aUz2xFhtp4ClJPEIhY93D/8bNhSuugXqs7Xqo7ekeqo9Xnv5mfSsPTg6Y7+5HXEsZaTfD2RS8DIWJkAoDD9VCWpEJEAIgKIQMQKaHxtQQk9iySxI+WyIkeFtxZACmLRI+evtQF4iq4uAmRkJ4auZkTQ3v6LfxwiRBTtgYBFpKZuRJhnvgk0S+BOBTQyMZODfdOk/CG2oBCsbzCCYgtKyl+mzf4JQBDH3L0AAN3oacwT/VjC0BBQgB4AG9RQCFPb1GIg8ul43FfvjiK7OL55fnkEAMDS0WrvH/4saH3otNbnVx1D29SK9L+71/eXxntHAV3Mfm8qsIxyYiuXT5xx8zNvAvwdYlKI8QBvu+r0u/tLjzTIG9iSPCdnYlfa70p0XvjuscP93x7MXEhKdxQF2KLKmw1KIwkhABw5f62tYIMAmEat3mYXCrNea+ECcAdWDxVDTcNCAG+LLZxjVScH+6ZXioFIZkU2EiBYLGHHha9OgfIaqE+CLIAq95YtHUtZPhUUoQgcjK2A+PJ282+fII7dRiIyBFAQDcijM13F5gDDtqnUS5eCPt2kWBkZ2AASFuEXqje9n3th8r2TUxgYkLV3xPq9LY8YxLE2Gf9h0Lqv11Vn6prOe3rH7XxaX1A3d7dum1qftigMYWAgs9qr/1y88TrOJcckCG7RpQ4N293xq4dkGjSXQlebPV65dOL7cpLYkb4+n1mBbtwwAEBorwmLJLle5PbR6Ce1LwLA32MPr4qX7QNqDu7VW08EQlUBeAAARnFjix4AIIa5XzT5lWTHzBRA5r/NtqEgk2sjK57GHlkpIYSAIGcBoNzVtXEPjHZNEQCM4Y/YffM1oAoxgUDwE7C+CdeSCEi0v/1DQQqzv5pic5evVVMRCXfCTdKZsBDQuSnRtHPiysv/Ntz9niOu3QJiAFL56LkaA3OS6qZtU2sIkiQ9SZfz8yBpi80BIA4+PTVx5ZV/UB4xa+04u8xLd/9bQ52mpeV9kM9IWDSQnLtCgK4GQH52teq5yQ9evblkcmunbhxxxdv+0DtfH7UeRwEtwisgmr1OAQQBjTHO045XBp+/1YiVTb41osjs2pCizR+y+YJHkekGDNCTm3cUPbqzrO8z/gdvRDxxQn0djgAAAABJRU5ErkJggg==
// @grant        none
// @run-at       document-end
//
// @updateURL    https://raw.githubusercontent.com/BiggerThanTheMall/classer_mail_fiche_recentes/main/Modulr-Association-Rapide.user.js
// @downloadURL  https://raw.githubusercontent.com/BiggerThanTheMall/classer_mail_fiche_recentes/main/Modulr-Association-Rapide.user.js
// ==/UserScript==

(function() {
    'use strict';

    function getClientId(href, baseUrl) {
        let url;
        try {
            url = new URL(href, baseUrl);
        } catch {
            return null;
        }
        if (url.origin !== location.origin || url.pathname !== '/fr/scripts/clients/clients_card.php') {
            return null;
        }
        const ids = url.searchParams.getAll('id');
        return ids.length === 1 && /^[1-9][0-9]*$/.test(ids[0]) ? ids[0] : null;
    }

    async function fetchAndInject() {
        const popup = document.querySelector('#pop_up');
        if (!popup) return;

        const existingContainer = popup.querySelector('#recent-entities-container');
        const idInput = popup.querySelector('#email_association_entity_id');
        const nameInput = popup.querySelector('#email_association_entity_name');
        const textInput = popup.querySelector('#email_association_entity');
        if (popup.querySelector('.success') || !idInput || !nameInput || !textInput) {
            existingContainer?.remove();
            return;
        }
        if (existingContainer) return;

        const container = document.createElement('div');
        container.id = "recent-entities-container";
        container.innerHTML = `
            <h2 class="tabs_content_title medium_margin_top" id="recent-entities-section">
                <span class="fa fa-history"></span> Sélection rapide (Fiches clients récentes)
            </h2>
            <div class="high_margin_bottom" style="max-height: 180px; overflow-y: auto; border: 2px solid #3498db; border-radius: 5px; background: #fff;">
                <ul class="ul_table_list list_no_style" id="recent-entities-list">
                    <li class="medium_padding">Chargement...</li>
                </ul>
            </div>
        `;

        popup.prepend(container);
        const list = container.querySelector('#recent-entities-list');
        const status = list.firstElementChild;

        try {
            const response = await fetch("https://courtage.modulr.fr/fr/intranet/history", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
                body: "mcut="
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const history = new DOMParser().parseFromString(await response.text(), 'text/html');
            const seen = new Set();
            for (const link of history.querySelectorAll('a[href]')) {
                const id = getClientId(link.getAttribute('href'), response.url);
                const label = link.textContent.trim().replace(/×$/, '').trim();
                if (!id || !label || seen.has(id)) continue;

                const li = document.createElement('li');
                li.className = (seen.size % 2 === 0 ? 'even' : 'odd') + ' email_association_line recent-item-js';
                seen.add(id);
                li.style.cursor = 'pointer';
                const row = document.createElement('div');
                row.className = 'block medium_padding';
                const icon = document.createElement('span');
                icon.className = 'fa fa-user low_padding_right';
                row.append(icon, ' ' + label);
                li.append(row);

                li.onclick = function() {
                    list.querySelectorAll('.recent-item-js').forEach(el => el.style.background = '');
                    li.style.background = '#e1f5fe';
                    const currentId = popup.querySelector('#email_association_entity_id');
                    const currentType = popup.querySelector('#email_association_entity_name');
                    const currentLabel = popup.querySelector('#email_association_entity');
                    if (!currentId || !currentType || !currentLabel) return;
                    currentId.value = id;
                    currentType.value = 'client';
                    currentLabel.value = label;
                    currentId.classList.add('id_selected');
                    currentId.dispatchEvent(new Event('change', { bubbles: true }));
                };
                list.append(li);
            }
            if (seen.size) status.remove();
            else status.textContent = 'Aucune fiche client dans l’historique récent.';
        } catch (e) {
            status.textContent = 'Impossible de charger les fiches clients récentes.';
            console.error("Erreur script récent:", e);
        }
    }

    // Intervalle de vérification (on garde 800ms pour la réactivité)
    setInterval(fetchAndInject, 800);
})();
