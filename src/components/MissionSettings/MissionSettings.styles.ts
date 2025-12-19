import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  // Two column layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  // Section styles (matching Preview)
  section: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 12,
  },
  sectionHeader: {
    backgroundColor: '#FFE135',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  sectionContent: {
    padding: 10,
  },
  // Form row styles
  formRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  formRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Label and input styles
  labelCell: {
    flex: 1,
    paddingRight: 8,
  },
  valueCell: {
    flex: 1.5,
  },
  label: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#fff',
    fontSize: 12,
    height: 32,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    backgroundColor: '#fff',
    fontSize: 11,
    height: 28,
    textAlign: 'center',
  },
  // Date styles
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 28,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    minWidth: 28,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  // Dropdown styles
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#fff',
    height: 32,
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 6,
    maxHeight: 200,
    width: '100%',
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 14,
  },
  // Fuel distribution table
  fuelTable: {
    borderWidth: 1,
    borderColor: '#000',
  },
  fuelHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  fuelHeaderCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  fuelHeaderCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  fuelHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  fuelRow: {
    flexDirection: 'row',
  },
  fuelCell: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  fuelCellLast: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  fuelInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 2,
    backgroundColor: '#fff',
    fontSize: 11,
    height: 26,
    width: '100%',
    textAlign: 'center',
  },
  fuelTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingVertical: 4,
  },
  fuelTotalLabel: {
    flex: 2,
    paddingHorizontal: 8,
  },
  fuelTotalValue: {
    flex: 3,
    alignItems: 'center',
  },
  fuelTotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  // Switch styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  // Inline row for compact inputs
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineGroup: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  // Cargo table styles
  cargoTable: {
    borderWidth: 1,
    borderColor: '#000',
  },
  cargoHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  cargoHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  cargoHeaderCellLast: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  cargoHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  cargoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cargoCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cargoCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargoText: {
    fontSize: 11,
    color: '#000',
  },
  cargoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 2,
    backgroundColor: '#fff',
    fontSize: 10,
    height: 24,
    width: '100%',
    textAlign: 'center',
  },
  // Column widths for cargo table
  colName: { flex: 2 },
  colWeight: { flex: 1 },
  colFs: { flex: 1 },
  colAction: { width: 40 },
  // Buttons
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButtonContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Notes
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    height: 80,
    backgroundColor: '#fff',
    fontSize: 12,
    textAlignVertical: 'top',
  },
  // Empty state
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Table row highlight
  tableRowHighlight: {
    backgroundColor: '#FFE135',
  },
  // Add cargo form
  addCargoForm: {
    gap: 8,
  },
  addCargoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addCargoField: {
    flex: 2,
  },
  addCargoFieldSmall: {
    flex: 1,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
});
