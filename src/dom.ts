import { TableCellData } from './types.js';

export type ValueClassName = 'is-danger' | 'is-warning';

// If `badFactor` and `veryBadFactor` are -1, it means any value other than 0 should flag as is-danger
// If `badFactor` and `veryBadFactor` are -2, it means any value other than 0 should flag as is-warning
export function getValueClassName(
    value: number,
    ideal: number,
    badFactor: number,
    veryBadFactor: number = 0,
    higherBetter: boolean = false,
): ValueClassName | undefined {
    if (badFactor === -1 && veryBadFactor === -1) {
        if (value !== 0) {
            return 'is-danger';
        }
    } else if (badFactor === -2 && veryBadFactor === -2) {
        if (value !== 0) {
            return 'is-warning';
        }
    } else if (ideal !== 0 && badFactor !== 0) {
        if (veryBadFactor === 0) {
            veryBadFactor = badFactor * 2;
        }

        if (higherBetter ? value < ideal * veryBadFactor : value > ideal * veryBadFactor) {
            return 'is-danger';
        }

        if (higherBetter ? value < ideal * badFactor : value > ideal * badFactor) {
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

export function makeButton(text: string, className: string = ''): HTMLAnchorElement {
    const a = document.createElement('a');
    a.textContent = text;
    a.className = `button ${className}`;

    return a;
}

export function makeTableContainer(table?: HTMLTableElement): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'table-container pb-2';

    if (table) {
        container.append(table);
    }

    return container;
}

export function makeTable(headCols: string[], footCols: string[], rows: TableCellData[][], sortable: boolean = false): HTMLTableElement {
    const table = document.createElement('table');
    const tBody = document.createElement('tbody');
    table.className = `table is-fullwidth is-narrow is-hoverable is-bordered ${sortable ? 'is-clickable' : ''}`;

    if (headCols.length > 0) {
        const tHead = document.createElement('thead');
        const tr = document.createElement('tr');
        const cols: HTMLTableCellElement[] = [];

        for (const headCol of headCols) {
            const th = document.createElement('th');
            th.innerHTML = headCol;

            tr.append(th);
            cols.push(th);
        }

        if (sortable) {
            for (const [i, col] of cols.entries()) {
                col.addEventListener('click', () => {
                    sortTable(tBody, i);
                });
            }
        }

        tHead.append(tr);
        table.append(tHead);
    }

    if (rows.length > 0) {
        for (const row of rows) {
            const tr = document.createElement('tr');

            for (const cell of row) {
                const td = document.createElement('td');
                td.innerHTML = cell.content;

                if (cell.className) {
                    td.className = cell.className;
                }

                tr.append(td);
            }

            tBody.append(tr);
        }
    }

    table.append(tBody);

    if (footCols.length > 0) {
        const tFoot = document.createElement('tfoot');
        const tr = document.createElement('tr');

        for (const footCol of footCols) {
            const th = document.createElement('th');
            th.innerHTML = footCol;

            tr.append(th);
        }

        tFoot.append(tr);
        table.append(tFoot);
    }

    return table;
}

export function makeList(items: string[]): HTMLUListElement {
    const list = document.createElement('ul');

    for (const item of items) {
        const listItem = document.createElement('li');
        listItem.innerHTML = item;

        list.append(listItem);
    }

    return list;
}

export function makeListCard(title: string, listItems: string[]): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'card';

    const cardHeader = document.createElement('header');
    cardHeader.className = 'card-header';

    const cardTitle = document.createElement('p');
    cardTitle.className = 'card-header-title';
    cardTitle.innerHTML = title;

    cardHeader.append(cardTitle);
    card.append(cardHeader);

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const content = document.createElement('div');
    content.className = 'content';

    const list = makeList(listItems);

    content.append(list);
    cardContent.append(content);
    card.append(cardContent);

    return card;
}

export function makeMessage(title: string, message: string, className: string = ''): HTMLElement {
    const article = document.createElement('article');
    article.className = `message ${className}`;

    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = title;

    article.append(header);

    if (message !== '') {
        const body = document.createElement('div');
        body.className = 'message-body';
        body.innerHTML = message;

        article.append(body);
    }

    return article;
}

export function sortTable(tableBody: HTMLTableSectionElement, colIndex: number): void {
    const rowsArray = [...tableBody.rows];
    let order: 'asc' | 'desc' = 'desc';
    const tableSorting = tableBody.getAttribute('sorting');

    if (tableSorting && tableSorting !== '') {
        const lastSorting = tableSorting.split('.');

        if (Number.parseInt(lastSorting[0], 10) === colIndex && lastSorting[1] === 'desc') {
            order = 'asc';
        }
    }

    const sortFn =
        order === 'desc'
            ? (a: HTMLTableRowElement, b: HTMLTableRowElement): number =>
                  b.cells[colIndex].innerHTML.localeCompare(a.cells[colIndex].innerHTML, undefined, { numeric: true })
            : (a: HTMLTableRowElement, b: HTMLTableRowElement): number =>
                  a.cells[colIndex].innerHTML.localeCompare(b.cells[colIndex].innerHTML, undefined, { numeric: true });

    rowsArray.sort(sortFn);

    tableBody.setAttribute('sorting', `${colIndex}.${order}`);

    const tableHeadCols = tableBody.previousElementSibling?.children[0];

    if (tableHeadCols) {
        for (let i = 0; i < tableHeadCols.children.length; i++) {
            tableHeadCols.children[i].className = i === colIndex ? `is-sorted-${order}` : '';
        }
    }

    tableBody.append(...rowsArray);
}
