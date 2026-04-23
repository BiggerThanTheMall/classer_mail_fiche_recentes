// ==UserScript==
// @name         Modulr - Association Rapide Fiches Récentes
// @namespace    https://github.com/BiggerThanTheMall/classer_mail_fiche_recentes
// @version      1.0.0
// @description  Permet d'associer rapidement un email à une fiche client en utilisant les dernières fiches consultées.
// @author       BiggerThanTheMall
// @match        https://courtage.modulr.fr/fr/scripts/emails/emails_view.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=modulr.fr
// @grant        none
// @run-at       document-end
//
// @updateURL    https://raw.githubusercontent.com/BiggerThanTheMall/classer_mail_fiche_recentes/main/Modulr-Association-Rapide.user.js
// @downloadURL  https://raw.githubusercontent.com/BiggerThanTheMall/classer_mail_fiche_recentes/main/Modulr-Association-Rapide.user.js
// ==/UserScript==

(function() {
    'use strict';

    function parseEntityInfo(url) {
        const idMatch = url.match(/id=(\d+)/);
        const id = idMatch ? idMatch[1] : null;
        let name = 'client';
        if (url.includes('user_folder_manage_card.php')) name = 'folder';
        else if (url.includes('companies_card.php')) name = 'company';
        else if (url.includes('contacts_card.php')) name = 'contact';
        return { id, name };
    }

    async function fetchAndInject() {
        const popup = document.querySelector('#pop_up');
        if (!popup) return;

        const existingContainer = document.getElementById('recent-entities-container');

        // --- CONDITION DE SORTIE (ÉTAPE 3) ---
        // Si le message de succès est présent, on nettoie et on arrête tout
        if (popup.querySelector('.success')) {
            if (existingContainer) {
                existingContainer.remove();
            }
            return;
        }

        // Si le bloc est déjà là, on ne fait rien (on attend juste le succès pour l'enlever)
        if (existingContainer) return;

        // --- ÉTAPE 1 : INJECTION ---
        const container = document.createElement('div');
        container.id = "recent-entities-container";
        container.innerHTML = `
            <h2 class="tabs_content_title medium_margin_top" id="recent-entities-section">
                <span class="fa fa-history"></span> Sélection rapide (Fiches récentes)
            </h2>
            <div class="high_margin_bottom" style="max-height: 180px; overflow-y: auto; border: 2px solid #3498db; border-radius: 5px; background: #fff;">
                <ul class="ul_table_list list_no_style" id="recent-entities-list">
                    <li class="medium_padding">Chargement...</li>
                </ul>
            </div>
        `;

        popup.prepend(container);

        try {
            const response = await fetch("https://courtage.modulr.fr/fr/intranet/history", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
                body: "mcut="
            });
            const html = await response.text();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const links = tempDiv.querySelectorAll('li a');
            const listContainer = document.getElementById('recent-entities-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';

            links.forEach((a, index) => {
                const href = a.getAttribute('href');
                if (!href || href.includes('javascript')) return;

                const info = parseEntityInfo(href);
                const name = a.textContent.trim().replace('×', '');
                const icon = a.querySelector('span')?.className || 'fa fa-user';

                const li = document.createElement('li');
                li.className = `${index % 2 === 0 ? 'even' : 'odd'} email_association_line recent-item-js`;
                li.style.cursor = "pointer";
                li.setAttribute('data-id', info.id);
                li.setAttribute('data-name', info.name);
                li.setAttribute('data-label', name);

                li.innerHTML = `<div class="block medium_padding"><span class="${icon} low_padding_right"></span> ${name}</div>`;

                li.onclick = function() {
                    document.querySelectorAll('.recent-item-js').forEach(el => el.style.background = "");
                    this.style.background = "#e1f5fe";

                    const idInput = document.querySelector('#email_association_entity_id');
                    const nameInput = document.querySelector('#email_association_entity_name');
                    const textInput = document.querySelector('#email_association_entity');

                    if (idInput) {
                        idInput.value = this.getAttribute('data-id');
                        idInput.classList.add('id_selected');
                    }
                    if (nameInput) nameInput.value = this.getAttribute('data-name');
                    if (textInput) textInput.value = this.getAttribute('data-label');

                    idInput.dispatchEvent(new Event('change', { bubbles: true }));
                };
                listContainer.appendChild(li);
            });
        } catch (e) {
            console.error("Erreur script récent:", e);
        }
    }

    // Intervalle de vérification (on garde 800ms pour la réactivité)
    setInterval(fetchAndInject, 800);
})();
