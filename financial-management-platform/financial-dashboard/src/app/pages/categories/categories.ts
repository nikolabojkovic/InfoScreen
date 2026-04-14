import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { Category } from '../../models/finance.model';
import { ToEurPipe } from '../../pipes/to-eur.pipe';

@Component({
  selector: 'app-categories',
  imports: [FormsModule, DecimalPipe, ToEurPipe],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories {
  private finance = inject(FinanceService);
  readonly categories = this.finance.categories;

  name = '';
  color = '#4CAF50';
  budgetAmount = 0;

  editingId = signal<string | null>(null);
  editName = '';
  editColor = '';
  editBudget = 0;

  addCategory(): void {
    if (!this.name.trim()) return;
    this.finance.addCategory({
      name: this.name.trim(),
      color: this.color,
      budgetAmount: this.budgetAmount,
    });
    this.name = '';
    this.color = '#4CAF50';
    this.budgetAmount = 0;
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editName = cat.name;
    this.editColor = cat.color;
    this.editBudget = cat.budgetAmount;
  }

  saveEdit(cat: Category): void {
    this.finance.updateCategory({
      ...cat,
      name: this.editName.trim(),
      color: this.editColor,
      budgetAmount: this.editBudget,
    });
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  deleteCategory(id: string): void {
    this.finance.deleteCategory(id);
  }
}
