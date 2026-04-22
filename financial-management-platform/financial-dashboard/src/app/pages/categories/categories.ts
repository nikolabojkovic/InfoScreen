import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { SettingsService } from '../../services/settings.service';
import { Category } from '../../models/finance.model';
import { ToEurPipe } from '../../pipes/to-eur.pipe';
import { ConfirmationService } from '../../services/confirmation.service';

interface CategoryItem {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-categories',
  imports: [FormsModule, DecimalPipe, NgFor, NgIf, ToEurPipe],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories {
  private finance = inject(FinanceService);
  private confirmation = inject(ConfirmationService);
  readonly settingsService = inject(SettingsService);
  readonly categories = this.finance.categories;
  readonly categoryTemplate = this.finance.categoryTemplate;

  name = '';
  color = '#4CAF50';
  items: CategoryItem[] = [];
  newItem: CategoryItem = { description: '', amount: 0 };

  get budgetAmount(): number {
    return this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  editingId = signal<string | null>(null);
  editName = '';
  editColor = '';
  editItems: CategoryItem[] = [];

  addCategory(): void {
    if (!this.name.trim()) return;
    this.finance.addCategory({
      name: this.name.trim(),
      color: this.color,
      budgetAmount: this.budgetAmount,
      items: this.items.map(item => ({ ...item })),
    });
    this.name = '';
    this.color = '#4CAF50';
    this.items = [];
    this.newItem = { description: '', amount: 0 };
  }

  addItem(): void {
    if (!this.newItem.description || this.newItem.amount <= 0) return;
    this.items.push({ ...this.newItem });
    this.newItem = { description: '', amount: 0 };
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editName = cat.name;
    this.editColor = cat.color;
    this.editItems = cat.items ? cat.items.map(item => ({ ...item })) : [];
  }

  saveEdit(cat: Category): void {
    const newBudget = this.editItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    this.finance.updateCategory({
      ...cat,
      name: this.editName.trim(),
      color: this.editColor,
      budgetAmount: newBudget,
      items: this.editItems.map(item => ({ ...item })),
    });
    this.editingId.set(null);
  }

  removeEditItem(index: number): void {
    this.editItems.splice(index, 1);
  }

  addEditItem(): void {
    this.editItems.push({ description: '', amount: 0 });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async deleteCategory(id: string): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete category?',
      message: 'This will permanently delete the category. Continue?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    this.finance.deleteCategory(id);
  }

  saveAsTemplate(): void {
    this.finance.saveAsTemplate();
  }

  async restoreFromTemplate(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Restore from template?',
      message: 'This will add all template categories to the current month. Existing categories are kept. Continue?',
      confirmLabel: 'Restore',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    this.finance.restoreFromTemplate();
  }
}
