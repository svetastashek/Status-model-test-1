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

const activeAssignmentsTable = document.querySelector('#assignmentsView .assignment-table');
const activeAssignmentRowsByStatus = ['assignment-signature', 'assignment-carrier', 'assignment-error']
  .map((status) => ({
    status,
    rows: [...document.querySelectorAll(`#assignmentsView .assignment-row[data-status="${status}"], #counterpartyAssignmentsView .assignment-row[data-status="${status}"]`)],
  }));
const mixedActiveAssignmentRows = [];
let previousActiveAssignmentStatus = '';
while (activeAssignmentRowsByStatus.some((group) => group.rows.length)) {
  const availableGroups = activeAssignmentRowsByStatus
    .filter((group) => group.rows.length)
    .sort((first, second) => second.rows.length - first.rows.length);
  const nextGroup = availableGroups.find((group) => group.status !== previousActiveAssignmentStatus) || availableGroups[0];
  mixedActiveAssignmentRows.push(nextGroup.rows.shift());
  previousActiveAssignmentStatus = nextGroup.status;
}
mixedActiveAssignmentRows.forEach((row) => activeAssignmentsTable.append(row));

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

const finalArchiveRowsByStatus = ['delivery', 'carrier-rejection', 'transport-cost']
  .map((status) => [...archiveRowsContainer.querySelectorAll(`[data-archive-section="completed"][data-status="${status}"], [data-archive-section="rejected"][data-status="${status}"]`)]);
const mixedFinalArchiveRows = [];
while (finalArchiveRowsByStatus.some((statusRows) => statusRows.length)) {
  finalArchiveRowsByStatus.forEach((statusRows) => {
    if (statusRows.length) mixedFinalArchiveRows.push(statusRows.shift());
  });
}
mixedFinalArchiveRows.forEach((row) => archiveRowsContainer.append(row));

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
  const waitingMatch = tooltipText.match(/^(.*) (Ожида(?:ет|ется) подпись (?:водителя|перевозчика|отправителя|экспедитора))$/);
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

const workingApplicationDetails = [
  { carrierAddress: 'Россия, 163045, Архангельская область, Архангельск, Окружное шоссе, 11', supplyPoint: 'Россия, 396310, Воронежская область, Новоусманский район, Новая Усмань, Дорожная улица, 25', supplyDate: '12.08.2026 09:30', cargo: 'Промышленное оборудование', weight: '6 840 кг', units: '14 шт' },
  { carrierAddress: 'Россия, 192241, Санкт-Петербург, Софийская улица, 60', supplyPoint: 'Россия, 188640, Ленинградская область, Всеволожск, Южное шоссе, 134', supplyDate: '12.08.2026 11:00', cargo: 'Холодильное оборудование', weight: '3 480 кг', units: '7 шт' },
  { carrierAddress: 'Россия, 620000, Свердловская область, Екатеринбург, улица Шаумяна, 92', supplyPoint: 'Россия, 623700, Свердловская область, Берёзовский, Западная промзона, 3', supplyDate: '13.08.2026 08:45', cargo: 'Металлические конструкции', weight: '12 600 кг', units: '24 шт' },
  { carrierAddress: 'Россия, 443022, Самарская область, Самара, Заводское шоссе, 17', supplyPoint: 'Россия, 443052, Самара, проспект Кирова, 10', supplyDate: '13.08.2026 14:20', cargo: 'Медицинское оборудование', weight: '1 920 кг', units: '36 шт' },
  { carrierAddress: 'Россия, 397908, Воронежская область, Лиски, Индустриальная улица, 8', supplyPoint: 'Россия, 394033, Воронеж, Ленинский проспект, 172', supplyDate: '14.08.2026 10:15', cargo: 'Соки в упаковке', weight: '8 750 кг', units: '420 шт' },
  { carrierAddress: 'Россия, 344065, Ростовская область, Ростов-на-Дону, Орская улица, 31', supplyPoint: 'Россия, 346720, Ростовская область, Аксай, Западная улица, 2', supplyDate: '14.08.2026 16:40', cargo: 'Строительные материалы', weight: '15 300 кг', units: '510 шт' },
  { carrierAddress: 'Россия, 163002, Архангельск, Московский проспект, 25', supplyPoint: 'Россия, 164500, Архангельская область, Северодвинск, Железнодорожная улица, 54', supplyDate: '15.08.2026 09:00', cargo: 'Пиломатериалы', weight: '18 400 кг', units: '96 шт' },
  { carrierAddress: 'Россия, 690001, Приморский край, Владивосток, Светланская улица, 167', supplyPoint: 'Россия, 692756, Приморский край, Артём, Каширская улица, 21', supplyDate: '15.08.2026 12:30', cargo: 'Бытовая техника', weight: '4 260 кг', units: '68 шт' },
  { carrierAddress: 'Россия, 300036, Тульская область, Тула, Одоевское шоссе, 63', supplyPoint: 'Россия, 301650, Тульская область, Новомосковск, Узловское шоссе, 4', supplyDate: '16.08.2026 08:00', cargo: 'Комплектующие для производства', weight: '9 100 кг', units: '180 шт' },
  { carrierAddress: 'Россия, 443080, Самара, Революционная улица, 70', supplyPoint: 'Россия, 445043, Самарская область, Тольятти, Транспортная улица, 17', supplyDate: '16.08.2026 13:10', cargo: 'Офисная мебель', weight: '2 160 кг', units: '32 шт' },
  { carrierAddress: 'Россия, 420087, Республика Татарстан, Казань, улица Родины, 7', supplyPoint: 'Россия, 420051, Казань, Северо-Западная улица, 14', supplyDate: '17.08.2026 09:20', cargo: 'Фармацевтическая продукция', weight: '980 кг', units: '125 шт' },
  { carrierAddress: 'Россия, 630088, Новосибирск, Петухова улица, 35', supplyPoint: 'Россия, 633100, Новосибирская область, Обь, Омский тракт, 4', supplyDate: '17.08.2026 15:00', cargo: 'Запасные части', weight: '5 720 кг', units: '210 шт' },
  { carrierAddress: 'Россия, 350059, Краснодар, Уральская улица, 126', supplyPoint: 'Россия, 353217, Краснодарский край, Динская, Крайняя улица, 3', supplyDate: '18.08.2026 07:40', cargo: 'Продукты питания', weight: '11 850 кг', units: '640 шт' },
  { carrierAddress: 'Россия, 300012, Тула, Рязанская улица, 38', supplyPoint: 'Россия, 301602, Тульская область, Узловая, Заводская улица, 9', supplyDate: '18.08.2026 11:50', cargo: 'Электроинструменты', weight: '3 040 кг', units: '84 шт' },
  { carrierAddress: 'Россия, 443090, Самара, Советской Армии улица, 180', supplyPoint: 'Россия, 446200, Самарская область, Новокуйбышевск, Промышленная улица, 1', supplyDate: '19.08.2026 10:30', cargo: 'Бумажная продукция', weight: '7 360 кг', units: '275 шт' },
];

document.querySelectorAll('#applicationRows > .table-row, #counterpartyApplicationRows > .table-row, #archiveApplicationRows > .table-row').forEach((row, index) => {
  const cells = [...row.children];
  const invoiceCell = cells[0];
  const carrierName = cells[1]?.querySelector('strong')?.textContent.trim() || 'Перевозчик';
  const detail = workingApplicationDetails[index % workingApplicationDetails.length];

  cells[1].className = 'application-party-cell';
  cells[1].replaceChildren();
  const carrierTitle = document.createElement('strong');
  carrierTitle.textContent = carrierName;
  const carrierAddress = document.createElement('span');
  carrierAddress.className = 'muted address';
  carrierAddress.textContent = detail.carrierAddress;
  cells[1].append(carrierTitle, carrierAddress);

  cells[2].className = 'application-point-cell';
  cells[2].replaceChildren();
  const supplyPoint = document.createElement('strong');
  supplyPoint.textContent = detail.supplyPoint;
  const supplyDate = document.createElement('span');
  supplyDate.className = 'muted';
  supplyDate.textContent = detail.supplyDate;
  cells[2].append(supplyPoint, supplyDate);

  cells[3].className = 'cargo application-cargo-cell';
  cells[3].replaceChildren();
  const cargoTitle = document.createElement('strong');
  cargoTitle.textContent = detail.cargo;
  const cargoWeight = document.createElement('span');
  cargoWeight.textContent = detail.weight;
  const cargoUnits = document.createElement('span');
  cargoUnits.className = 'muted';
  cargoUnits.textContent = detail.units;
  cells[3].append(cargoTitle, cargoWeight, cargoUnits);

  row.dataset.carrier = carrierName;
  row.dataset.supplyPoint = detail.supplyPoint;
  row.dataset.search = `${invoiceCell.textContent} ${carrierName} ${detail.carrierAddress} ${detail.supplyPoint} ${detail.supplyDate} ${detail.cargo} ${detail.weight} ${detail.units}`.toLowerCase();
});

const rows = [...document.querySelectorAll('.table-row')];
const assignmentRows = [...document.querySelectorAll('.assignment-row')];
const counterpartyAssignmentRows = [...document.querySelectorAll('.counterparty-assignment-row')];
const requiresAssignmentRows = [...document.querySelectorAll('#assignmentsView .assignment-row:not(.counterparty-assignment-row)')];
const archiveAssignmentRows = [...document.querySelectorAll('.archive-assignment-row')];
const draftAssignmentRows = [...document.querySelectorAll('.draft-assignment-row')];
const organizationStatuses = ['observer-signer', 'observer', 'signer'];
const applicationSupplyPoints = [
  'Москва, Складочная улица, 1',
  'Санкт-Петербург, Софийская улица, 96',
  'Екатеринбург, Сибирский тракт, 12',
  'Казань, улица Аделя Кутуя, 151',
  'Новосибирск, Толмачёвская улица, 43',
];
const assignmentShippers = [
  'ООО «Невская Производственная Компания»',
  'АО «Северный терминал»',
  'ООО «Уральский промышленный комплекс»',
  'АО «Московский пищевой комбинат»',
  'ООО «Волга Снаб»',
  'АО «ДонАгро»',
  'ООО «Сибирская торговая компания»',
  'АО «Восточный складской комплекс»',
];
assignmentRows.forEach((row, index) => {
  const invoice = row.querySelector('.invoice-cell');
  const forwarder = invoice.nextElementSibling?.querySelector('strong')?.textContent.trim() || '';
  const route = invoice.nextElementSibling?.nextElementSibling?.querySelector('strong')?.textContent.trim() || '';
  row.dataset.forwarder = forwarder;
  row.dataset.shipper = assignmentShippers[index % assignmentShippers.length];
  row.dataset.loadingAddress = route.split(' — ')[0].trim();
});
rows.forEach((row, index) => {
  row.dataset.orgStatus = organizationStatuses[index % organizationStatuses.length];
  if (row.closest('#applicationRows, #counterpartyApplicationRows, #draftApplicationRows, #archiveApplicationRows')) {
    row.dataset.carrier ||= row.querySelector('.invoice-cell').nextElementSibling.querySelector('strong')?.textContent.trim() || '';
    row.dataset.supplyPoint ||= applicationSupplyPoints[index % applicationSupplyPoints.length];
  }
  const invoiceName = row.querySelector('.invoice-cell strong').textContent;
  const documentName = row.classList.contains('assignment-row')
    ? 'поручение'
    : row.closest('#applicationRows, #counterpartyApplicationRows, #draftApplicationRows, #archiveApplicationRows') ? 'заявку' : 'накладную';
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
const assignmentsView = document.querySelector('#assignmentsView');
const counterpartyAssignmentsView = document.querySelector('#counterpartyAssignmentsView');
const draftAssignmentsView = document.querySelector('#draftAssignmentsView');
const archiveAssignmentsView = document.querySelector('#archiveAssignmentsView');
const assignmentsEmpty = document.querySelector('#assignmentsEmpty');
const assignmentsNoResults = document.querySelector('#assignmentsNoResults');
const counterpartyAssignmentsNoResults = document.querySelector('#counterpartyAssignmentsNoResults');
const draftAssignmentsNoResults = document.querySelector('#draftAssignmentsNoResults');
const archiveAssignmentsNoResults = document.querySelector('#archiveAssignmentsNoResults');
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
const assignmentFilterFields = document.querySelector('#assignmentFilterFields');
const standardFilterBottom = document.querySelector('#standardFilterBottom');
const assignmentForwarderFilter = document.querySelector('#assignmentForwarderFilter');
const assignmentShipperFilter = document.querySelector('#assignmentShipperFilter');
const assignmentLoadingAddressFilter = document.querySelector('#assignmentLoadingAddressFilter');
const assignmentDateFromFilter = document.querySelector('#assignmentDateFromFilter');
const assignmentDateToFilter = document.querySelector('#assignmentDateToFilter');
const assignmentStatusFilter = document.querySelector('#assignmentStatusFilter');
const assignmentTopStatusFilter = document.querySelector('#assignmentTopStatusFilter');
const applyAssignmentFilters = document.querySelector('#applyAssignmentFilters');
const resetAssignmentFilters = document.querySelector('#resetAssignmentFilters');
const advancedFilterControls = [invoiceStatusFilter, senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter, applicationSupplyPointFilter, loadingAddressFilter, unloadingAddressFilter, dateFromFilter, dateToFilter, statusFilter, assignmentForwarderFilter, assignmentShipperFilter, assignmentLoadingAddressFilter, assignmentDateFromFilter, assignmentDateToFilter, assignmentStatusFilter, assignmentTopStatusFilter];
const enhancedFilterSelects = new Map();
const searchableFilterSelects = new Set([senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter, assignmentForwarderFilter, assignmentShipperFilter]);
const emptyState = document.querySelector('#emptyState');
const pageTitle = document.querySelector('#pageTitle');
const sectionButtons = [...document.querySelectorAll('[data-view]')];
const documentsInProgressNav = document.querySelector('#documentsInProgressNav');
const documentSubnavButtons = [document.querySelector('#workingAllNav'), document.querySelector('#requiresActionsNav'), document.querySelector('#counterpartyNav')];
const archiveNav = document.querySelector('#archiveNav');
const archiveSubnavButtons = [
  document.querySelector('#archiveAllNav'),
  document.querySelector('#archiveCompletedNav'),
  document.querySelector('#archiveRejectedNav'),
];
const applicationTab = document.querySelector('.tabs [data-tab="Заявки"]');
const assignmentsTab = document.querySelector('.tabs [data-tab="Поручения"]');
const receiptsTab = document.querySelector('#receiptsTab');
const receiptsView = document.querySelector('#receiptsView');
const receiptDetailView = document.querySelector('#receiptDetailView');
const receiptDetailNumber = document.querySelector('#receiptDetailNumber');
const receiptDetailBack = document.querySelector('#receiptDetailBack');
const assignmentDetailView = document.querySelector('#assignmentDetailView');
const applicationDetailView = document.querySelector('#applicationDetailView');
const applicationDetailBack = document.querySelector('#applicationDetailBack');
const applicationDetailListBack = document.querySelector('#applicationDetailListBack');
const applicationDetailNumber = document.querySelector('#applicationDetailNumber');
const applicationInfoNumber = document.querySelector('#applicationInfoNumber');
const applicationInfoDate = document.querySelector('#applicationInfoDate');
const applicationCarrierName = document.querySelector('#applicationCarrierName');
const applicationDetailStatus = document.querySelector('#applicationDetailStatus');
const applicationPrimaryAction = document.querySelector('#applicationPrimaryAction');
const applicationEditAction = document.querySelector('#applicationEditAction');
const applicationCompletedTabs = [...document.querySelectorAll('.application-completed-tab')];
const assignmentDetailNumber = document.querySelector('#assignmentDetailNumber');
const assignmentDetailStatus = document.querySelector('#assignmentDetailStatus');
const assignmentDetailBack = document.querySelector('#assignmentDetailBack');
const invoiceDetailView = document.querySelector('#invoiceDetailView');
const invoiceDetailNumber = document.querySelector('#invoiceDetailNumber');
const invoiceDetailStatus = document.querySelector('#invoiceDetailStatus');
const invoiceDetailBack = document.querySelector('#invoiceDetailBack');
const invoiceInfoNumber = document.querySelector('#invoiceInfoNumber');
const invoiceInfoDate = document.querySelector('#invoiceInfoDate');
const invoiceSenderName = document.querySelector('#invoiceSenderName');
const invoiceSenderContact = document.querySelector('#invoiceSenderContact');
const invoiceRecipientName = document.querySelector('#invoiceRecipientName');
const invoiceRecipientAddress = document.querySelector('#invoiceRecipientAddress');
const invoiceCargoName = document.querySelector('#invoiceCargoName');
const invoiceSenderSignature = document.querySelector('#invoiceSenderSignature');
const invoiceSenderIcon = document.querySelector('#invoiceSenderIcon');
const invoiceSenderSigner = document.querySelector('#invoiceSenderSigner');
const invoiceDriverName = document.querySelector('#invoiceDriverName');
const invoiceCurrentStatusText = document.querySelector('#invoiceCurrentStatusText');
const invoiceCarrierSignature = document.querySelector('#invoiceCarrierSignature');
const invoiceCarrierSigner = document.querySelector('#invoiceCarrierSigner');
const invoiceQrSignature = document.querySelector('#invoiceQrSignature');
const invoiceQrLabel = document.querySelector('#invoiceQrLabel');
const invoiceLoadingStep = document.querySelector('#invoiceLoadingStep');
const invoiceLoadingTitle = document.querySelector('#invoiceLoadingTitle');
const invoiceCreatedStep = document.querySelector('#invoiceCreatedStep');
const invoiceCarrierIcon = document.querySelector('#invoiceCarrierIcon');
const invoiceLoadingComment = document.querySelector('#invoiceLoadingComment');
const invoiceUnloadingStep = document.querySelector('#invoiceUnloadingStep');
const invoiceUnloadingToggle = document.querySelector('#invoiceUnloadingToggle');
const invoiceUnloadingChevron = document.querySelector('#invoiceUnloadingChevron');
const invoiceUnloadingSignatures = document.querySelector('#invoiceUnloadingSignatures');
const invoiceUnloadingComment = document.querySelector('#invoiceUnloadingComment');
const invoiceUnloadingDriver = document.querySelector('#invoiceUnloadingDriver');
const invoiceUnloadingDriverName = document.querySelector('#invoiceUnloadingDriverName');
const invoiceUnloadingCarrier = document.querySelector('#invoiceUnloadingCarrier');
const invoiceCostStep = document.querySelector('#invoiceCostStep');
const invoiceCostToggle = document.querySelector('#invoiceCostToggle');
const invoiceCostChevron = document.querySelector('#invoiceCostChevron');
const invoiceCostSignatures = document.querySelector('#invoiceCostSignatures');
const invoiceCostSenderSignature = document.querySelector('#invoiceCostSenderSignature');
const invoiceCostSenderIcon = document.querySelector('#invoiceCostSenderIcon');
const invoiceCostSenderSigner = document.querySelector('#invoiceCostSenderSigner');
const invoiceStatusActions = document.querySelector('#invoiceStatusActions');
const invoicePrimaryAction = document.querySelector('#invoicePrimaryAction');
const invoiceSecondaryAction = document.querySelector('#invoiceSecondaryAction');
const invoiceTertiaryAction = document.querySelector('#invoiceTertiaryAction');
const invoiceStatusInfo = document.querySelector('#invoiceStatusInfo');
const invoiceCostDetails = document.querySelector('#invoiceCostDetails');
const invoiceCompleteStep = document.querySelector('#invoiceCompleteStep');
const helpButton = document.querySelector('#helpButton');
const helpPopover = document.querySelector('#helpPopover');
const toast = document.querySelector('#toast');
let activeView = 'working-all';
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
  if (activeDocumentTab === 'receipts') return [];
  if (activeDocumentTab === 'applications') {
    if (activeView === 'working-all') {
      return [
        ...applicationRowGroups.requires.querySelectorAll('.table-row'),
        ...applicationRowGroups.counterparty.querySelectorAll('.table-row'),
      ];
    }
    const group = applicationRowGroups[groupKey];
    if (!group) return [];
    const groupRows = [...group.querySelectorAll('.table-row')];
    if (!activeView.startsWith('archive-')) return groupRows;
    if (activeView === 'archive-all') {
      return getUniqueDocumentRows(groupRows.filter((row) => row.dataset.archiveSection === 'completed' || row.dataset.archiveSection === 'rejected'));
    }
    return groupRows.filter((row) => `archive-${row.dataset.archiveSection}` === activeView);
  }
  if (activeDocumentTab === 'assignments') {
    if (activeView === 'working-all') return [...requiresAssignmentRows, ...counterpartyAssignmentRows];
    if (activeView === 'requires') return requiresAssignmentRows;
    if (activeView === 'counterparty') return counterpartyAssignmentRows;
    if (activeView === 'drafts') return draftAssignmentRows;
    if (activeView === 'archive-all') {
      return archiveAssignmentRows.filter((row) => row.dataset.archiveSection === 'completed' || row.dataset.archiveSection === 'rejected');
    }
    if (activeView === 'archive-completed') return archiveAssignmentRows.filter((row) => row.dataset.archiveSection === 'completed');
    if (activeView === 'archive-trash') return archiveAssignmentRows.filter((row) => row.dataset.archiveSection === 'trash');
    return [];
  }
  if (activeView === 'working-all') {
    return [
      ...rowGroups.requires.querySelectorAll('.table-row'),
      ...rowGroups.counterparty.querySelectorAll('.table-row'),
    ];
  }
  const group = rowGroups[groupKey];
  if (!group) return [];
  const groupRows = [...group.querySelectorAll('.table-row')];
  if (!activeView.startsWith('archive-')) return groupRows;
  if (activeView === 'archive-all') {
    return getUniqueDocumentRows(groupRows.filter((row) => row.dataset.archiveSection === 'completed' || row.dataset.archiveSection === 'rejected'));
  }
  return groupRows.filter((row) => `archive-${row.dataset.archiveSection}` === activeView);
}

function getActiveSelectAll() {
  if (activeDocumentTab === 'applications') return document.querySelector('#applicationSelectAll');
  if (activeDocumentTab === 'assignments') {
    if (activeView === 'drafts') return document.querySelector('#draftAssignmentSelectAll');
    if (activeView.startsWith('archive-')) return document.querySelector('#archiveAssignmentSelectAll');
    return document.querySelector('#assignmentSelectAll');
  }
  return document.querySelector('#selectAll');
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
  let availableOptions = [...select.options].filter((option) => select === assignmentTopStatusFilter || option.value);
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
  if (select === assignmentTopStatusFilter) wrapper.classList.add('assignment-top-status-control');
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
  if (activeDocumentTab === 'assignments') {
    const activeRows = getActiveRows();
    fillFilterOptions(assignmentForwarderFilter, activeRows.map((row) => row.dataset.forwarder).filter(Boolean));
    fillFilterOptions(assignmentShipperFilter, activeRows.map((row) => row.dataset.shipper).filter(Boolean));
    const selectedStatus = assignmentStatusFilter.value;
    const selectedTopStatus = assignmentTopStatusFilter.value;
    assignmentStatusFilter.length = 1;
    assignmentTopStatusFilter.length = 1;
    const archiveAssignmentStatuses = [
      ['assignment-completed', 'Завершено'],
      ['assignment-signature', 'Ожидает подписи отправителя'],
      ['assignment-carrier', 'Ожидает подпись экспедитора'],
      ['assignment-error', 'Ошибка подписи'],
      ['assignment-draft', 'Черновик'],
    ];
    const assignmentStatuses = activeView === 'drafts'
      ? [['assignment-draft', 'Черновик']]
      : activeView.startsWith('archive-')
      ? archiveAssignmentStatuses.filter(([value]) => activeRows.some((row) => row.dataset.status === value))
      : activeView === 'counterparty'
        ? [['assignment-carrier', 'Ожидает подпись экспедитора']]
        : activeView === 'working-all'
          ? [
            ['assignment-signature', 'Ожидает подписи отправителя'],
            ['assignment-error', 'Ошибка подписи'],
            ['assignment-carrier', 'Ожидает подпись экспедитора'],
          ]
        : [
        ['assignment-signature', 'Ожидает подписи отправителя'],
        ['assignment-error', 'Ошибка подписи'],
      ];
    assignmentStatuses.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      assignmentStatusFilter.append(option);
      assignmentTopStatusFilter.append(option.cloneNode(true));
    });
    if (assignmentStatuses.some(([value]) => value === selectedStatus)) assignmentStatusFilter.value = selectedStatus;
    if (assignmentStatuses.some(([value]) => value === selectedTopStatus)) assignmentTopStatusFilter.value = selectedTopStatus;
    assignmentStatusFilter.classList.toggle('has-value', Boolean(assignmentStatusFilter.value));
    assignmentTopStatusFilter.classList.toggle('has-value', Boolean(assignmentTopStatusFilter.value));
    syncCustomFilterSelect(assignmentStatusFilter);
    syncCustomFilterSelect(assignmentTopStatusFilter);
    [senderFilter, carrierFilter, recipientFilter, customerFilter, applicationCarrierFilter, applicationSupplyPointFilter]
      .forEach((select) => fillFilterOptions(select, []));
    return;
  }
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
    assignmentForwarder: assignmentForwarderFilter.value,
    assignmentShipper: assignmentShipperFilter.value,
    assignmentLoadingAddress: assignmentLoadingAddressFilter.value.trim().toLocaleLowerCase('ru'),
    assignmentDateFrom: assignmentDateFromFilter.value,
    assignmentDateTo: assignmentDateToFilter.value,
    assignmentStatus: assignmentStatusFilter.value,
  };
}

function getInvoiceDate(invoice) {
  const dateText = invoice.querySelector('.muted').textContent;
  const match = dateText.match(/(\d{2})\.(\d{2})/);
  const year = activeDocumentTab === 'applications' || activeDocumentTab === 'assignments' || activeView === 'drafts' ? '2026' : '2024';
  return match ? `${year}-${match[2]}-${match[1]}` : '';
}

function matchesAdvancedFilters(row) {
  if (activeDocumentTab === 'assignments') {
    const assignmentDate = getInvoiceDate(row.querySelector('.invoice-cell'));
    const loadingAddress = (row.dataset.loadingAddress || '').toLocaleLowerCase('ru');
    return (!appliedFilters.assignmentForwarder || row.dataset.forwarder === appliedFilters.assignmentForwarder)
      && (!appliedFilters.assignmentShipper || row.dataset.shipper === appliedFilters.assignmentShipper)
      && (!appliedFilters.assignmentLoadingAddress || loadingAddress.includes(appliedFilters.assignmentLoadingAddress))
      && (!appliedFilters.assignmentDateFrom || assignmentDate >= appliedFilters.assignmentDateFrom)
      && (!appliedFilters.assignmentDateTo || assignmentDate <= appliedFilters.assignmentDateTo)
      && (!appliedFilters.assignmentStatus || row.dataset.status === appliedFilters.assignmentStatus);
  }
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
  const assignmentsMode = activeDocumentTab === 'assignments';
  const archiveApplicationsWithoutStatusFilter = activeView === 'archive-completed' || activeView === 'archive-rejected';
  topStatusControl.hidden = assignmentsMode || (applicationsMode && (activeView === 'counterparty' || archiveApplicationsWithoutStatusFilter));
  filterPanel.classList.toggle('applications-mode', applicationsMode);
  filterPanel.classList.toggle('assignments-mode', assignmentsMode);
  document.querySelector('#applicationFilterRow').hidden = !applicationsMode;
  assignmentFilterFields.hidden = !assignmentsMode;
  standardFilterBottom.hidden = assignmentsMode;
  document.querySelectorAll('.invoice-filter-row').forEach((row) => { row.hidden = applicationsMode || assignmentsMode; });
  const organizationStatusParts = enhancedFilterSelects.get(statusFilter);
  if (organizationStatusParts) organizationStatusParts.wrapper.hidden = applicationsMode || assignmentsMode;
  const assignmentTopStatusParts = enhancedFilterSelects.get(assignmentTopStatusFilter);
  if (assignmentTopStatusParts) {
    assignmentTopStatusParts.wrapper.hidden = !(assignmentsMode && (activeView === 'requires' || activeView === 'working-all' || activeView === 'archive-all'));
  }
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
  if (activeDocumentTab === 'assignments' && !activeView.startsWith('archive-') && activeView !== 'drafts') {
    [...requiresAssignmentRows, ...counterpartyAssignmentRows].forEach((row) => {
      row.hidden = !activeRows.includes(row);
    });
  }
  if (getViewGroupKey() === 'archive') {
    const archiveGroup = activeDocumentTab === 'applications' ? applicationRowGroups.archive : rowGroups.archive;
    if (activeDocumentTab === 'assignments') {
      archiveAssignmentRows.forEach((row) => { row.hidden = !activeRows.includes(row); });
    } else {
      archiveGroup.querySelectorAll('.table-row').forEach((row) => {
        row.hidden = !activeRows.includes(row);
      });
    }
  }
  let visible = 0;
  activeRows.forEach((row) => {
    const searchTarget = activeDocumentTab === 'applications' || activeDocumentTab === 'assignments' ? row.querySelector('.invoice-cell') : row;
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
  if (activeDocumentTab === 'assignments') {
    const usesActiveAssignmentsTable = activeView === 'requires' || activeView === 'counterparty' || activeView === 'working-all';
    assignmentsNoResults.querySelector('strong').textContent = activeView === 'counterparty' ? 'Поручения не найдены' : 'Поручения не найдены';
    assignmentsNoResults.hidden = !usesActiveAssignmentsTable || visible !== 0;
    counterpartyAssignmentsNoResults.hidden = true;
    draftAssignmentsNoResults.hidden = activeView !== 'drafts' || visible !== 0;
    archiveAssignmentsNoResults.hidden = !activeView.startsWith('archive-') || visible !== 0;
    emptyState.hidden = true;
    return;
  }
  assignmentsNoResults.hidden = true;
  counterpartyAssignmentsNoResults.hidden = true;
  draftAssignmentsNoResults.hidden = true;
  archiveAssignmentsNoResults.hidden = true;
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
    const matchesStatusView = !optionStatusView || (activeView === 'working-all'
      ? optionStatusView === 'requires' || optionStatusView === 'counterparty'
      : optionStatusView === activeStatusView);
    const allowedArchiveViews = option.dataset.archiveViews?.split(',') || [];
    const isAllowedArchiveView = !allowedArchiveViews.length || allowedArchiveViews.includes(activeView);
    option.hidden = activeDocumentTab === 'applications'
      ? (option.dataset.documentTab !== 'applications' || !matchesStatusView || !isAllowedArchiveView) && Boolean(option.dataset.value)
      : option.dataset.documentTab === 'applications' || !matchesStatusView || !isAllowedArchiveView;
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

[dateFromFilter, dateToFilter, assignmentDateFromFilter, assignmentDateToFilter].forEach((dateInput) => {
  dateInput.addEventListener('input', () => dateInput.classList.toggle('has-value', Boolean(dateInput.value)));
});

applyFilters.addEventListener('click', () => {
  appliedFilters = readAdvancedFilters();
  updateRows();
});

resetFilters.addEventListener('click', () => resetAdvancedFilters());

applyAssignmentFilters.addEventListener('click', () => {
  appliedFilters = readAdvancedFilters();
  assignmentTopStatusFilter.value = appliedFilters.assignmentStatus;
  syncCustomFilterSelect(assignmentTopStatusFilter);
  updateRows();
});

assignmentTopStatusFilter.addEventListener('change', () => {
  assignmentStatusFilter.value = assignmentTopStatusFilter.value;
  syncCustomFilterSelect(assignmentStatusFilter);
  appliedFilters.assignmentStatus = assignmentTopStatusFilter.value;
  updateRows();
});

resetAssignmentFilters.addEventListener('click', () => resetAdvancedFilters());

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    receiptDetailView.hidden = true;
    assignmentDetailView.hidden = true;
    applicationDetailView.hidden = true;
    invoiceDetailView.hidden = true;
    document.querySelector('.page-header').hidden = false;
    document.querySelector('.workspace').hidden = false;
    activeView = button.dataset.view;
    const activeGroupKey = getViewGroupKey();
    const documentsSectionExpanded = activeView === 'working-all' || activeView === 'requires' || activeView === 'counterparty';
    const isArchiveView = activeView.startsWith('archive-');
    const archiveSectionExpanded = activeView === 'archive-all' || activeView === 'archive-completed' || activeView === 'archive-rejected';
    documentsInProgressNav.setAttribute('aria-expanded', String(documentsSectionExpanded));
    documentSubnavButtons.forEach((item) => { item.hidden = !documentsSectionExpanded; });
    archiveNav.setAttribute('aria-expanded', String(archiveSectionExpanded));
    archiveSubnavButtons.forEach((item) => { item.hidden = !archiveSectionExpanded; });
    applicationTab.textContent = 'Заказы-заявки';
    const archiveHasAssignments = activeView === 'archive-all' || activeView === 'archive-completed' || activeView === 'archive-trash';
    assignmentsTab.hidden = isArchiveView && !archiveHasAssignments;
    const archiveHasReceipts = activeView === 'archive-all' || activeView === 'archive-completed';
    receiptsTab.hidden = !archiveHasReceipts;
    if (activeDocumentTab === 'receipts' && !archiveHasReceipts) {
      activeDocumentTab = 'applications';
      document.querySelectorAll('.tabs button').forEach((tab) => {
        const isApplicationsTab = tab === applicationTab;
        tab.classList.toggle('selected', isApplicationsTab);
        tab.setAttribute('aria-selected', String(isApplicationsTab));
      });
    }
    if (activeDocumentTab === 'assignments' && isArchiveView && !archiveHasAssignments) {
      activeDocumentTab = 'applications';
      document.querySelectorAll('.tabs button').forEach((tab) => {
        const isApplicationsTab = tab === applicationTab;
        tab.classList.toggle('selected', isApplicationsTab);
        tab.setAttribute('aria-selected', String(isApplicationsTab));
      });
    }
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
    tableWrap.hidden = activeDocumentTab === 'assignments' || activeDocumentTab === 'receipts';
    assignmentsView.hidden = activeDocumentTab !== 'assignments' || (activeView !== 'requires' && activeView !== 'counterparty' && activeView !== 'working-all');
    counterpartyAssignmentsView.hidden = true;
    draftAssignmentsView.hidden = activeDocumentTab !== 'assignments' || activeView !== 'drafts';
    archiveAssignmentsView.hidden = activeDocumentTab !== 'assignments' || !archiveHasAssignments;
    const activeViewHasAssignments = activeView === 'working-all' || activeView === 'requires' || activeView === 'counterparty' || activeView === 'drafts' || archiveHasAssignments;
    assignmentsEmpty.hidden = activeDocumentTab !== 'assignments' || activeViewHasAssignments;
    receiptsView.hidden = activeDocumentTab !== 'receipts' || !archiveHasReceipts;
    toolbar.hidden = activeDocumentTab === 'receipts' || (activeDocumentTab === 'assignments' && !activeViewHasAssignments);
    Object.entries(rowGroups).forEach(([view, group]) => {
      const belongsToWorkingAll = activeView === 'working-all' && (view === 'requires' || view === 'counterparty');
      group.hidden = activeDocumentTab !== 'invoices' || (!belongsToWorkingAll && view !== activeGroupKey);
    });
    Object.entries(applicationRowGroups).forEach(([view, group]) => {
      const belongsToWorkingAll = activeView === 'working-all' && (view === 'requires' || view === 'counterparty');
      group.hidden = activeDocumentTab !== 'applications' || (!belongsToWorkingAll && view !== activeGroupKey);
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
      'archive-all': 'Все завершенные документы',
      'archive-completed': 'Согласованные',
      'archive-rejected': 'Отказанные',
      'archive-trash': 'Корзина',
    };
    pageTitle.textContent = activeView === 'working-all'
      ? 'Все документы в работе'
      : activeView === 'counterparty'
      ? 'У контрагента'
      : activeView === 'drafts'
        ? 'Черновики'
        : archiveTitles[activeView] || 'Требуют действий';
    document.title = 'Тест статусной модели (1 вариант)';
    toolbar.classList.toggle('applications-mode', activeDocumentTab === 'applications');
    toolbar.classList.toggle('assignments-mode', activeDocumentTab === 'assignments');
    toolbar.classList.toggle('drafts-mode', activeView === 'drafts');
    updateFilterPanelFields();
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
    toolbar.classList.remove('filters-open');
    search.value = '';
    search.placeholder = activeDocumentTab === 'applications'
      ? 'Поиск по номеру заявки'
      : activeDocumentTab === 'assignments'
        ? 'Поиск по номеру поручения'
        : 'Поиск по водителю, номеру телефона, номеру машины и прицепа, названию накладной';
    search.setAttribute('aria-label', activeDocumentTab === 'applications' ? 'Поиск по заявкам' : activeDocumentTab === 'assignments' ? 'Поиск по поручениям' : 'Поиск по накладным');
    resetAdvancedFilters(false);
    closeInvoiceStatusDropdown();
    updateInvoiceStatusOptions();
    populateFilterOptions();
    [document.querySelector('#selectAll'), document.querySelector('#applicationSelectAll'), document.querySelector('#assignmentSelectAll'), document.querySelector('#counterpartyAssignmentSelectAll'), document.querySelector('#draftAssignmentSelectAll'), document.querySelector('#archiveAssignmentSelectAll')].forEach((selectAll) => {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    });
    rows.forEach((row) => {
      row.classList.remove('selected-row');
      row.querySelector('.row-checkbox').checked = false;
    });
    updateRows();
    updateReceiptsForView(true);
  });
});

documentsInProgressNav.addEventListener('click', () => {
  document.querySelector('#workingAllNav').click();
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
      : tab.dataset.tab === 'Поручения'
        ? 'assignments'
        : tab.dataset.tab === 'Расписки' ? 'receipts' : 'invoices';
    document.querySelectorAll('.tabs button').forEach((item) => {
      item.classList.toggle('selected', item === tab);
      item.setAttribute('aria-selected', String(item === tab));
    });
    invoiceTableHead.hidden = activeDocumentTab !== 'invoices';
    applicationTableHead.hidden = activeDocumentTab !== 'applications';
    tableWrap.hidden = activeDocumentTab === 'assignments' || activeDocumentTab === 'receipts';
    assignmentsView.hidden = activeDocumentTab !== 'assignments' || (activeView !== 'requires' && activeView !== 'counterparty' && activeView !== 'working-all');
    counterpartyAssignmentsView.hidden = true;
    draftAssignmentsView.hidden = activeDocumentTab !== 'assignments' || activeView !== 'drafts';
    const archiveHasAssignments = activeView === 'archive-all' || activeView === 'archive-completed' || activeView === 'archive-trash';
    archiveAssignmentsView.hidden = activeDocumentTab !== 'assignments' || !archiveHasAssignments;
    const activeViewHasAssignments = activeView === 'working-all' || activeView === 'requires' || activeView === 'counterparty' || activeView === 'drafts' || archiveHasAssignments;
    assignmentsEmpty.hidden = activeDocumentTab !== 'assignments' || activeViewHasAssignments;
    const archiveHasReceipts = activeView === 'archive-all' || activeView === 'archive-completed';
    receiptsView.hidden = activeDocumentTab !== 'receipts' || !archiveHasReceipts;
    toolbar.hidden = activeDocumentTab === 'receipts' || (activeDocumentTab === 'assignments' && !activeViewHasAssignments);
    const activeGroupKey = getViewGroupKey();
    Object.entries(applicationRowGroups).forEach(([view, group]) => {
      const belongsToWorkingAll = activeView === 'working-all' && (view === 'requires' || view === 'counterparty');
      group.hidden = activeDocumentTab !== 'applications' || (!belongsToWorkingAll && view !== activeGroupKey);
    });
    Object.entries(rowGroups).forEach(([view, group]) => {
      const belongsToWorkingAll = activeView === 'working-all' && (view === 'requires' || view === 'counterparty');
      group.hidden = activeDocumentTab !== 'invoices' || (!belongsToWorkingAll && view !== activeGroupKey);
    });
    toolbar.classList.toggle('applications-mode', activeDocumentTab === 'applications');
    toolbar.classList.toggle('assignments-mode', activeDocumentTab === 'assignments');
    toolbar.classList.toggle('drafts-mode', activeView === 'drafts');
    updateFilterPanelFields();
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
    toolbar.classList.remove('filters-open');
    search.value = '';
    search.placeholder = activeDocumentTab === 'applications'
      ? 'Поиск по номеру заявки'
      : activeDocumentTab === 'assignments'
        ? 'Поиск по номеру поручения'
        : 'Поиск по водителю, номеру телефона, номеру машины и прицепа, названию накладной';
    search.setAttribute('aria-label', activeDocumentTab === 'applications' ? 'Поиск по заявкам' : activeDocumentTab === 'assignments' ? 'Поиск по поручениям' : 'Поиск по накладным');
    resetAdvancedFilters(false);
    closeInvoiceStatusDropdown();
    updateInvoiceStatusOptions();
    populateFilterOptions();
    rows.forEach((row) => {
      row.classList.remove('selected-row');
      row.querySelector('.row-checkbox').checked = false;
    });
    [document.querySelector('#selectAll'), document.querySelector('#applicationSelectAll'), document.querySelector('#assignmentSelectAll'), document.querySelector('#counterpartyAssignmentSelectAll'), document.querySelector('#draftAssignmentSelectAll'), document.querySelector('#archiveAssignmentSelectAll')].forEach((selectAll) => {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    });
    updateRows();
    updateReceiptsForView(true);
  });
});

const receiptsTable = document.querySelector('.receipts-table');
const receiptSeedRows = [...receiptsTable.querySelectorAll('.receipt-row')];
const extraReceiptDates = [
  '09.07', '08.07', '07.07', '06.07', '05.07',
  '04.07', '03.07', '02.07', '01.07', '30.06',
  '29.06', '28.06', '27.06', '26.06', '25.06',
  '24.06', '23.06', '22.06', '21.06', '20.06',
];

extraReceiptDates.forEach((date, index) => {
  const row = receiptSeedRows[index % receiptSeedRows.length].cloneNode(true);
  row.querySelector(':scope > div:first-child strong').textContent = String(676541 + index).padStart(10, '0');
  row.querySelector(':scope > div:first-child .receipt-muted').textContent = `от ${date}`;
  receiptsTable.append(row);
});

const receiptRows = [...receiptsTable.querySelectorAll('.receipt-row')];
receiptRows.forEach((row, index) => {
  row.querySelector(':scope > div:first-child strong').textContent = String(676534 + index).padStart(10, '0');
});
const receiptsPagination = document.querySelector('.receipts-pagination');
const receiptsPerPage = 20;
const receiptsPageCount = Math.ceil(receiptRows.length / receiptsPerPage);
let activeReceiptsPage = 1;

function showReceiptsPage(page) {
  activeReceiptsPage = Math.min(Math.max(page, 1), receiptsPageCount);
  receiptRows.forEach((row, index) => {
    row.hidden = Math.floor(index / receiptsPerPage) + 1 !== activeReceiptsPage;
  });
  receiptsPagination.querySelectorAll('[data-receipts-page]').forEach((button) => {
    const isSelected = Number(button.dataset.receiptsPage) === activeReceiptsPage;
    button.classList.toggle('selected', isSelected);
    if (isSelected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const nextButton = receiptsPagination.querySelector('.receipts-next');
  if (nextButton) nextButton.disabled = activeReceiptsPage === receiptsPageCount;
}

function updateReceiptsForView(resetPage = false) {
  if (activeView === 'archive-all') {
    receiptRows.forEach((row, index) => {
      row.hidden = index >= 8;
    });
    receiptsPagination.hidden = true;
    return;
  }

  if (resetPage) activeReceiptsPage = 1;
  receiptsPagination.hidden = receiptsPageCount <= 1;
  showReceiptsPage(activeReceiptsPage);
}

if (receiptsPageCount > 1) {
  receiptsPagination.hidden = false;
  for (let page = 1; page <= receiptsPageCount; page += 1) {
    const pageButton = document.createElement('button');
    pageButton.type = 'button';
    pageButton.dataset.receiptsPage = String(page);
    pageButton.textContent = String(page);
    pageButton.addEventListener('click', () => showReceiptsPage(page));
    receiptsPagination.append(pageButton);
  }
  const nextButton = document.createElement('button');
  nextButton.className = 'receipts-next';
  nextButton.type = 'button';
  nextButton.append('Дальше');
  const nextIcon = document.createElement('img');
  nextIcon.src = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjAgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJhcnJvdy1jLXJpZ2h0LTIwLWxpZ2h0Ij4KPHBhdGggaWQ9Ikljb24iIGQ9Ik03LjAyMTQ1IDMuMzk2NDVDNy4yMTY3MSAzLjIwMTE4IDcuNTMzMjkgMy4yMDExOCA3LjcyODU1IDMuMzk2NDVMMTIuNTY0NSA4LjIzMjM2QzEzLjU0MDggOS4yMDg2NyAxMy41NDA4IDEwLjc5MTYgMTIuNTY0NSAxMS43Njc5TDcuNzI4NTUgMTYuNjAzOEM3LjUzMzI5IDE2Ljc5OTEgNy4yMTY3MSAxNi43OTkxIDcuMDIxNDUgMTYuNjAzOEM2LjgyNjE4IDE2LjQwODYgNi44MjYxOCAxNi4wOTIgNy4wMjE0NSAxNS44OTY3TDExLjg1NzQgMTEuMDYwOEMxMi40NDMyIDEwLjQ3NSAxMi40NDMyIDkuNTI1MjYgMTEuODU3NCA4LjkzOTQ3TDcuMDIxNDUgNC4xMDM1NUM2LjgyNjE5IDMuOTA4MjkgNi44MjYxOSAzLjU5MTcxIDcuMDIxNDUgMy4zOTY0NVoiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuODgiLz4KPC9nPgo8L3N2Zz4K';
  nextIcon.alt = '';
  nextButton.append(nextIcon);
  nextButton.addEventListener('click', () => showReceiptsPage(activeReceiptsPage + 1));
  receiptsPagination.append(nextButton);
}

showReceiptsPage(1);

function openReceiptDetail(row) {
  row.classList.remove('unread-document');
  receiptDetailNumber.textContent = row.querySelector(':scope > div:first-child strong').textContent.trim();
  assignmentDetailView.hidden = true;
  applicationDetailView.hidden = true;
  invoiceDetailView.hidden = true;
  document.querySelector('.page-header').hidden = true;
  document.querySelector('.workspace').hidden = true;
  receiptDetailView.hidden = false;
  window.scrollTo(0, 0);
}

receiptRows.forEach((row) => {
  const number = row.querySelector(':scope > div:first-child strong').textContent.trim();
  row.tabIndex = 0;
  row.setAttribute('role', 'button');
  row.setAttribute('aria-label', `Открыть экспедиторскую расписку ${number}`);
  row.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    openReceiptDetail(row);
  });
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openReceiptDetail(row);
    }
  });
});

receiptDetailBack.addEventListener('click', () => {
  receiptDetailView.hidden = true;
  document.querySelector('.page-header').hidden = false;
  document.querySelector('.workspace').hidden = false;
  document.querySelector('#receiptsTab').focus();
});

document.querySelector('#receiptDetailOrder').addEventListener('click', (event) => event.preventDefault());

let lastOpenedAssignmentRow = null;

function openAssignmentDetail(row) {
  row.classList.remove('unread-document');
  lastOpenedAssignmentRow = row;
  assignmentDetailNumber.textContent = row.querySelector('.invoice-cell strong').textContent.trim();
  const isDraftAssignment = row.dataset.status === 'assignment-draft';
  const isWaitingForSender = row.dataset.status === 'assignment-signature';
  const isWaitingForForwarder = row.dataset.status === 'assignment-carrier';
  const isSignatureError = row.dataset.status === 'assignment-error';
  assignmentDetailStatus.textContent = isDraftAssignment
    ? 'Черновик'
    : isSignatureError
      ? 'Ошибка подписи'
    : isWaitingForForwarder
      ? 'Ожидает подпись экспедитора'
      : 'Ожидает подписи отправителя';
  assignmentDetailStatus.classList.toggle('application-status-waiting', isWaitingForSender || isWaitingForForwarder);
  assignmentDetailStatus.classList.toggle('application-status-error', isSignatureError);
  assignmentDetailStatus.hidden = !(isDraftAssignment || isSignatureError || isWaitingForSender || isWaitingForForwarder);
  receiptDetailView.hidden = true;
  applicationDetailView.hidden = true;
  invoiceDetailView.hidden = true;
  document.querySelector('.page-header').hidden = true;
  document.querySelector('.workspace').hidden = true;
  assignmentDetailView.hidden = false;
  window.scrollTo(0, 0);
}

assignmentRows.forEach((row) => {
  const number = row.querySelector('.invoice-cell strong').textContent.trim();
  row.setAttribute('role', 'button');
  row.setAttribute('aria-label', `Открыть поручение экспедитору ${number}`);
  row.addEventListener('click', (event) => {
    if (event.target.closest('.progress') || event.target.closest('.row-check') || event.target.closest('.row-actions')) return;
    openAssignmentDetail(row);
  });
  row.addEventListener('keydown', (event) => {
    if (event.target !== row) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAssignmentDetail(row);
    }
  });
});

assignmentDetailBack.addEventListener('click', () => {
  assignmentDetailView.hidden = true;
  document.querySelector('.page-header').hidden = false;
  document.querySelector('.workspace').hidden = false;
  if (lastOpenedAssignmentRow) lastOpenedAssignmentRow.focus();
});

let lastOpenedApplicationRow = null;

function openApplicationDetail(row) {
  row.classList.remove('unread-document');
  const invoiceCell = row.querySelector('.invoice-cell');
  const number = invoiceCell.querySelector('strong').textContent.trim();
  const customer = invoiceCell.nextElementSibling?.querySelector('strong')?.textContent.trim() || 'ООО «Глобал Логистик»';
  lastOpenedApplicationRow = row;
  applicationDetailNumber.textContent = number;
  applicationInfoNumber.textContent = number;
  applicationInfoDate.textContent = normalizeDetailDate(invoiceCell.querySelector('.muted')?.textContent || '05.08');
  applicationCarrierName.textContent = customer;
  const isSignatureError = row.dataset.status === 'error';
  const isWaitingForSender = row.dataset.status === 'waiting' && Boolean(row.closest('#applicationRows'));
  const isCounterpartyApplication = row.dataset.status === 'carrier-signature';
  const isCompletedApplication = row.dataset.status === 'completed';
  const isRejectedApplication = row.dataset.status === 'rejected';
  const isDraftApplication = row.dataset.status === 'draft' || row.classList.contains('draft-row');
  const isArchiveFinalApplication = isCompletedApplication || isRejectedApplication;
  const isReadOnlyApplication = isCounterpartyApplication || isArchiveFinalApplication;
  applicationPrimaryAction.textContent = isSignatureError ? 'Подписать снова' : 'Подписать';
  applicationPrimaryAction.hidden = isReadOnlyApplication;
  applicationEditAction.hidden = isSignatureError || isReadOnlyApplication;
  applicationDetailStatus.textContent = isDraftApplication
    ? 'Черновик'
    : isSignatureError
      ? 'Ошибка подписи'
    : isCompletedApplication
      ? 'Согласовано перевозчиком'
    : isRejectedApplication
      ? 'Отказ перевозчика'
    : isCounterpartyApplication
      ? 'Ожидает подписи перевозчика'
      : 'Ожидает подписи отправителя';
  applicationDetailStatus.classList.toggle('application-status-waiting', isWaitingForSender || isCounterpartyApplication || isCompletedApplication);
  applicationDetailStatus.classList.toggle('application-status-error', isSignatureError || isRejectedApplication);
  applicationDetailStatus.hidden = !(isDraftApplication || isSignatureError || isCompletedApplication || isRejectedApplication || isWaitingForSender || isCounterpartyApplication);
  applicationCompletedTabs.forEach((tab) => { tab.hidden = !isArchiveFinalApplication; });
  receiptDetailView.hidden = true;
  assignmentDetailView.hidden = true;
  invoiceDetailView.hidden = true;
  document.querySelector('.page-header').hidden = true;
  document.querySelector('.workspace').hidden = true;
  applicationDetailView.hidden = false;
  window.scrollTo(0, 0);
}

function closeApplicationDetail() {
  applicationDetailView.hidden = true;
  document.querySelector('.page-header').hidden = false;
  document.querySelector('.workspace').hidden = false;
  if (lastOpenedApplicationRow) lastOpenedApplicationRow.focus();
}

applicationDetailBack.addEventListener('click', closeApplicationDetail);
applicationDetailListBack.addEventListener('click', closeApplicationDetail);

let lastOpenedInvoiceRow = null;

function normalizeDetailDate(shortDate) {
  const value = shortDate.replace(/^от\s+/, '').trim();
  return `${value}.2026`;
}

function openInvoiceDetail(row) {
  row.classList.remove('unread-document');
  const cells = [...row.children].filter((cell) => !cell.classList.contains('row-check') && !cell.classList.contains('row-actions'));
  const invoiceCell = row.querySelector('.invoice-cell');
  const senderCell = cells[1];
  const recipientCell = cells[2];
  const cargoCell = cells[3];
  const number = invoiceCell.querySelector('strong').textContent.trim();
  const progressSegments = [...invoiceCell.querySelector('.progress')?.children || []].filter((segment) => !segment.classList.contains('progress-tooltip'));
  const isCarrierSignature = progressSegments.some((segment, index) => segment.classList.contains('striped') && index > 0);
  const isInTransit = row.dataset.status === 'route';
  const isAtUnloading = row.dataset.status === 'unloading';
  const isTransportCost = row.dataset.status === 'transport-cost' && Boolean(row.closest('#rows'));
  const isReadyToSign = row.dataset.status === 'signature' && Boolean(row.closest('#rows'));
  const isSignatureError = row.dataset.status === 'error' && Boolean(row.closest('#rows'));
  const isDraft = Boolean(row.closest('#draftRows')) || row.dataset.status === 'draft';
  const isCompletedDelivery = row.dataset.archiveSection === 'completed' && row.dataset.status === 'delivery';
  const isCompletedTransportCost = row.dataset.archiveSection === 'completed' && row.dataset.status === 'transport-cost';
  const isCompletedInvoice = isCompletedDelivery || isCompletedTransportCost;
  const isCarrierRejection = row.dataset.archiveSection === 'rejected' && row.dataset.status === 'carrier-rejection';
  const isRejectedTransportCost = row.dataset.archiveSection === 'rejected' && row.dataset.status === 'transport-cost';
  const isUnsignedStart = isReadyToSign || isDraft;
  const isCarrierAtUnloading = isAtUnloading && progressSegments.some((segment, index) => segment.classList.contains('striped') && index === 3);
  const isRejectedAtUnloading = isAtUnloading && progressSegments.some((segment) => segment.dataset.tooltip?.includes('отказал'));
  const hasCompletedLoading = isInTransit || isAtUnloading || isTransportCost || isCompletedInvoice || isRejectedTransportCost;

  lastOpenedInvoiceRow = row;
  invoiceDetailNumber.textContent = number;
  invoiceDetailStatus.hidden = !isDraft;
  invoiceInfoNumber.textContent = number;
  invoiceInfoDate.textContent = normalizeDetailDate(invoiceCell.querySelector('.muted')?.textContent || '23.07');
  invoiceSenderName.textContent = senderCell?.querySelector('strong')?.textContent.trim() || (isDraft ? '' : 'ООО «Хендэ Мотор СНГ»');
  invoiceSenderContact.textContent = senderCell?.querySelector('.muted')?.innerText.trim().split('\n')[0] || (isDraft ? '' : '+79006667766');
  invoiceRecipientName.textContent = recipientCell?.querySelector('strong')?.textContent.trim() || (isDraft ? '' : 'ООО «Инжиниринг Сервис»');
  invoiceRecipientAddress.textContent = recipientCell?.querySelector('.muted')?.textContent.trim() || (isDraft ? '' : 'Россия, 620000, г. Екатеринбург');
  invoiceCargoName.textContent = cargoCell?.querySelector('strong')?.textContent.trim() || (isDraft ? '' : 'Холодильное оборудование');
  invoiceSenderSignature.classList.toggle('is-muted', isUnsignedStart);
  invoiceSenderIcon.src = isSignatureError ? 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgaWQ9ImNlcnQtcm9zZXR0ZS0xNi1saWdodCI+CiAgICA8ZyBpZD0iSWNvbiI+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOCAyLjYyNUM2LjEzNjA0IDIuNjI1IDQuNjI1IDQuMTM2MDQgNC42MjUgNi4wMDAwMUM0LjYyNSA3Ljg2Mzk3IDYuMTM2MDQgOS4zNzUwMSA4IDkuMzc1MDFDOS44NjM5NyA5LjM3NTAxIDExLjM3NSA3Ljg2Mzk3IDExLjM3NSA2LjAwMDAxQzExLjM3NSA0LjEzNjA0IDkuODYzOTcgMi42MjUgOCAyLjYyNVpNNS42MjUgNi4wMDAwMUM1LjYyNSA0LjY4ODMzIDYuNjg4MzMgMy42MjUgOCAzLjYyNUM5LjMxMTY4IDMuNjI1IDEwLjM3NSA0LjY4ODMzIDEwLjM3NSA2LjAwMDAxQzEwLjM3NSA3LjMxMTY5IDkuMzExNjggOC4zNzUwMSA4IDguMzc1MDFDNi42ODgzMyA4LjM3NTAxIDUuNjI1IDcuMzExNjkgNS42MjUgNi4wMDAwMVoiIGZpbGw9IiNDNTAyMjAiLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTI1IDUuOTQ5NzFDMi4zNzUyNSAyLjg0MzI0IDQuODkzNTMgMC4zMjQ5NTEgOCAwLjMyNDk1MUMxMS4xMDY1IDAuMzI0OTUxIDEzLjYyNDggMi44NDMyNCAxMy42MjQ4IDUuOTQ5NzFDMTMuNjI0OCA3LjQyMjcyIDEzLjA1ODUgOC43NjM0OCAxMi4xMzE5IDkuNzY2MjJMMTMuOTM4NCAxMi4zNDYyQzE0LjI1NTIgMTIuNzk4NiAxNC4xNDUyIDEzLjQyMjIgMTMuNjkyOCAxMy43Mzg5TDExLjE1NzMgMTUuNTE0M0MxMC43MDQ5IDE1LjgzMTEgMTAuMDgxNCAxNS43MjEyIDkuNzY0NTggMTUuMjY4OEw4IDEyLjc0ODdMNi4yMzU0MiAxNS4yNjg4QzUuOTE4NjUgMTUuNzIxMiA1LjI5NTEgMTUuODMxMSA0Ljg0MjcgMTUuNTE0M0wyLjMwNzE3IDEzLjczODlDMS44NTQ3NiAxMy40MjIyIDEuNzQ0ODEgMTIuNzk4NiAyLjA2MTU5IDEyLjM0NjJMMy44NjgxMiA5Ljc2NjIyQzIuOTQxNDYgOC43NjM0OCAyLjM3NTI1IDcuNDIyNzIgMi4zNzUyNSA1Ljk0OTcxWk04IDEuMzI0OTVDNS40NDU4MiAxLjMyNDk1IDMuMzc1MjUgMy4zOTU1MiAzLjM3NTI1IDUuOTQ5NzFDMy4zNzUyNSA4LjUwMzg5IDUuNDQ1ODIgMTAuNTc0NSA4IDEwLjU3NDVDMTAuNTU0MiAxMC41NzQ1IDEyLjYyNDggOC41MDM4OSAxMi42MjQ4IDUuOTQ5NzFDMTIuNjI0OCAzLjM5NTUyIDEwLjU1NDIgMS4zMjQ5NSA4IDEuMzI0OTVaTTguMzg3OTIgMTEuNTYxM0M5LjUwODgxIDExLjQ4NDkgMTAuNTM5NSAxMS4wODAyIDExLjM4NDcgMTAuNDQyNUwxMy4xMTkzIDEyLjkxOThMMTAuNTgzNyAxNC42OTUyTDguNDE2MjMgMTEuNTk5N0M4LjQwNzQ2IDExLjU4NjUgOC4zOTgwMiAxMS41NzM3IDguMzg3OTIgMTEuNTYxM1pNNC42MTUzNCAxMC40NDI1QzUuNDYwNDUgMTEuMDgwMiA2LjQ5MTE5IDExLjQ4NDkgNy42MTIwOSAxMS41NjEzQzcuNjAxOTggMTEuNTczNyA3LjU5MjU0IDExLjU4NjUgNy41ODM3NyAxMS41OTk3TDUuNDE2MjcgMTQuNjk1MkwyLjg4MDc0IDEyLjkxOThMNC42MTUzNCAxMC40NDI1WiIgZmlsbD0iI0M1MDIyMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==' : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjAwMDIxIDIuNjI1QzYuMTM2MjQgMi42MjUgNC42MjUyIDQuMTM2MDQgNC42MjUyIDYuMDAwMDFDNC42MjUyIDcuODYzOTcgNi4xMzYyNCA5LjM3NTAxIDguMDAwMjEgOS4zNzUwMUM5Ljg2NDE3IDkuMzc1MDEgMTEuMzc1MiA3Ljg2Mzk3IDExLjM3NTIgNi4wMDAwMUMxMS4zNzUyIDQuMTM2MDQgOS44NjQxNyAyLjYyNSA4LjAwMDIxIDIuNjI1Wk01LjYyNTIgNi4wMDAwMUM1LjYyNTIgNC42ODgzMyA2LjY4ODUzIDMuNjI1IDguMDAwMjEgMy42MjVDOS4zMTE4OSAzLjYyNSAxMC4zNzUyIDQuNjg4MzMgMTAuMzc1MiA2LjAwMDAxQzEwLjM3NTIgNy4zMTE2OSA5LjMxMTg5IDguMzc1MDEgOC4wMDAyMSA4LjM3NTAxQzYuNjg4NTMgOC4zNzUwMSA1LjYyNTIgNy4zMTE2OSA1LjYyNTIgNi4wMDAwMVoiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuODgiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTQ1IDUuOTQ5NzFDMi4zNzU0NSAyLjg0MzI0IDQuODkzNzQgMC4zMjQ5NTEgOC4wMDAyIDAuMzI0OTUxQzExLjEwNjcgMC4zMjQ5NTEgMTMuNjI1IDIuODQzMjQgMTMuNjI1IDUuOTQ5NzFDMTMuNjI1IDcuNDIyNzIgMTMuMDU4NyA4Ljc2MzQ4IDEyLjEzMjEgOS43NjYyMkwxMy45Mzg2IDEyLjM0NjJDMTQuMjU1NCAxMi43OTg2IDE0LjE0NTQgMTMuNDIyMiAxMy42OTMgMTMuNzM4OUwxMS4xNTc1IDE1LjUxNDNDMTAuNzA1MSAxNS44MzExIDEwLjA4MTYgMTUuNzIxMiA5Ljc2NDc4IDE1LjI2ODhMOC4wMDAyIDEyLjc0ODdMNi4yMzU2MyAxNS4yNjg4QzUuOTE4ODUgMTUuNzIxMiA1LjI5NTMgMTUuODMxMSA0Ljg0MjkgMTUuNTE0M0wyLjMwNzM3IDEzLjczODlDMS44NTQ5NiAxMy40MjIyIDEuNzQ1MDIgMTIuNzk4NiAyLjA2MTc5IDEyLjM0NjJMMy44NjgzMyA5Ljc2NjIyQzIuOTQxNjcgOC43NjM0OCAyLjM3NTQ1IDcuNDIyNzIgMi4zNzU0NSA1Ljk0OTcxWk04LjAwMDIgMS4zMjQ5NUM1LjQ0NjAyIDEuMzI0OTUgMy4zNzU0NSAzLjM5NTUyIDMuMzc1NDUgNS45NDk3MUMzLjM3NTQ1IDguNTAzODkgNS40NDYwMiAxMC41NzQ1IDguMDAwMiAxMC41NzQ1QzEwLjU1NDQgMTAuNTc0NSAxMi42MjUgOC41MDM4OSAxMi42MjUgNS45NDk3MUMxMi42MjUgMy4zOTU1MiAxMC41NTQ0IDEuMzI0OTUgOC4wMDAyIDEuMzI0OTVaTTguMzg4MTIgMTEuNTYxM0M5LjUwOTAyIDExLjQ4NDkgMTAuNTM5OCAxMS4wODAyIDExLjM4NDkgMTAuNDQyNUwxMy4xMTk1IDEyLjkxOThMMTAuNTgzOSAxNC42OTUyTDguNDE2NDQgMTEuNTk5N0M4LjQwNzY2IDExLjU4NjUgOC4zOTgyMiAxMS41NzM3IDguMzg4MTIgMTEuNTYxM1pNNC42MTU1NCAxMC40NDI1QzUuNDYwNjUgMTEuMDgwMiA2LjQ5MTM5IDExLjQ4NDkgNy42MTIyOSAxMS41NjEzQzcuNjAyMTkgMTEuNTczNyA3LjU5Mjc0IDExLjU4NjUgNy41ODM5NyAxMS41OTk3TDUuNDE2NDcgMTQuNjk1MkwyLjg4MDk1IDEyLjkxOThMNC42MTU1NCAxMC40NDI1WiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC44OCIvPgo8L3N2Zz4K';
  invoiceSenderSigner.hidden = isUnsignedStart;
  invoiceDriverName.hidden = !(isCarrierSignature || hasCompletedLoading || isCarrierRejection);
  invoiceCarrierSigner.hidden = !(hasCompletedLoading || isCarrierRejection);
  invoiceCarrierSignature.classList.toggle('is-muted', !(hasCompletedLoading || isCarrierRejection));
  invoiceCarrierIcon.src = isCarrierRejection ? 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgaWQ9ImNlcnQtcm9zZXR0ZS0xNi1saWdodCI+CiAgICA8ZyBpZD0iSWNvbiI+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOCAyLjYyNUM2LjEzNjA0IDIuNjI1IDQuNjI1IDQuMTM2MDQgNC42MjUgNi4wMDAwMUM0LjYyNSA3Ljg2Mzk3IDYuMTM2MDQgOS4zNzUwMSA4IDkuMzc1MDFDOS44NjM5NyA5LjM3NTAxIDExLjM3NSA3Ljg2Mzk3IDExLjM3NSA2LjAwMDAxQzExLjM3NSA0LjEzNjA0IDkuODYzOTcgMi42MjUgOCAyLjYyNVpNNS42MjUgNi4wMDAwMUM1LjYyNSA0LjY4ODMzIDYuNjg4MzMgMy42MjUgOCAzLjYyNUM5LjMxMTY4IDMuNjI1IDEwLjM3NSA0LjY4ODMzIDEwLjM3NSA2LjAwMDAxQzEwLjM3NSA3LjMxMTY5IDkuMzExNjggOC4zNzUwMSA4IDguMzc1MDFDNi42ODgzMyA4LjM3NTAxIDUuNjI1IDcuMzExNjkgNS42MjUgNi4wMDAwMVoiIGZpbGw9IiNDNTAyMjAiLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTI1IDUuOTQ5NzFDMi4zNzUyNSAyLjg0MzI0IDQuODkzNTMgMC4zMjQ5NTEgOCAwLjMyNDk1MUMxMS4xMDY1IDAuMzI0OTUxIDEzLjYyNDggMi44NDMyNCAxMy42MjQ4IDUuOTQ5NzFDMTMuNjI0OCA3LjQyMjcyIDEzLjA1ODUgOC43NjM0OCAxMi4xMzE5IDkuNzY2MjJMMTMuOTM4NCAxMi4zNDYyQzE0LjI1NTIgMTIuNzk4NiAxNC4xNDUyIDEzLjQyMjIgMTMuNjkyOCAxMy43Mzg5TDExLjE1NzMgMTUuNTE0M0MxMC43MDQ5IDE1LjgzMTEgMTAuMDgxNCAxNS43MjEyIDkuNzY0NTggMTUuMjY4OEw4IDEyLjc0ODdMNi4yMzU0MiAxNS4yNjg4QzUuOTE4NjUgMTUuNzIxMiA1LjI5NTEgMTUuODMxMSA0Ljg0MjcgMTUuNTE0M0wyLjMwNzE3IDEzLjczODlDMS44NTQ3NiAxMy40MjIyIDEuNzQ0ODEgMTIuNzk4NiAyLjA2MTU5IDEyLjM0NjJMMy44NjgxMiA5Ljc2NjIyQzIuOTQxNDYgOC43NjM0OCAyLjM3NTI1IDcuNDIyNzIgMi4zNzUyNSA1Ljk0OTcxWk04IDEuMzI0OTVDNS40NDU4MiAxLjMyNDk1IDMuMzc1MjUgMy4zOTU1MiAzLjM3NTI1IDUuOTQ5NzFDMy4zNzUyNSA4LjUwMzg5IDUuNDQ1ODIgMTAuNTc0NSA4IDEwLjU3NDVDMTAuNTU0MiAxMC41NzQ1IDEyLjYyNDggOC41MDM4OSAxMi42MjQ4IDUuOTQ5NzFDMTIuNjI0OCAzLjM5NTUyIDEwLjU1NDIgMS4zMjQ5NSA4IDEuMzI0OTVaTTguMzg3OTIgMTEuNTYxM0M5LjUwODgxIDExLjQ4NDkgMTAuNTM5NSAxMS4wODAyIDExLjM4NDcgMTAuNDQyNUwxMy4xMTkzIDEyLjkxOThMMTAuNTgzNyAxNC42OTUyTDguNDE2MjMgMTEuNTk5N0M4LjQwNzQ2IDExLjU4NjUgOC4zOTgwMiAxMS41NzM3IDguMzg3OTIgMTEuNTYxM1pNNC42MTUzNCAxMC40NDI1QzUuNDYwNDUgMTEuMDgwMiA2LjQ5MTE5IDExLjQ4NDkgNy42MTIwOSAxMS41NjEzQzcuNjAxOTggMTEuNTczNyA3LjU5MjU0IDExLjU4NjUgNy41ODM3NyAxMS41OTk3TDUuNDE2MjcgMTQuNjk1MkwyLjg4MDc0IDEyLjkxOThMNC42MTUzNCAxMC40NDI1WiIgZmlsbD0iI0M1MDIyMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==' : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjAwMDIxIDIuNjI1QzYuMTM2MjQgMi42MjUgNC42MjUyIDQuMTM2MDQgNC42MjUyIDYuMDAwMDFDNC42MjUyIDcuODYzOTcgNi4xMzYyNCA5LjM3NTAxIDguMDAwMjEgOS4zNzUwMUM5Ljg2NDE3IDkuMzc1MDEgMTEuMzc1MiA3Ljg2Mzk3IDExLjM3NTIgNi4wMDAwMUMxMS4zNzUyIDQuMTM2MDQgOS44NjQxNyAyLjYyNSA4LjAwMDIxIDIuNjI1Wk01LjYyNTIgNi4wMDAwMUM1LjYyNTIgNC42ODgzMyA2LjY4ODUzIDMuNjI1IDguMDAwMjEgMy42MjVDOS4zMTE4OSAzLjYyNSAxMC4zNzUyIDQuNjg4MzMgMTAuMzc1MiA2LjAwMDAxQzEwLjM3NTIgNy4zMTE2OSA5LjMxMTg5IDguMzc1MDEgOC4wMDAyMSA4LjM3NTAxQzYuNjg4NTMgOC4zNzUwMSA1LjYyNTIgNy4zMTE2OSA1LjYyNTIgNi4wMDAwMVoiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuODgiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTQ1IDUuOTQ5NzFDMi4zNzU0NSAyLjg0MzI0IDQuODkzNzQgMC4zMjQ5NTEgOC4wMDAyIDAuMzI0OTUxQzExLjEwNjcgMC4zMjQ5NTEgMTMuNjI1IDIuODQzMjQgMTMuNjI1IDUuOTQ5NzFDMTMuNjI1IDcuNDIyNzIgMTMuMDU4NyA4Ljc2MzQ4IDEyLjEzMjEgOS43NjYyMkwxMy45Mzg2IDEyLjM0NjJDMTQuMjU1NCAxMi43OTg2IDE0LjE0NTQgMTMuNDIyMiAxMy42OTMgMTMuNzM4OUwxMS4xNTc1IDE1LjUxNDNDMTAuNzA1MSAxNS44MzExIDEwLjA4MTYgMTUuNzIxMiA5Ljc2NDc4IDE1LjI2ODhMOC4wMDAyIDEyLjc0ODdMNi4yMzU2MyAxNS4yNjg4QzUuOTE4ODUgMTUuNzIxMiA1LjI5NTMgMTUuODMxMSA0Ljg0MjkgMTUuNTE0M0wyLjMwNzM3IDEzLjczODlDMS44NTQ5NiAxMy40MjIyIDEuNzQ1MDIgMTIuNzk4NiAyLjA2MTc5IDEyLjM0NjJMMy44NjgzMyA5Ljc2NjIyQzIuOTQxNjcgOC43NjM0OCAyLjM3NTQ1IDcuNDIyNzIgMi4zNzU0NSA1Ljk0OTcxWk04LjAwMDIgMS4zMjQ5NUM1LjQ0NjAyIDEuMzI0OTUgMy4zNzU0NSAzLjM5NTUyIDMuMzc1NDUgNS45NDk3MUMzLjM3NTQ1IDguNTAzODkgNS40NDYwMiAxMC41NzQ1IDguMDAwMiAxMC41NzQ1QzEwLjU1NDQgMTAuNTc0NSAxMi42MjUgOC41MDM4OSAxMi42MjUgNS45NDk3MUMxMi42MjUgMy4zOTU1MiAxMC41NTQ0IDEuMzI0OTUgOC4wMDAyIDEuMzI0OTVaTTguMzg4MTIgMTEuNTYxM0M5LjUwOTAyIDExLjQ4NDkgMTAuNTM5OCAxMS4wODAyIDExLjM4NDkgMTAuNDQyNUwxMy4xMTk1IDEyLjkxOThMMTAuNTgzOSAxNC42OTUyTDguNDE2NDQgMTEuNTk5N0M4LjQwNzY2IDExLjU4NjUgOC4zOTgyMiAxMS41NzM3IDguMzg4MTIgMTEuNTYxM1pNNC42MTU1NCAxMC40NDI1QzUuNDYwNjUgMTEuMDgwMiA2LjQ5MTM5IDExLjQ4NDkgNy42MTIyOSAxMS41NjEzQzcuNjAyMTkgMTEuNTczNyA3LjU5Mjc0IDExLjU4NjUgNy41ODM5NyAxMS41OTk3TDUuNDE2NDcgMTQuNjk1MkwyLjg4MDk1IDEyLjkxOThMNC42MTU1NCAxMC40NDI1WiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC44OCIvPgo8L3N2Zz4K';
  invoiceLoadingComment.hidden = !isCarrierRejection;
  invoiceQrSignature.classList.toggle('is-muted', !hasCompletedLoading);
  invoiceQrLabel.textContent = hasCompletedLoading ? 'QR-код получен' : 'QR-код';
  invoiceLoadingStep.classList.toggle('passed', isAtUnloading || isTransportCost || isCompletedInvoice || isRejectedTransportCost);
  invoiceCreatedStep.classList.toggle('rejected', isCarrierRejection);
  invoiceLoadingStep.classList.toggle('error', isSignatureError || isCarrierRejection);
  invoiceLoadingTitle.textContent = isSignatureError || isCarrierRejection ? 'До рейса' : 'Погрузка';
  const loadingToggle = document.querySelector('#invoiceLoadingToggle');
  const loadingSignatures = document.querySelector('#invoiceLoadingSignatures');
  const isLoadingExpanded = !(isTransportCost || isCompletedInvoice || isRejectedTransportCost);
  loadingToggle.setAttribute('aria-expanded', String(isLoadingExpanded));
  loadingToggle.querySelector('.invoice-timeline-chevron').classList.toggle('expanded', isLoadingExpanded);
  loadingSignatures.hidden = !isLoadingExpanded;
  invoiceUnloadingStep.classList.toggle('completed', isAtUnloading || isTransportCost || isCompletedInvoice || isRejectedTransportCost);
  invoiceUnloadingStep.classList.toggle('passed', isTransportCost || isCompletedInvoice);
  invoiceUnloadingStep.classList.toggle('rejected', isRejectedTransportCost);
  invoiceUnloadingToggle.setAttribute('aria-expanded', String(isAtUnloading));
  invoiceUnloadingChevron.hidden = !(isAtUnloading || isTransportCost);
  invoiceUnloadingChevron.classList.toggle('expanded', isAtUnloading);
  invoiceUnloadingSignatures.hidden = !isAtUnloading;
  invoiceUnloadingComment.hidden = isRejectedAtUnloading || isCarrierAtUnloading;
  invoiceUnloadingDriver.classList.toggle('is-muted', !isCarrierAtUnloading);
  invoiceUnloadingDriverName.hidden = !isCarrierAtUnloading;
  invoiceUnloadingCarrier.classList.add('is-muted');
  invoiceCostStep.hidden = !(isTransportCost || isCompletedTransportCost || isRejectedTransportCost);
  invoiceCostStep.classList.toggle('error', isRejectedTransportCost);
  invoiceCostStep.classList.toggle('passed', isCompletedTransportCost || isRejectedTransportCost);
  invoiceCompleteStep.classList.toggle('completed', isCompletedInvoice || isRejectedTransportCost);
  invoiceCostToggle.setAttribute('aria-expanded', String(isTransportCost));
  invoiceCostChevron.hidden = false;
  invoiceCostChevron.classList.toggle('expanded', isTransportCost);
  invoiceCostSignatures.hidden = !isTransportCost;
  invoiceCostSenderSignature.classList.toggle('is-muted', !(isCompletedTransportCost || isRejectedTransportCost));
  invoiceCostSenderIcon.src = isRejectedTransportCost ? 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgaWQ9ImNlcnQtcm9zZXR0ZS0xNi1saWdodCI+CiAgICA8ZyBpZD0iSWNvbiI+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOCAyLjYyNUM2LjEzNjA0IDIuNjI1IDQuNjI1IDQuMTM2MDQgNC42MjUgNi4wMDAwMUM0LjYyNSA3Ljg2Mzk3IDYuMTM2MDQgOS4zNzUwMSA4IDkuMzc1MDFDOS44NjM5NyA5LjM3NTAxIDExLjM3NSA3Ljg2Mzk3IDExLjM3NSA2LjAwMDAxQzExLjM3NSA0LjEzNjA0IDkuODYzOTcgMi42MjUgOCAyLjYyNVpNNS42MjUgNi4wMDAwMUM1LjYyNSA0LjY4ODMzIDYuNjg4MzMgMy42MjUgOCAzLjYyNUM5LjMxMTY4IDMuNjI1IDEwLjM3NSA0LjY4ODMzIDEwLjM3NSA2LjAwMDAxQzEwLjM3NSA3LjMxMTY5IDkuMzExNjggOC4zNzUwMSA4IDguMzc1MDFDNi42ODgzMyA4LjM3NTAxIDUuNjI1IDcuMzExNjkgNS42MjUgNi4wMDAwMVoiIGZpbGw9IiNDNTAyMjAiLz4KICAgICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTI1IDUuOTQ5NzFDMi4zNzUyNSAyLjg0MzI0IDQuODkzNTMgMC4zMjQ5NTEgOCAwLjMyNDk1MUMxMS4xMDY1IDAuMzI0OTUxIDEzLjYyNDggMi44NDMyNCAxMy42MjQ4IDUuOTQ5NzFDMTMuNjI0OCA3LjQyMjcyIDEzLjA1ODUgOC43NjM0OCAxMi4xMzE5IDkuNzY2MjJMMTMuOTM4NCAxMi4zNDYyQzE0LjI1NTIgMTIuNzk4NiAxNC4xNDUyIDEzLjQyMjIgMTMuNjkyOCAxMy43Mzg5TDExLjE1NzMgMTUuNTE0M0MxMC43MDQ5IDE1LjgzMTEgMTAuMDgxNCAxNS43MjEyIDkuNzY0NTggMTUuMjY4OEw4IDEyLjc0ODdMNi4yMzU0MiAxNS4yNjg4QzUuOTE4NjUgMTUuNzIxMiA1LjI5NTEgMTUuODMxMSA0Ljg0MjcgMTUuNTE0M0wyLjMwNzE3IDEzLjczODlDMS44NTQ3NiAxMy40MjIyIDEuNzQ0ODEgMTIuNzk4NiAyLjA2MTU5IDEyLjM0NjJMMy44NjgxMiA5Ljc2NjIyQzIuOTQxNDYgOC43NjM0OCAyLjM3NTI1IDcuNDIyNzIgMi4zNzUyNSA1Ljk0OTcxWk04IDEuMzI0OTVDNS40NDU4MiAxLjMyNDk1IDMuMzc1MjUgMy4zOTU1MiAzLjM3NTI1IDUuOTQ5NzFDMy4zNzUyNSA4LjUwMzg5IDUuNDQ1ODIgMTAuNTc0NSA4IDEwLjU3NDVDMTAuNTU0MiAxMC41NzQ1IDEyLjYyNDggOC41MDM4OSAxMi42MjQ4IDUuOTQ5NzFDMTIuNjI0OCAzLjM5NTUyIDEwLjU1NDIgMS4zMjQ5NSA4IDEuMzI0OTVaTTguMzg3OTIgMTEuNTYxM0M5LjUwODgxIDExLjQ4NDkgMTAuNTM5NSAxMS4wODAyIDExLjM4NDcgMTAuNDQyNUwxMy4xMTkzIDEyLjkxOThMMTAuNTgzNyAxNC42OTUyTDguNDE2MjMgMTEuNTk5N0M4LjQwNzQ2IDExLjU4NjUgOC4zOTgwMiAxMS41NzM3IDguMzg3OTIgMTEuNTYxM1pNNC42MTUzNCAxMC40NDI1QzUuNDYwNDUgMTEuMDgwMiA2LjQ5MTE5IDExLjQ4NDkgNy42MTIwOSAxMS41NjEzQzcuNjAxOTggMTEuNTczNyA3LjU5MjU0IDExLjU4NjUgNy41ODM3NyAxMS41OTk3TDUuNDE2MjcgMTQuNjk1MkwyLjg4MDc0IDEyLjkxOThMNC42MTUzNCAxMC40NDI1WiIgZmlsbD0iI0M1MDIyMCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==' : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjAwMDIxIDIuNjI1QzYuMTM2MjQgMi42MjUgNC42MjUyIDQuMTM2MDQgNC42MjUyIDYuMDAwMDFDNC42MjUyIDcuODYzOTcgNi4xMzYyNCA5LjM3NTAxIDguMDAwMjEgOS4zNzUwMUM5Ljg2NDE3IDkuMzc1MDEgMTEuMzc1MiA3Ljg2Mzk3IDExLjM3NTIgNi4wMDAwMUMxMS4zNzUyIDQuMTM2MDQgOS44NjQxNyAyLjYyNSA4LjAwMDIxIDIuNjI1Wk01LjYyNTIgNi4wMDAwMUM1LjYyNTIgNC42ODgzMyA2LjY4ODUzIDMuNjI1IDguMDAwMjEgMy42MjVDOS4zMTE4OSAzLjYyNSAxMC4zNzUyIDQuNjg4MzMgMTAuMzc1MiA2LjAwMDAxQzEwLjM3NTIgNy4zMTE2OSA5LjMxMTg5IDguMzc1MDEgOC4wMDAyMSA4LjM3NTAxQzYuNjg4NTMgOC4zNzUwMSA1LjYyNTIgNy4zMTE2OSA1LjYyNTIgNi4wMDAwMVoiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuODgiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjM3NTQ1IDUuOTQ5NzFDMi4zNzU0NSAyLjg0MzI0IDQuODkzNzQgMC4zMjQ5NTEgOC4wMDAyIDAuMzI0OTUxQzExLjEwNjcgMC4zMjQ5NTEgMTMuNjI1IDIuODQzMjQgMTMuNjI1IDUuOTQ5NzFDMTMuNjI1IDcuNDIyNzIgMTMuMDU4NyA4Ljc2MzQ4IDEyLjEzMjEgOS43NjYyMkwxMy45Mzg2IDEyLjM0NjJDMTQuMjU1NCAxMi43OTg2IDE0LjE0NTQgMTMuNDIyMiAxMy42OTMgMTMuNzM4OUwxMS4xNTc1IDE1LjUxNDNDMTAuNzA1MSAxNS44MzExIDEwLjA4MTYgMTUuNzIxMiA5Ljc2NDc4IDE1LjI2ODhMOC4wMDAyIDEyLjc0ODdMNi4yMzU2MyAxNS4yNjg4QzUuOTE4ODUgMTUuNzIxMiA1LjI5NTMgMTUuODMxMSA0Ljg0MjkgMTUuNTE0M0wyLjMwNzM3IDEzLjczODlDMS44NTQ5NiAxMy40MjIyIDEuNzQ1MDIgMTIuNzk4NiAyLjA2MTc5IDEyLjM0NjJMMy44NjgzMyA5Ljc2NjIyQzIuOTQxNjcgOC43NjM0OCAyLjM3NTQ1IDcuNDIyNzIgMi4zNzU0NSA1Ljk0OTcxWk04LjAwMDIgMS4zMjQ5NUM1LjQ0NjAyIDEuMzI0OTUgMy4zNzU0NSAzLjM5NTUyIDMuMzc1NDUgNS45NDk3MUMzLjM3NTQ1IDguNTAzODkgNS40NDYwMiAxMC41NzQ1IDguMDAwMiAxMC41NzQ1QzEwLjU1NDQgMTAuNTc0NSAxMi42MjUgOC41MDM4OSAxMi42MjUgNS45NDk3MUMxMi42MjUgMy4zOTU1MiAxMC41NTQ0IDEuMzI0OTUgOC4wMDAyIDEuMzI0OTVaTTguMzg4MTIgMTEuNTYxM0M5LjUwOTAyIDExLjQ4NDkgMTAuNTM5OCAxMS4wODAyIDExLjM4NDkgMTAuNDQyNUwxMy4xMTk1IDEyLjkxOThMMTAuNTgzOSAxNC42OTUyTDguNDE2NDQgMTEuNTk5N0M4LjQwNzY2IDExLjU4NjUgOC4zOTgyMiAxMS41NzM3IDguMzg4MTIgMTEuNTYxM1pNNC42MTU1NCAxMC40NDI1QzUuNDYwNjUgMTEuMDgwMiA2LjQ5MTM5IDExLjQ4NDkgNy42MTIyOSAxMS41NjEzQzcuNjAyMTkgMTEuNTczNyA3LjU5Mjc0IDExLjU4NjUgNy41ODM5NyAxMS41OTk3TDUuNDE2NDcgMTQuNjk1MkwyLjg4MDk1IDEyLjkxOThMNC42MTU1NCAxMC40NDI1WiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC44OCIvPgo8L3N2Zz4K';
  invoiceCostSenderSigner.hidden = !(isCompletedTransportCost || isRejectedTransportCost);
  invoiceStatusActions.hidden = !(isTransportCost || isReadyToSign || isSignatureError || isDraft);
  invoicePrimaryAction.textContent = isSignatureError ? 'Подписать снова' : 'Подписать';
  invoiceSecondaryAction.textContent = isReadyToSign || isDraft ? 'Отправить на подпись' : 'Отказать в подписи';
  invoiceSecondaryAction.hidden = isSignatureError;
  invoiceTertiaryAction.hidden = !(isReadyToSign || isDraft);
  invoiceStatusInfo.hidden = !isSignatureError;
  invoiceCostDetails.hidden = !(isTransportCost || isCompletedTransportCost || isRejectedTransportCost);
  invoiceCurrentStatusText.textContent = isCompletedInvoice || isRejectedTransportCost
    ? 'Перевозка завершена'
    : isCarrierRejection
    ? 'Перевозчик отказал в подписи. Документооборот завершен'
    : isSignatureError
    ? 'Подпись не прошла проверку'
    : isReadyToSign || isDraft
    ? 'Накладная готова к подписанию и отправке'
    : isTransportCost
    ? 'Перевозчик выставил титул стоимости'
    : isInTransit
      ? 'Машина в пути'
      : isCarrierAtUnloading || isCarrierSignature
        ? 'Ожидает подписи перевозчика'
        : 'Ожидает подписи водителя';

  const createdToggle = document.querySelector('#invoiceCreatedToggle');
  createdToggle.setAttribute('aria-expanded', 'false');
  createdToggle.querySelector('.invoice-timeline-chevron').classList.remove('expanded');
  document.querySelector('#invoiceCreatedSignature').hidden = true;

  receiptDetailView.hidden = true;
  assignmentDetailView.hidden = true;
  applicationDetailView.hidden = true;
  document.querySelector('.page-header').hidden = true;
  document.querySelector('.workspace').hidden = true;
  invoiceDetailView.hidden = false;
  window.scrollTo(0, 0);
}

invoiceDetailBack.addEventListener('click', () => {
  invoiceDetailView.hidden = true;
  document.querySelector('.page-header').hidden = false;
  document.querySelector('.workspace').hidden = false;
  if (lastOpenedInvoiceRow) lastOpenedInvoiceRow.focus();
});

document.querySelector('#invoiceLoadingToggle').addEventListener('click', (event) => {
  const signatures = document.querySelector('#invoiceLoadingSignatures');
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  event.currentTarget.querySelector('.invoice-timeline-chevron').classList.toggle('expanded', !expanded);
  signatures.hidden = expanded;
});

document.querySelector('#invoiceCreatedToggle').addEventListener('click', (event) => {
  const signature = document.querySelector('#invoiceCreatedSignature');
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  event.currentTarget.querySelector('.invoice-timeline-chevron').classList.toggle('expanded', !expanded);
  signature.hidden = expanded;
});

invoiceUnloadingToggle.addEventListener('click', (event) => {
  if (invoiceUnloadingChevron.hidden) return;
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  invoiceUnloadingChevron.classList.toggle('expanded', !expanded);
  invoiceUnloadingSignatures.hidden = expanded;
});

invoiceCostToggle.addEventListener('click', (event) => {
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  event.currentTarget.querySelector('.invoice-timeline-chevron').classList.toggle('expanded', !expanded);
  invoiceCostSignatures.hidden = expanded;
});

function hasInvoiceDetailForRow(row) {
  if (row.dataset.archiveSection === 'completed' && (row.dataset.status === 'delivery' || row.dataset.status === 'transport-cost')) return true;
  if (row.dataset.archiveSection === 'rejected' && (row.dataset.status === 'carrier-rejection' || row.dataset.status === 'transport-cost')) return true;
  if (row.closest('#draftRows') || row.dataset.status === 'draft') return true;
  if (row.dataset.status === 'loading' || row.dataset.status === 'route') return true;
  if (row.dataset.status === 'transport-cost') return Boolean(row.closest('#rows'));
  if (row.dataset.status === 'signature') return Boolean(row.closest('#rows'));
  if (row.dataset.status === 'error') return Boolean(row.closest('#rows'));
  return row.dataset.status === 'unloading';
}

function canOpenDocumentRow(row) {
  if (row.classList.contains('receipt-row') || row.classList.contains('assignment-row')) return true;
  if (row.closest('#applicationRows, #counterpartyApplicationRows, #draftApplicationRows, #archiveApplicationRows')) return true;
  return hasInvoiceDetailForRow(row);
}

function selectRandomUnreadDocuments(groupRows) {
  const candidates = [...new Set(groupRows)].filter(canOpenDocumentRow);
  const count = Math.min(candidates.length, candidates.length > 4 ? 2 : 1);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
  }
  candidates.slice(0, count).forEach((row) => row.classList.add('unread-document'));
}

function initializeUnreadDocuments() {
  [
    '#rows > .table-row',
    '#counterpartyRows > .table-row',
    '#draftRows > .table-row',
    '#applicationRows > .table-row',
    '#counterpartyApplicationRows > .table-row',
    '#draftApplicationRows > .table-row',
    '#assignmentsView .assignment-row',
    '#counterpartyAssignmentsView .assignment-row',
    '#draftAssignmentsView .assignment-row',
  ].forEach((selector) => selectRandomUnreadDocuments(document.querySelectorAll(selector)));

  ['completed', 'rejected', 'trash', 'all'].forEach((section) => {
    selectRandomUnreadDocuments(document.querySelectorAll(`#archiveRows > [data-archive-section="${section}"]`));
    selectRandomUnreadDocuments(document.querySelectorAll(`#archiveApplicationRows > [data-archive-section="${section}"]`));
    selectRandomUnreadDocuments(document.querySelectorAll(`#archiveAssignmentsView [data-archive-section="${section}"]`));
  });

  selectRandomUnreadDocuments(receiptRows);
}

initializeUnreadDocuments();

document.querySelectorAll('.forwarding-order[href="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

rows.forEach((row) => row.addEventListener('click', (event) => {
  if (event.target.closest('.progress') || event.target.closest('.row-check') || event.target.closest('.row-actions')) return;
  if (activeDocumentTab === 'assignments') return;
  if (activeDocumentTab === 'applications' && (row.dataset.status === 'waiting' || row.dataset.status === 'error' || row.dataset.status === 'carrier-signature' || row.dataset.status === 'completed' || row.dataset.status === 'rejected' || row.dataset.status === 'draft' || row.classList.contains('draft-row'))) {
    openApplicationDetail(row);
    return;
  }
  if (activeDocumentTab === 'invoices' && hasInvoiceDetailForRow(row)) {
    openInvoiceDetail(row);
    return;
  }
  showToast(activeDocumentTab === 'applications' ? 'Открытие заявки будет подключено в следующем шаге' : 'Открытие накладной будет подключено в следующем шаге');
}));

rows.forEach((row) => row.addEventListener('keydown', (event) => {
  if (event.target !== row) return;
  if (event.key === 'Enter' || event.key === ' ') {
    if (activeDocumentTab === 'applications' && (row.dataset.status === 'waiting' || row.dataset.status === 'error' || row.dataset.status === 'carrier-signature' || row.dataset.status === 'completed' || row.dataset.status === 'rejected' || row.dataset.status === 'draft' || row.classList.contains('draft-row'))) {
      event.preventDefault();
      openApplicationDetail(row);
      return;
    }
    if (activeDocumentTab !== 'invoices' || !hasInvoiceDetailForRow(row)) return;
    event.preventDefault();
    openInvoiceDetail(row);
  }
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

['#selectAll', '#applicationSelectAll', '#assignmentSelectAll', '#counterpartyAssignmentSelectAll', '#draftAssignmentSelectAll', '#archiveAssignmentSelectAll'].forEach((selector) => {
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

document.querySelector('#brandLogo').addEventListener('click', () => {
  window.location.reload();
});

updateInvoiceStatusOptions();
[senderFilter, recipientFilter, customerFilter, carrierFilter, applicationCarrierFilter, applicationSupplyPointFilter, statusFilter, assignmentForwarderFilter, assignmentShipperFilter, assignmentStatusFilter, assignmentTopStatusFilter].forEach(enhanceFilterSelect);
updateFilterPanelFields();
populateFilterOptions();
document.querySelector('#workingAllNav').click();
