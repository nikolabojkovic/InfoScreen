import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { Transaction, TransactionGroup, IncomeRecord } from '../../models/finance.model';
import { ToEurPipe } from '../../pipes/to-eur.pipe';
import { QrScanner } from '../../components/qr-scanner/qr-scanner';
import { ParsedQrBill } from '../../services/qr-parser.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, DecimalPipe, DatePipe, ToEurPipe, QrScanner],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements AfterViewInit {
  private finance = inject(FinanceService);
  private confirmation = inject(ConfirmationService);
  readonly categories = this.finance.categories;

  // Tab
  activeTab = signal<'income' | 'outcome'>('outcome');

  // Outcome form
  date = new Date().toISOString().substring(0, 10);
  description = '';
  categoryId = '';
  amount: number = 0;
  paymentMethod: 'cash' | 'bank' = 'bank';

  showScanner = signal(false);
  scannedBill = signal<ParsedQrBill | null>(null);
  scannedCategoryId = '';
  scannedAmount: number = 0;
  scannedDescription = '';
  scannedPaymentMethod: 'cash' | 'bank' = 'bank';

  selectedMonth = this.finance.selectedMonth;
  selectedYear = this.finance.selectedYear;

  readonly monthLabel = computed(() => {
    const d = new Date(this.selectedYear(), this.selectedMonth());
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly transactionGroups = computed<TransactionGroup[]>(() => {
    const txns = this.finance.getFilteredTransactions(this.selectedMonth(), this.selectedYear());
    const sorted = [...txns].sort((a, b) => b.date.localeCompare(a.date));

    const groups: Map<string, TransactionGroup> = new Map();
    for (const tx of sorted) {
      if (!groups.has(tx.date)) {
        groups.set(tx.date, { date: tx.date, transactions: [], total: 0 });
      }
      const g = groups.get(tx.date)!;
      g.transactions.push(tx);
      g.total += tx.amount;
    }

    for (const g of groups.values()) {
      g.transactions.reverse();
    }

    return Array.from(groups.values());
  });

  readonly monthTotal = computed(() =>
    this.transactionGroups().reduce((sum, g) => sum + g.total, 0)
  );

  // Income
  readonly incomeRecords = this.finance.incomeRecords;
  readonly income = this.finance.income;
  newIncomeAmount = 0;
  newIncomeDescription = '';
  newIncomeMethod: 'cash' | 'bank' | 'withdrawal' = 'bank';

  editingIncomeId: string | null = null;
  editingIncomeAmount = 0;
  editingIncomeDescription = '';
  editingIncomeMethod: 'cash' | 'bank' | 'withdrawal' = 'bank';

  @ViewChild('incomeTableWrap') incomeTableWrap?: ElementRef<HTMLDivElement>;

  incomeScrollState = { left: 0, viewport: 0, scrollWidth: 0 };

  readonly monthTransactions = computed(() =>
    this.finance.getFilteredTransactions(this.selectedMonth(), this.selectedYear())
  );

  readonly bankIncome = computed(() =>
    this.incomeRecords().filter(r => r.paymentMethod === 'bank').reduce((sum, r) => sum + r.amount, 0)
  );

  readonly cashIncome = computed(() =>
    this.incomeRecords().filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.amount, 0)
  );

  readonly withdrawalAmount = computed(() =>
    this.incomeRecords().filter(r => r.paymentMethod === 'withdrawal').reduce((sum, r) => sum + r.amount, 0)
  );

  readonly bankOutcome = computed(() =>
    this.monthTransactions().filter(tx => tx.paymentMethod === 'bank').reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly cashOutcome = computed(() =>
    this.monthTransactions().filter(tx => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly bankBalance = computed(() => this.bankIncome() - this.withdrawalAmount() - this.bankOutcome());
  readonly cashBalance = computed(() => this.cashIncome() + this.withdrawalAmount() - this.cashOutcome());

  getCategoryName(id: string): string {
    return this.finance.getCategoryById(id)?.name ?? 'Unknown';
  }

  getCategoryColor(id: string): string {
    return this.finance.getCategoryById(id)?.color ?? '#ccc';
  }

  addTransaction(): void {
    if (!this.description.trim() || !this.categoryId || this.amount <= 0) return;
    this.finance.addTransaction({
      date: this.date,
      description: this.description.trim(),
      categoryId: this.categoryId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
    });
    this.description = '';
    this.amount = 0;
    this.paymentMethod = 'bank';
  }

  async deleteTransaction(id: string): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete transaction?',
      message: 'This transaction will be permanently removed. Continue?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    this.finance.deleteTransaction(id);
  }

  // Inline editing
  editingTxId = '';
  editDate = '';
  editDescription = '';
  editCategoryId = '';
  editAmount = 0;
  editPaymentMethod: 'cash' | 'bank' = 'bank';

  startEdit(tx: Transaction): void {
    this.editingTxId = tx.id;
    this.editDate = tx.date;
    this.editDescription = tx.description;
    this.editCategoryId = tx.categoryId;
    this.editAmount = tx.amount;
    this.editPaymentMethod = tx.paymentMethod ?? 'bank';
  }

  saveEdit(): void {
    if (!this.editingTxId || !this.editDescription.trim() || !this.editCategoryId || this.editAmount <= 0) return;
    this.finance.updateTransaction({
      id: this.editingTxId,
      date: this.editDate,
      description: this.editDescription.trim(),
      categoryId: this.editCategoryId,
      amount: this.editAmount,
      paymentMethod: this.editPaymentMethod,
    });
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingTxId = '';
    this.editPaymentMethod = 'bank';
  }

  prevMonth(): void {
    if (this.selectedMonth() === 0) {
      this.finance.setSelectedMonth(11);
      this.finance.setSelectedYear(this.selectedYear() - 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.finance.setSelectedMonth(0);
      this.finance.setSelectedYear(this.selectedYear() + 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() + 1);
    }
  }

  // QR Scanner
  openScanner(): void {
    this.showScanner.set(true);
  }

  closeScanner(): void {
    this.showScanner.set(false);
    this.scannedBill.set(null);
    this.scannedCategoryId = '';
    this.scannedPaymentMethod = 'bank';
  }

  onQrScanned(bill: ParsedQrBill): void {
    this.showScanner.set(false);
    this.scannedBill.set(bill);
    this.scannedCategoryId = '';
    this.scannedAmount = 0;
    this.scannedDescription = bill.recipient || '';
    this.scannedPaymentMethod = 'bank';
  }

  confirmScannedBill(): void {
    const bill = this.scannedBill();
    if (!bill || !this.scannedCategoryId) return;

    const amount = bill.amount > 0 ? bill.amount : this.scannedAmount;
    if (!amount || amount <= 0) return;

    this.finance.addTransaction({
      date: new Date().toISOString().substring(0, 10),
      description: this.scannedDescription.trim() || bill.description,
      categoryId: this.scannedCategoryId,
      amount,
      paymentMethod: this.scannedPaymentMethod,
    });

    this.scannedBill.set(null);
    this.scannedCategoryId = '';
    this.scannedAmount = 0;
    this.scannedDescription = '';
    this.scannedPaymentMethod = 'bank';
  }

  cancelScannedBill(): void {
    this.scannedBill.set(null);
    this.scannedCategoryId = '';
    this.scannedAmount = 0;
    this.scannedDescription = '';
    this.scannedPaymentMethod = 'bank';
  }

  // Income methods
  ngAfterViewInit(): void {
    queueMicrotask(() => this.updateIncomeScrollState());
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateIncomeScrollState();
  }

  updateIncomeScrollState(): void {
    const element = this.incomeTableWrap?.nativeElement;
    if (!element) return;
    this.incomeScrollState = {
      left: element.scrollLeft,
      viewport: element.clientWidth,
      scrollWidth: element.scrollWidth,
    };
  }

  get incomeScrollbarVisible(): boolean {
    return this.incomeScrollState.scrollWidth > this.incomeScrollState.viewport + 1;
  }

  get incomeScrollbarThumbWidth(): number {
    if (!this.incomeScrollbarVisible) return 100;
    return Math.max((this.incomeScrollState.viewport / this.incomeScrollState.scrollWidth) * 100, 20);
  }

  get incomeScrollbarThumbLeft(): number {
    if (!this.incomeScrollbarVisible) return 0;
    const maxLeft = this.incomeScrollState.scrollWidth - this.incomeScrollState.viewport;
    if (maxLeft <= 0) return 0;
    return (this.incomeScrollState.left / maxLeft) * (100 - this.incomeScrollbarThumbWidth);
  }

  addIncome(): void {
    if (!this.newIncomeAmount || this.newIncomeAmount <= 0) return;
    this.finance.addIncomeRecord(this.newIncomeAmount, this.newIncomeDescription.trim(), this.newIncomeMethod);
    this.newIncomeAmount = 0;
    this.newIncomeDescription = '';
    this.newIncomeMethod = 'bank';
  }

  startEditIncome(record: IncomeRecord): void {
    this.editingIncomeId = record.id;
    this.editingIncomeAmount = record.amount;
    this.editingIncomeDescription = record.description ?? '';
    this.editingIncomeMethod = record.paymentMethod ?? 'bank';
  }

  saveIncomeEdit(): void {
    const record = this.finance.incomeRecords().find(item => item.id === this.editingIncomeId);
    if (record && this.editingIncomeAmount > 0) {
      this.finance.updateIncomeRecord({
        ...record,
        amount: this.editingIncomeAmount,
        description: this.editingIncomeDescription.trim(),
        paymentMethod: this.editingIncomeMethod,
      });
    }
    this.editingIncomeId = null;
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = null;
    this.editingIncomeDescription = '';
    this.editingIncomeMethod = 'bank';
  }

  async deleteIncome(id: string): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete income record?',
      message: 'This income record will be permanently deleted. Continue?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    this.finance.deleteIncomeRecord(id);
  }
}
