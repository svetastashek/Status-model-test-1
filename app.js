const archiveSegmentTooltips = {
  delivery: [
    'Транспортная накладная подписана грузоотправителем 31 июля 10:26 (UTC +03:00)',
    'Транспортная накладная подписана перевозчиком на погрузке 4 августа 18:08 (UTC +03:00)',
    'Получатель принял груз полностью 4 августа 18:11 (UTC +03:00)',
  ],
  'carrier-rejection': [
    'Транспортная накладная подписана грузоотправителем 31 июля 10:26 (UTC +03:00)',
  ],
  'transport-cost': [
    'Титул стоимости подписан грузоотправителем 23 июля 16:30 (UTC +03:00)',
  ],
};

document.querySelectorAll('#counterpartyApplicationRows .table-row').forEach((row) => {
  if (row.dataset.status === 'carrier-error' || row.querySelector('.striped')) row.remove();
});

const archiveRowsContainer = document.querySelector('#archiveRows');
const trashRowSources = [
  document.querySelector('#draftRows .table-row:nth-child(2)'),
  document.querySelector('#rows .table-row:nth-child(1)'),
  document.querySelector('#counterpartyRows .table-row:nth-child(3)'),
  archiveRowsContainer.querySelector('[data-archive-section="completed"]'),
  archiveRowsContainer.querySelector('[data-archive-section="rejected"]'),
];

trashRowSources.forEach((sourceRow) => {
  const trashRow = sourceRow.cloneNode(true);
  trashRow.dataset.archiveSection = 'trash';
  if (sourceRow.closest('#draftRows')) trashRow.dataset.status = 'draft';
  trashRow.hidden = false;
  trashRow.querySelectorAll('.progress-tooltip').forEach((tooltip) => {
    const segment = tooltip.parentElement;
    if (!segment.dataset.tooltip) segment.dataset.tooltip = tooltip.textContent.trim();
    segment.removeAttribute('aria-describedby');
    tooltip.remove();
  });
  archiveRowsContainer.append(trashRow);
});

const archiveApplicationRowsContainer = document.querySelector('#archiveApplicationRows');
const archiveAllDraftApplications = [...document.querySelectorAll('#draftApplicationRows .table-row')]
  .slice(0, 3)
  .map((sourceRow) => {
    const draftRow = sourceRow.cloneNode(true);
    draftRow.dataset.archiveSection = 'all';
    draftRow.dataset.status = 'draft';
    draftRow.hidden = false;
    archiveApplicationRowsContainer.append(draftRow);
    return draftRow;
  });
const completedArchiveApplications = [...archiveApplicationRowsContainer.querySelectorAll('[data-archive-section="completed"]')];
const rejectedArchiveApplications = [...archiveApplicationRowsContainer.querySelectorAll('[data-archive-section="rejected"]')];
const mixedArchiveApplications = [];
while (completedArchiveApplications.length || archiveAllDraftApplications.length || rejectedArchiveApplications.length) {
  if (completedArchiveApplications.length) mixedArchiveApplications.push(completedArchiveApplications.shift());
  if (archiveAllDraftApplications.length) mixedArchiveApplications.push(archiveAllDraftApplications.shift());
  if (rejectedArchiveApplications.length) mixedArchiveApplications.push(rejectedArchiveApplications.shift());
}
mixedArchiveApplications.forEach((row) => archiveApplicationRowsContainer.append(row));

const trashApplicationSources = [
  document.querySelector('#draftApplicationRows .table-row:nth-child(1)'),
  document.querySelector('#applicationRows .table-row:nth-child(1)'),
  document.querySelector('#applicationRows [data-status="error"]'),
  document.querySelector('#counterpartyApplicationRows .table-row:nth-child(1)'),
  archiveApplicationRowsContainer.querySelector('[data-archive-section="completed"]'),
  archiveApplicationRowsContainer.querySelector('[data-archive-section="rejected"]'),
];

trashApplicationSources.forEach((sourceRow) => {
  const trashApplication = sourceRow.cloneNode(true);
  trashApplication.dataset.archiveSection = 'trash';
  if (sourceRow.closest('#draftApplicationRows')) trashApplication.dataset.status = 'draft';
  trashApplication.hidden = false;
  archiveApplicationRowsContainer.append(trashApplication);
});

const rejectedArchiveRows = [...archiveRowsContainer.querySelectorAll('[data-archive-section="rejected"]')];
const rejectedByCarrier = rejectedArchiveRows.filter((row) => row.dataset.status === 'carrier-rejection');
const rejectedByCost = rejectedArchiveRows.filter((row) => row.dataset.status === 'transport-cost');
const mixedRejectedRows = [];
while (rejectedByCarrier.length || rejectedByCost.length) {
  if (rejectedByCarrier.length) mixedRejectedRows.push(rejectedByCarrier.shift());
  if (rejectedByCost.length) mixedRejectedRows.push(rejectedByCost.shift());
}
mixedRejectedRows.forEach((row) => archiveRowsContainer.append(row));

document.querySelectorAll('#archiveRows .progress').forEach((progress) => {
  const row = progress.closest('.table-row');
  const previousStageTooltips = archiveSegmentTooltips[row.dataset.status] || [];
  [...progress.children].forEach((segment, segmentIndex) => {
    if (!segment.classList.contains('solid-segment')) return;
    const interactiveSegment = document.createElement('button');
    interactiveSegment.className = 'solid-step';
    interactiveSegment.type = 'button';
    interactiveSegment.dataset.tooltip = previousStageTooltips[segmentIndex] || 'Этап документа завершен';
    segment.replaceWith(interactiveSegment);
  });
});

document.querySelectorAll('.progress [data-tooltip]').forEach((segment, index) => {
  const tooltip = document.createElement('span');
  const tooltipId = `generated-progress-tooltip-${index + 1}`;
  tooltip.className = 'progress-tooltip t-body-s';
  tooltip.id = tooltipId;
  tooltip.setAttribute('role', 'tooltip');
  let tooltipText = segment.dataset.tooltip;
  if (segment.closest('[data-status="waiting"]') && !tooltipText.endsWith('Ожидает подпись отправителя')) {
    tooltipText += ' Ожидает подпись отправителя';
  }
  const archiveSection = segment.closest('[data-archive-section]')?.dataset.archiveSection;
  const isFinalArchiveDocument = archiveSection === 'completed' || archiveSection === 'rejected';
  if (!isFinalArchiveDocument && tooltipText.startsWith('Заказ-заявка подписана грузоотправителем') && !tooltipText.endsWith('Ожидает подпись перевозчика')) {
    tooltipText += ' Ожидает подпись перевозчика';
  }
  const waitingMatch = tooltipText.match(/^(.*) (Ожида(?:ет|ется) подпись (?:водителя|перевозчика|отправителя))$/);
  tooltip.append(document.createTextNode(waitingMatch ? waitingMatch[1] : tooltipText));
  if (waitingMatch) {
    tooltip.append(document.createElement('br'));
    tooltip.append(document.createTextNode(waitingMatch[2]));
  }

  const pointer = document.createElement('img');
  pointer.src = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjcuNTg1NzkiIHZpZXdCb3g9IjAgMCAxNiA3LjU4NTc5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iUG9pbnRlciIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03LjI5Mjg5IDAuMjkyODkzQzcuNjgzNDIgLTAuMDk3NjMxNCA4LjMxNjU4IC0wLjA5NzYzMDcgOC43MDcxMSAwLjI5Mjg5NEwxNiA3LjU4NTc5SDBMNy4yOTI4OSAwLjI5Mjg5M1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
  pointer.alt = '';
  tooltip.append(pointer);
  segment.setAttribute('aria-describedby', tooltipId);
  segment.append(tooltip);
});

const rows = [...document.querySelectorAll('.table-row')];
const organizationStatuses = ['observer-signer', 'observer', 'signer'];
const applicationSupplyPoints = [
  'Москва, Складочная улица, 1',
  'Санкт-Петербург, Софийская улица, 96',
  'Екатеринбург, Сибирский тракт, 12',
  'Казань, улица Аделя Кутуя, 151',
  'Новосибирск, Толмачёвская улица, 43',
];
rows.forEach((row, index) => {
  row.dataset.orgStatus = organizationStatuses[index % organizationStatuses.length];
  if (row.closest('#applicationRows, #counterpartyApplicationRows, #draftApplicationRows, #archiveApplicationRows')) {
    row.dataset.carrier = row.querySelector('.invoice-cell').nextElementSibling.querySelector('strong')?.textContent.trim() || '';
    row.dataset.supplyPoint = applicationSupplyPoints[index % applicationSupplyPoints.length];
  }
  const invoiceName = row.querySelector('.invoice-cell strong').textContent;
  const documentName = row.closest('#applicationRows, #counterpartyApplicationRows, #draftApplicationRows, #archiveApplicationRows') ? 'заявку' : 'накладную';
  const checkLabel = document.createElement('label');
  checkLabel.className = 'row-check';

  const checkbox = document.createElement('input');
  checkbox.className = 'row-checkbox';
  checkbox.type = 'checkbox';
  checkbox.setAttribute('aria-label', `Выбрать ${documentName} ${invoiceName}`);
  checkLabel.append(checkbox);
  row.prepend(checkLabel);

  const actionsButton = document.createElement('button');
  actionsButton.className = 'row-actions';
  actionsButton.type = 'button';
  actionsButton.setAttribute('aria-label', `Действия: ${documentName} ${invoiceName}`);
  row.append(actionsButton);
});

const rowGroups = {
  requires: document.querySelector('#rows'),
  counterparty: document.querySelector('#counterpartyRows'),
  drafts: document.querySelector('#draftRows'),
  archive: document.querySelector('#archiveRows'),
};
const applicationRows = document.querySelector('#applicationRows');
const counterpartyApplicationRows = document.querySelector('#counterpartyApplicationRows');
const draftApplicationRows = document.querySelector('#draftApplicationRows');
const applicationRowGroups = {
  requires: applicationRows,
  counterparty: counterpartyApplicationRows,
  drafts: draftApplicationRows,
  archive: document.querySelector('#archiveApplicationRows'),
};
const invoiceTableHead = document.querySelector('#invoiceTableHead');
const applicationTableHead = document.querySelector('#applicationTableHead');
const tableWrap = document.querySelector('.table-wrap');
const assignmentsEmpty = document.querySelector('#assignmentsEmpty');
const search = document.querySelector('#search');
const searchClear = document.querySelector('#searchClear');
const invoiceStatusFilter = document.querySelector('#invoiceStatusFilter');
const invoiceStatusTrigger = document.querySelector('#invoiceStatusTrigger');
const invoiceStatusLabel = document.querySelector('#invoiceStatusLabel');
const invoiceStatusDropdown = document.querySelector('#invoiceStatusDropdown');
const invoiceStatusOptions = [...invoiceStatusDropdown.querySelectorAll('[role="option"]')];
const toolbar = document.querySelector('.toolbar');
const topStatusControl = document.querySelector('.top-status-control');
const filterButton = document.querySelector('#filterButton');
const filterPanel = document.querySelector('#filterPanel');
const senderFilter = document.querySelector('#senderFilter');
const recipientFilter = document.querySelector('#recipientFilter');
const customerFilter = document.querySelector('#customerFilter');
const carrierFilter = document.querySelector('#carrierFilter');
const applicationCarrierFilter = document.querySelector('#applicationCarrierFilter');
const applicationSupplyPointFilter = document.querySelector('#applicationSupplyPointFilter');
const loadingAddressFilter = document.querySelector('#loadingAddressFilter');
const unloadingAddressFilter = document.querySelector('#unloadingAddressFilter');
const dateFromFilter = document.querySelector('#dateFromFilter');
const dateToFilter = document.querySelector('#dateToFilter');
const statusFilter = document.querySelector('#statusFilter');
const applyFilters = document.querySelector('#applyFilters');
const resetFilters = document.querySelector('#resetFilters');
const advancedFilterControls = [invoiceStatusFilter, senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter, applicationSupplyPointFilter, loadingAddressFilter, unloadingAddressFilter, dateFromFilter, dateToFilter, statusFilter];
const enhancedFilterSelects = new Map();
const searchableFilterSelects = new Set([senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter]);
const emptyState = document.querySelector('#emptyState');
const pageTitle = document.querySelector('#pageTitle');
const sectionButtons = [...document.querySelectorAll('[data-view]')];
const documentsInProgressNav = document.querySelector('#documentsInProgressNav');
const documentSubnavButtons = [document.querySelector('#requiresActionsNav'), document.querySelector('#counterpartyNav')];
const archiveNav = document.querySelector('#archiveNav');
const archiveSubnavButtons = [
  document.querySelector('#archiveAllNav'),
  document.querySelector('#archiveCompletedNav'),
  document.querySelector('#archiveRejectedNav'),
  document.querySelector('#archiveTrashNav'),
];
const applicationTab = document.querySelector('.tabs [data-tab="Заявки"]');
const assignmentsTab = document.querySelector('.tabs [data-tab="Поручения"]');
const helpButton = document.querySelector('#helpButton');
const helpPopover = document.querySelector('#helpPopover');
const toast = document.querySelector('#toast');
let activeView = 'requires';
let activeDocumentTab = 'applications';
let appliedFilters = {};

function getViewGroupKey(view = activeView) {
  return view.startsWith('archive-') ? 'archive' : view;
}

function getUniqueDocumentRows(rows) {
  const documentNumbers = new Set();
  return rows.filter((row) => {
    const documentNumber = row.querySelector('.invoice-cell strong')?.textContent.trim();
    if (!documentNumber || documentNumbers.has(documentNumber)) return false;
    documentNumbers.add(documentNumber);
    return true;
  });
}

function getActiveRows() {
  const groupKey = getViewGroupKey();
  if (activeDocumentTab === 'applications') {
    const group = applicationRowGroups[groupKey];
    if (!group) return [];
    const groupRows = [...group.querySelectorAll('.table-row')];
    if (!activeView.startsWith('archive-')) return groupRows;
    if (activeView === 'archive-all') return getUniqueDocumentRows(groupRows);
    return groupRows.filter((row) => `archive-${row.dataset.archiveSection}` === activeView);
  }
  if (activeDocumentTab === 'assignments') return [];
  const group = rowGroups[groupKey];
  if (!group) return [];
  const groupRows = [...group.querySelectorAll('.table-row')];
  if (!activeView.startsWith('archive-')) return groupRows;
  if (activeView === 'archive-all') return getUniqueDocumentRows(groupRows);
  return groupRows.filter((row) => `archive-${row.dataset.archiveSection}` === activeView);
}

function getActiveSelectAll() {
  return document.querySelector(activeDocumentTab === 'applications' ? '#applicationSelectAll' : '#selectAll');
}

function syncSelectAll() {
  const activeRows = getActiveRows();
  const checkedRows = activeRows.filter((row) => row.querySelector('.row-checkbox').checked);
  const selectAll = getActiveSelectAll();
  selectAll.checked = activeRows.length > 0 && checkedRows.length === activeRows.length;
  selectAll.indeterminate = checkedRows.length > 0 && checkedRows.length < activeRows.length;
}

function getRowCells(row) {
  const invoice = row.querySelector('.invoice-cell');
  const sender = invoice.nextElementSibling;
  const recipient = sender.nextElementSibling;
  return { invoice, sender, recipient };
}

function getCustomSelectOptions(select) {
  const parts = enhancedFilterSelects.get(select);
  return parts ? [...parts.dropdown.querySelectorAll('[role="option"]')] : [];
}

function closeCustomFilterSelect(select, { restoreFocus = false } = {}) {
  const parts = enhancedFilterSelects.get(select);
  if (!parts) return;
  parts.dropdown.hidden = true;
  parts.trigger.setAttribute('aria-expanded', 'false');
  if (parts.input) parts.input.setAttribute('aria-expanded', 'false');
  getCustomSelectOptions(select).forEach((option) => option.classList.remove('is-active'));
  if (restoreFocus) {
    parts.suppressOpen = true;
    (parts.input || parts.trigger).focus();
    queueMicrotask(() => { parts.suppressOpen = false; });
  }
}

function closeAllCustomFilterSelects(exceptSelect = null) {
  enhancedFilterSelects.forEach((parts, select) => {
    if (select !== exceptSelect) closeCustomFilterSelect(select);
  });
}

function renderCustomFilterOptions(select, query = '') {
  const parts = enhancedFilterSelects.get(select);
  if (!parts) return;
  parts.dropdown.replaceChildren();
  const normalizedQuery = query.trim().toLocaleLowerCase('ru');
  let availableOptions = [...select.options].filter((option) => option.value);
  if (parts.searchable) {
    availableOptions = normalizedQuery
      ? availableOptions.filter((option) => option.textContent.toLocaleLowerCase('ru').includes(normalizedQuery))
      : [];
  }

  if (!availableOptions.length) {
    const empty = document.createElement('div');
    empty.className = 'custom-filter-empty';
    empty.textContent = 'Не найдено';
    parts.dropdown.append(empty);
    return;
  }

  availableOptions.forEach((option) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'option');
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.setAttribute('aria-selected', String(option.value === select.value));
    item.addEventListener('click', () => {
      select.value = option.value;
      syncCustomFilterSelect(select);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closeCustomFilterSelect(select, { restoreFocus: true });
    });
    item.addEventListener('keydown', (event) => {
      const items = getCustomSelectOptions(select);
      const currentIndex = items.indexOf(item);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        item.classList.remove('is-active');
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const next = items[(currentIndex + direction + items.length) % items.length];
        next.classList.add('is-active');
        next.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomFilterSelect(select, { restoreFocus: true });
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        item.classList.remove('is-active');
        const target = event.key === 'Home' ? items[0] : items.at(-1);
        target.classList.add('is-active');
        target.focus();
      }
    });
    parts.dropdown.append(item);
  });
}

function syncCustomFilterSelect(select) {
  const parts = enhancedFilterSelects.get(select);
  if (!parts) return;
  const selectedOption = [...select.options].find((option) => option.value === select.value) || select.options[0];
  const selectedText = selectedOption ? selectedOption.textContent : '';
  if (parts.searchable) {
    parts.input.value = select.value ? selectedText : '';
  } else {
    parts.label.textContent = selectedText;
  }
  parts.trigger.classList.toggle('has-value', Boolean(select.value));
  renderCustomFilterOptions(select, parts.searchable ? parts.input.value : '');
}

function openCustomFilterSelect(select) {
  const parts = enhancedFilterSelects.get(select);
  if (!parts || !parts.dropdown.hidden) return;
  closeAllCustomFilterSelects(select);
  closeInvoiceStatusDropdown();
  renderCustomFilterOptions(select, parts.input ? parts.input.value : '');
  parts.dropdown.hidden = false;
  parts.trigger.setAttribute('aria-expanded', 'true');
  if (parts.input) {
    parts.input.setAttribute('aria-expanded', 'true');
    parts.input.focus();
    return;
  }
  const items = getCustomSelectOptions(select);
  const selectedItem = items.find((item) => item.getAttribute('aria-selected') === 'true');
  const firstItem = selectedItem || items[0];
  if (firstItem) {
    firstItem.classList.add('is-active');
    firstItem.focus();
  }
}

function enhanceFilterSelect(select) {
  const searchable = searchableFilterSelects.has(select);
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-control custom-filter-select';
  if (select.classList.contains('status-control')) wrapper.classList.add('status-control');
  select.before(wrapper);
  wrapper.append(select);
  select.className = 'custom-filter-native';
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;

  const trigger = document.createElement(searchable ? 'div' : 'button');
  trigger.className = 'custom-filter-trigger';
  if (!searchable) {
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
  } else {
    trigger.classList.add('custom-filter-combobox');
  }
  trigger.setAttribute('aria-expanded', 'false');
  const label = searchable ? null : document.createElement('span');
  const input = searchable ? document.createElement('input') : null;
  if (input) {
    input.className = 'custom-filter-search';
    input.type = 'text';
    input.placeholder = select.options[0]?.textContent || '';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-label', select.options[0]?.textContent || 'Поиск организации');
  }
  const arrow = document.createElement('img');
  arrow.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzQwMDAwMDk3XzI2NDcwNykiPgo8cGF0aCBkPSJNMTYuNjAzOCA3LjAyMTQ1QzE2Ljc5OTEgNy4yMTY3MSAxNi43OTkxIDcuNTMzMjkgMTYuNjAzOCA3LjcyODU1TDExLjc2NzkgMTIuNTY0NUMxMC43OTE2IDEzLjU0MDggOS4yMDg2NyAxMy41NDA4IDguMjMyMzYgMTIuNTY0NUwzLjM5NjQ1IDcuNzI4NTVDMy4yMDExOCA3LjUzMzI5IDMuMjAxMTggNy4yMTY3MSAzLjM5NjQ1IDcuMDIxNDVDMy41OTE3MSA2LjgyNjE4IDMuOTA4MjkgNi44MjYxOCA0LjEwMzU1IDcuMDIxNDVMOC45Mzk0NyAxMS44NTc0QzkuNTI1MjYgMTIuNDQzMiAxMC40NzUgMTIuNDQzMiAxMS4wNjA4IDExLjg1NzRMMTUuODk2NyA3LjAyMTQ1QzE2LjA5MiA2LjgyNjE5IDE2LjQwODYgNi44MjYxOSAxNi42MDM4IDcuMDIxNDVaIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjU2Ii8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNDAwMDAwOTdfMjY0NzA3Ij4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=';
  arrow.alt = '';
  trigger.append(input || label, arrow);

  const dropdown = document.createElement('div');
  dropdown.className = 'custom-filter-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-label', select.options[0]?.textContent || 'Выберите значение');
  dropdown.hidden = true;
  wrapper.append(trigger, dropdown);
  enhancedFilterSelects.set(select, { wrapper, trigger, label, input, dropdown, searchable });
  syncCustomFilterSelect(select);

  trigger.addEventListener('click', (event) => {
    if (searchable && event.target !== arrow) {
      openCustomFilterSelect(select);
      return;
    }
    if (dropdown.hidden) openCustomFilterSelect(select);
    else closeCustomFilterSelect(select, { restoreFocus: true });
  });

  if (input) {
    input.addEventListener('focus', () => {
      if (!enhancedFilterSelects.get(select).suppressOpen) openCustomFilterSelect(select);
    });
    input.addEventListener('input', () => {
      select.value = '';
      trigger.classList.remove('has-value');
      if (dropdown.hidden) openCustomFilterSelect(select);
      renderCustomFilterOptions(select, input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        const firstItem = getCustomSelectOptions(select)[0];
        if (firstItem) {
          event.preventDefault();
          firstItem.classList.add('is-active');
          firstItem.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomFilterSelect(select, { restoreFocus: true });
      }
    });
  }
}

function fillFilterOptions(select, values) {
  const selectedValue = select.value;
  select.length = 1;
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru')).forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  if ([...select.options].some((option) => option.value === selectedValue)) select.value = selectedValue;
  select.classList.toggle('has-value', Boolean(select.value));
  syncCustomFilterSelect(select);
}

function populateFilterOptions() {
  if (activeDocumentTab === 'applications') {
    const activeRows = getActiveRows();
    fillFilterOptions(applicationCarrierFilter, activeRows.map((row) => row.dataset.carrier).filter(Boolean));
    fillFilterOptions(applicationSupplyPointFilter, activeRows.map((row) => row.dataset.supplyPoint));
    [senderFilter, carrierFilter, recipientFilter, customerFilter].forEach((select) => fillFilterOptions(select, []));
    return;
  }
  const senders = getActiveRows().map((row) => getRowCells(row).sender.querySelector('strong')?.textContent.trim() || '').filter(Boolean);
  const recipients = getActiveRows().map((row) => getRowCells(row).recipient.querySelector('strong')?.textContent.trim() || '').filter(Boolean);
  fillFilterOptions(senderFilter, senders);
  fillFilterOptions(carrierFilter, senders);
  fillFilterOptions(recipientFilter, recipients);
  fillFilterOptions(customerFilter, recipients);
}

function readAdvancedFilters() {
  return {
    invoiceStatus: invoiceStatusFilter.value,
    sender: senderFilter.value,
    recipient: recipientFilter.value,
    customer: customerFilter.value,
    carrier: carrierFilter.value,
    applicationCarrier: applicationCarrierFilter.value,
    applicationSupplyPoint: applicationSupplyPointFilter.value,
    loadingAddress: loadingAddressFilter.value.trim().toLocaleLowerCase('ru'),
    unloadingAddress: unloadingAddressFilter.value.trim().toLocaleLowerCase('ru'),
    dateFrom: dateFromFilter.value,
    dateTo: dateToFilter.value,
    status: statusFilter.value,
  };
}

function getInvoiceDate(invoice) {
  const dateText = invoice.querySelector('.muted').textContent;
  const match = dateText.match(/(\d{2})\.(\d{2})/);
  const year = activeDocumentTab === 'applications' || activeView === 'drafts' ? '2026' : '2024';
  return match ? `${year}-${match[2]}-${match[1]}` : '';
}

function matchesAdvancedFilters(row) {
  if (activeDocumentTab === 'applications') {
    const applicationDate = getInvoiceDate(row.querySelector('.invoice-cell'));
    return (!appliedFilters.invoiceStatus || row.dataset.status === appliedFilters.invoiceStatus)
      && (!appliedFilters.applicationCarrier || row.dataset.carrier === appliedFilters.applicationCarrier)
      && (!appliedFilters.applicationSupplyPoint || row.dataset.supplyPoint === appliedFilters.applicationSupplyPoint)
      && (!appliedFilters.dateFrom || applicationDate >= appliedFilters.dateFrom)
      && (!appliedFilters.dateTo || applicationDate <= appliedFilters.dateTo);
  }
  const { invoice, sender, recipient } = getRowCells(row);
  const senderName = sender.querySelector('strong')?.textContent.trim() || '';
  const recipientName = recipient.querySelector('strong')?.textContent.trim() || '';
  const address = recipient.textContent.toLocaleLowerCase('ru');
  const invoiceDate = getInvoiceDate(invoice);
  return (!appliedFilters.invoiceStatus || row.dataset.status === appliedFilters.invoiceStatus)
    && (!appliedFilters.sender || senderName === appliedFilters.sender)
    && (!appliedFilters.recipient || recipientName === appliedFilters.recipient)
    && (!appliedFilters.customer || recipientName === appliedFilters.customer)
    && (!appliedFilters.carrier || senderName === appliedFilters.carrier)
    && (!appliedFilters.loadingAddress || address.includes(appliedFilters.loadingAddress))
    && (!appliedFilters.unloadingAddress || address.includes(appliedFilters.unloadingAddress))
    && (!appliedFilters.dateFrom || invoiceDate >= appliedFilters.dateFrom)
    && (!appliedFilters.dateTo || invoiceDate <= appliedFilters.dateTo)
    && (!appliedFilters.status || row.dataset.orgStatus === appliedFilters.status);
}

function resetAdvancedFilters(update = true) {
  advancedFilterControls.forEach((control) => {
    control.value = '';
    control.classList.remove('has-value');
  });
  setInvoiceStatus('', 'Все статусы');
  enhancedFilterSelects.forEach((parts, select) => syncCustomFilterSelect(select));
  closeAllCustomFilterSelects();
  appliedFilters = {};
  if (update) updateRows();
}

function updateFilterPanelFields() {
  const applicationsMode = activeDocumentTab === 'applications';
  const archiveApplicationsWithoutStatusFilter = activeView === 'archive-completed' || activeView === 'archive-rejected';
  topStatusControl.hidden = applicationsMode && (activeView === 'counterparty' || archiveApplicationsWithoutStatusFilter);
  filterPanel.classList.toggle('applications-mode', applicationsMode);
  document.querySelector('#applicationFilterRow').hidden = !applicationsMode;
  document.querySelectorAll('.invoice-filter-row').forEach((row) => { row.hidden = applicationsMode; });
  const organizationStatusParts = enhancedFilterSelects.get(statusFilter);
  if (organizationStatusParts) organizationStatusParts.wrapper.hidden = applicationsMode;
}

function getSearchTextNodes(row) {
  const textNodes = [];

  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue.trim()) textNodes.push(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node !== row && node.matches('.progress, .row-check, .row-actions')) return;
    node.childNodes.forEach(visit);
  }

  visit(row);
  return textNodes;
}

function clearSearchHighlights() {
  document.querySelectorAll('.search-highlight').forEach((highlight) => {
    highlight.replaceWith(document.createTextNode(highlight.textContent));
  });
  rows.forEach((row) => row.normalize());
}

function getSearchPattern(term) {
  const compactNumber = term.replace(/\D/g, '');
  if (/^[\d\s()+-]+$/.test(term) && compactNumber.length > 1) {
    return compactNumber.split('').join('[\\s()+-]*');
  }
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchMatches(row, terms) {
  if (!terms.length) return;
  const escapedTerms = terms
    .map(getSearchPattern)
    .sort((a, b) => b.length - a.length);
  const matchPattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  getSearchTextNodes(row).forEach((textNode) => {
    const parts = textNode.nodeValue.split(matchPattern);
    if (parts.length === 1) return;
    const fragment = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (index % 2 === 1) {
        const highlight = document.createElement('mark');
        highlight.className = 'search-highlight';
        highlight.textContent = part;
        fragment.append(highlight);
      } else if (part) {
        fragment.append(document.createTextNode(part));
      }
    });
    textNode.replaceWith(fragment);
  });
}

function updateRows() {
  clearSearchHighlights();
  searchClear.hidden = search.value.length === 0;
  const terms = search.value.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
  const activeRows = getActiveRows();
  if (getViewGroupKey() === 'archive') {
    const archiveGroup = activeDocumentTab === 'applications' ? applicationRowGroups.archive : rowGroups.archive;
    archiveGroup.querySelectorAll('.table-row').forEach((row) => {
      row.hidden = !activeRows.includes(row);
    });
  }
  let visible = 0;
  activeRows.forEach((row) => {
    const searchTarget = activeDocumentTab === 'applications' ? row.querySelector('.invoice-cell') : row;
    const searchTextNodes = getSearchTextNodes(searchTarget);
    const matchesText = terms.every((term) => {
      const termPattern = new RegExp(getSearchPattern(term), 'i');
      return searchTextNodes.some((node) => termPattern.test(node.nodeValue));
    });
    const matchesFilter = matchesAdvancedFilters(row);
    row.hidden = !(matchesText && matchesFilter);
    if (!row.hidden) {
      visible += 1;
      highlightSearchMatches(row, terms);
    }
  });
  emptyState.querySelector('strong').textContent = activeDocumentTab === 'applications'
    ? activeView.startsWith('archive-') ? 'Заказы-заявки не найдены' : 'Заявки не найдены'
    : 'Накладные не найдены';
  emptyState.hidden = visible !== 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 1800);
}

search.addEventListener('input', updateRows);
searchClear.addEventListener('click', () => {
  search.value = '';
  updateRows();
  search.focus();
});

filterButton.addEventListener('click', () => {
  const willOpen = filterPanel.hidden;
  filterPanel.hidden = !willOpen;
  filterButton.setAttribute('aria-expanded', String(willOpen));
  toolbar.classList.toggle('filters-open', willOpen);
  if (willOpen) populateFilterOptions();
  else closeAllCustomFilterSelects();
});

function closeInvoiceStatusDropdown({ restoreFocus = false } = {}) {
  invoiceStatusDropdown.hidden = true;
  invoiceStatusTrigger.setAttribute('aria-expanded', 'false');
  invoiceStatusOptions.forEach((option) => option.classList.remove('is-active'));
  if (restoreFocus) invoiceStatusTrigger.focus();
}

function getVisibleInvoiceStatusOptions() {
  return invoiceStatusOptions.filter((option) => !option.hidden);
}

function openInvoiceStatusDropdown() {
  invoiceStatusDropdown.hidden = false;
  invoiceStatusTrigger.setAttribute('aria-expanded', 'true');
  const visibleOptions = getVisibleInvoiceStatusOptions();
  const selectedOption = visibleOptions.find((option) => option.getAttribute('aria-selected') === 'true');
  const firstOption = selectedOption || visibleOptions[0];
  firstOption.classList.add('is-active');
  firstOption.focus();
}

function setInvoiceStatus(value, label) {
  invoiceStatusFilter.value = value;
  invoiceStatusLabel.textContent = label;
  invoiceStatusTrigger.classList.toggle('has-value', Boolean(value));
  invoiceStatusOptions.forEach((option) => {
    option.setAttribute('aria-selected', String(option.dataset.value === value));
  });
}

function selectInvoiceStatus(option) {
  setInvoiceStatus(option.dataset.value, option.textContent.trim());
  appliedFilters.invoiceStatus = invoiceStatusFilter.value;
  closeInvoiceStatusDropdown({ restoreFocus: true });
  updateRows();
}

function updateInvoiceStatusOptions() {
  const activeStatusView = getViewGroupKey();
  invoiceStatusOptions.forEach((option) => {
    const optionStatusView = option.dataset.statusView || '';
    const allowedArchiveViews = option.dataset.archiveViews?.split(',') || [];
    const isAllowedArchiveView = !allowedArchiveViews.length || allowedArchiveViews.includes(activeView);
    option.hidden = activeDocumentTab === 'applications'
      ? (option.dataset.documentTab !== 'applications' || (Boolean(optionStatusView) && optionStatusView !== activeStatusView) || !isAllowedArchiveView) && Boolean(option.dataset.value)
      : option.dataset.documentTab === 'applications' || (Boolean(optionStatusView) && optionStatusView !== activeStatusView) || !isAllowedArchiveView;
  });
}

invoiceStatusTrigger.addEventListener('click', () => {
  if (invoiceStatusDropdown.hidden) openInvoiceStatusDropdown();
  else closeInvoiceStatusDropdown();
});

invoiceStatusOptions.forEach((option) => {
  option.addEventListener('click', () => selectInvoiceStatus(option));
  option.addEventListener('keydown', (event) => {
    const visibleOptions = getVisibleInvoiceStatusOptions();
    const currentIndex = visibleOptions.indexOf(option);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      option.classList.remove('is-active');
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + direction + visibleOptions.length) % visibleOptions.length;
      visibleOptions[nextIndex].classList.add('is-active');
      visibleOptions[nextIndex].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeInvoiceStatusDropdown({ restoreFocus: true });
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      option.classList.remove('is-active');
      const target = event.key === 'Home' ? visibleOptions[0] : visibleOptions.at(-1);
      target.classList.add('is-active');
      target.focus();
    }
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.status-select')) closeInvoiceStatusDropdown();
  if (!event.target.closest('.custom-filter-select')) closeAllCustomFilterSelects();
});

advancedFilterControls.filter((control) => control.tagName === 'SELECT').forEach((select) => {
  select.addEventListener('change', () => select.classList.toggle('has-value', Boolean(select.value)));
});

[dateFromFilter, dateToFilter].forEach((dateInput) => {
  dateInput.addEventListener('input', () => dateInput.classList.toggle('has-value', Boolean(dateInput.value)));
});

applyFilters.addEventListener('click', () => {
  appliedFilters = readAdvancedFilters();
  updateRows();
});

resetFilters.addEventListener('click', () => resetAdvancedFilters());

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeView = button.dataset.view;
    const activeGroupKey = getViewGroupKey();
    const documentsSectionExpanded = activeView === 'requires' || activeView === 'counterparty';
    const archiveSectionExpanded = activeView.startsWith('archive-');
    documentsInProgressNav.setAttribute('aria-expanded', String(documentsSectionExpanded));
    documentSubnavButtons.forEach((item) => { item.hidden = !documentsSectionExpanded; });
    archiveNav.setAttribute('aria-expanded', String(archiveSectionExpanded));
    archiveSubnavButtons.forEach((item) => { item.hidden = !archiveSectionExpanded; });
    applicationTab.textContent = archiveSectionExpanded ? 'Заказы-заявки' : 'Заявки';
    assignmentsTab.hidden = archiveSectionExpanded;
    if (activeView === 'drafts') {
      activeDocumentTab = 'applications';
      document.querySelectorAll('.tabs button').forEach((tab) => {
        const isApplicationsTab = tab.dataset.tab === 'Заявки';
        tab.classList.toggle('selected', isApplicationsTab);
        tab.setAttribute('aria-selected', String(isApplicationsTab));
      });
    }
    invoiceTableHead.hidden = activeDocumentTab !== 'invoices';
    applicationTableHead.hidden = activeDocumentTab !== 'applications';
    tableWrap.hidden = activeDocumentTab === 'assignments';
    assignmentsEmpty.hidden = activeDocumentTab !== 'assignments';
    toolbar.hidden = activeDocumentTab === 'assignments';
    Object.entries(rowGroups).forEach(([view, group]) => {
      group.hidden = activeDocumentTab !== 'invoices' || view !== activeGroupKey;
    });
    Object.entries(applicationRowGroups).forEach(([view, group]) => {
      group.hidden = activeDocumentTab !== 'applications' || view !== activeGroupKey;
    });
    sectionButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });
    const archiveTitles = {
      'archive-all': 'Все документы архива',
      'archive-completed': 'Завершенные',
      'archive-rejected': 'Отказанные',
      'archive-trash': 'Корзина',
    };
    pageTitle.textContent = activeView === 'counterparty'
      ? 'У контрагента'
      : activeView === 'drafts'
        ? 'Черновики'
        : archiveTitles[activeView] || 'Требуют действий';
    document.title = 'Тест статусной модели (1 вариант)';
    toolbar.classList.toggle('applications-mode', activeDocumentTab === 'applications');
    toolbar.classList.toggle('drafts-mode', activeView === 'drafts');
    updateFilterPanelFields();
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
    toolbar.classList.remove('filters-open');
    search.value = '';
    search.placeholder = activeDocumentTab === 'applications'
      ? 'Поиск по номеру заявки'
      : 'Поиск по водителю, номеру телефона, номеру машины и прицепа, названию накладной';
    search.setAttribute('aria-label', activeDocumentTab === 'applications' ? 'Поиск по заявкам' : 'Поиск по накладным');
    resetAdvancedFilters(false);
    closeInvoiceStatusDropdown();
    updateInvoiceStatusOptions();
    populateFilterOptions();
    [document.querySelector('#selectAll'), document.querySelector('#applicationSelectAll')].forEach((selectAll) => {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    });
    rows.forEach((row) => {
      row.classList.remove('selected-row');
      row.querySelector('.row-checkbox').checked = false;
    });
    updateRows();
  });
});

documentsInProgressNav.addEventListener('click', () => {
  document.querySelector('#requiresActionsNav').click();
});

archiveNav.addEventListener('click', () => {
  activeDocumentTab = 'applications';
  document.querySelectorAll('.tabs button').forEach((tab) => {
    const isApplicationsTab = tab === applicationTab;
    tab.classList.toggle('selected', isApplicationsTab);
    tab.setAttribute('aria-selected', String(isApplicationsTab));
  });
  document.querySelector('#archiveAllNav').click();
});

document.querySelectorAll('.tabs button').forEach((tab) => {
  tab.addEventListener('click', () => {
    activeDocumentTab = tab.dataset.tab === 'Заявки'
      ? 'applications'
      : tab.dataset.tab === 'Поручения' ? 'assignments' : 'invoices';
    document.querySelectorAll('.tabs button').forEach((item) => {
      item.classList.toggle('selected', item === tab);
      item.setAttribute('aria-selected', String(item === tab));
    });
    invoiceTableHead.hidden = activeDocumentTab !== 'invoices';
    applicationTableHead.hidden = activeDocumentTab !== 'applications';
    tableWrap.hidden = activeDocumentTab === 'assignments';
    assignmentsEmpty.hidden = activeDocumentTab !== 'assignments';
    toolbar.hidden = activeDocumentTab === 'assignments';
    const activeGroupKey = getViewGroupKey();
    Object.entries(applicationRowGroups).forEach(([view, group]) => {
      group.hidden = activeDocumentTab !== 'applications' || view !== activeGroupKey;
    });
    Object.entries(rowGroups).forEach(([view, group]) => {
      group.hidden = activeDocumentTab !== 'invoices' || view !== activeGroupKey;
    });
    toolbar.classList.toggle('applications-mode', activeDocumentTab === 'applications');
    toolbar.classList.toggle('drafts-mode', activeView === 'drafts');
    updateFilterPanelFields();
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
    toolbar.classList.remove('filters-open');
    search.value = '';
    search.placeholder = activeDocumentTab === 'applications'
      ? 'Поиск по номеру заявки'
      : 'Поиск по водителю, номеру телефона, номеру машины и прицепа, названию накладной';
    search.setAttribute('aria-label', activeDocumentTab === 'applications' ? 'Поиск по заявкам' : 'Поиск по накладным');
    resetAdvancedFilters(false);
    closeInvoiceStatusDropdown();
    updateInvoiceStatusOptions();
    populateFilterOptions();
    rows.forEach((row) => {
      row.classList.remove('selected-row');
      row.querySelector('.row-checkbox').checked = false;
    });
    [document.querySelector('#selectAll'), document.querySelector('#applicationSelectAll')].forEach((selectAll) => {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    });
    updateRows();
  });
});

rows.forEach((row) => row.addEventListener('click', (event) => {
  if (event.target.closest('.progress') || event.target.closest('.row-check') || event.target.closest('.row-actions')) return;
  showToast(activeDocumentTab === 'applications' ? 'Открытие заявки будет подключено в следующем шаге' : 'Открытие накладной будет подключено в следующем шаге');
}));

document.querySelectorAll('.row-actions').forEach((button) => {
  button.addEventListener('click', () => showToast('Меню действий будет добавлено позже'));
});

rows.forEach((row) => {
  row.querySelector('.row-checkbox').addEventListener('change', (event) => {
    row.classList.toggle('selected-row', event.target.checked);
    syncSelectAll();
  });
});

['#selectAll', '#applicationSelectAll'].forEach((selector) => {
  document.querySelector(selector).addEventListener('change', (event) => {
    getActiveRows().forEach((row) => {
      row.classList.toggle('selected-row', event.target.checked);
      row.querySelector('.row-checkbox').checked = event.target.checked;
    });
    event.target.indeterminate = false;
    showToast(event.target.checked ? 'Выбраны все документы' : 'Выбор снят');
  });
});

helpButton.addEventListener('click', () => {
  helpPopover.hidden = !helpPopover.hidden;
});

updateInvoiceStatusOptions();
[senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter, applicationSupplyPointFilter, statusFilter].forEach(enhanceFilterSelect);
updateFilterPanelFields();
populateFilterOptions();
