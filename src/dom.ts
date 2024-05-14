import { ListItemStatus, TableCellData } from "./types";

export type ValueClassName = 'is-danger' | 'is-warning';

/**
 * If `badFactor` and `veryBadFactor` are -1, it means any value other than 0 should flag as is-danger
 * If `badFactor` and `veryBadFactor` are -2, it means any value other than 0 should flag as is-warning
 */
export function getValueClassName(value: number, ideal: number, badFactor: number, veryBadFactor: number = 0, higherBetter: boolean = false): ValueClassName | undefined {
    if (ideal !== 0 && badFactor !== 0) {
        if (veryBadFactor === 0) {
            veryBadFactor = badFactor * 2;
        }

        if (higherBetter ? (value < (ideal * veryBadFactor)) : (value > (ideal * veryBadFactor))) {
            return 'is-danger';
        } else if (higherBetter ? (value < (ideal * badFactor)) : (value > (ideal * badFactor))) {
            return 'is-warning';
        }
    } else if (badFactor === -1 && veryBadFactor === -1) {
        if (value !== 0) {
            return 'is-danger';
        }
    } else if (badFactor === -2 && veryBadFactor === -2) {
        if (value !== 0) {
            return 'is-warning';
        }
    }

    return undefined;
}

export function makeH3(text: string, className: string = ''): HTMLHeadElement {
    const p = document.createElement('h3');
    p.textContent = text;
    p.className = className;

    return p;
}

export function makeParagraph(text: string, className: string = ''): HTMLParagraphElement {
    const p = document.createElement('p');
    p.textContent = text;
    p.className = className;

    return p;
}

export function makeTableContainer(table?: HTMLTableElement): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'table-container pb-4';

    if (table != null) {
        container.appendChild(table);
    }

    return container;
}

export function makeTable(headCols: string[], footCols: string[], rows: TableCellData[][]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'table is-fullwidth is-narrow is-hoverable is-bordered';

    if (headCols.length) {
        const tHead = document.createElement('thead');
        const tr = document.createElement('tr');

        for (const headCol of headCols) {
            const th = document.createElement('th');
            th.innerHTML = headCol;

            tr.appendChild(th);
        }

        tHead.appendChild(tr);
        table.appendChild(tHead);
    }

    if (footCols.length) {
        const tFoot = document.createElement('tfoot');
        const tr = document.createElement('tr');

        for (const footCol of footCols) {
            const th = document.createElement('th');
            th.innerHTML = footCol;

            tr.appendChild(th);
        }

        tFoot.appendChild(tr);
        table.appendChild(tFoot);
    }

    if (rows.length) {
        const tBody = document.createElement('tbody');

        for (const row of rows) {
            const tr = document.createElement('tr');

            for (const cell of row) {
                const td = document.createElement('td');
                td.innerHTML = cell.content;

                if (cell.className != null) {
                    td.className = cell.className;
                }

                tr.appendChild(td);
            }

            tBody.appendChild(tr);
        }

        table.appendChild(tBody);
    }

    return table;
}

export function makeListCard(title: string, listItems: string[]): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'card';

    const cardHeader = document.createElement('header');
    cardHeader.className = 'card-header';

    const cardTitle = document.createElement('p');
    cardTitle.className = 'card-header-title';
    cardTitle.innerHTML = title;

    cardHeader.appendChild(cardTitle);
    card.appendChild(cardHeader);

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const content = document.createElement('div');
    content.className = 'content';

    const list = document.createElement('ul');

    for (const item of listItems) {
        const listItem = document.createElement('li');
        listItem.innerHTML = item;

        list.appendChild(listItem);
    }

    content.appendChild(list);
    cardContent.appendChild(content);
    card.appendChild(cardContent);
    
    return card;
}

export function makeMessage(title: string, message: string, className: string = ''): HTMLElement {
    const article = document.createElement('article');
    article.className = `message ${className}`;

    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerText = title;

    const body = document.createElement('div');
    body.className = 'message-body';
    body.innerHTML = message;

    article.appendChild(header);
    article.appendChild(body);

    return article;
}
