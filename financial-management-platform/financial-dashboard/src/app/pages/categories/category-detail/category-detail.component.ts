import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, DecimalPipe } from '@angular/common';

interface CategoryItem {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [FormsModule, NgFor, DecimalPipe],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.scss']
})
export class CategoryDetailComponent {
  items: CategoryItem[] = [];
  newItem: CategoryItem = { description: '', amount: 0 };

  get total(): number {
    return this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  addItem() {
    if (!this.newItem.description || this.newItem.amount <= 0) return;
    this.items.push({ ...this.newItem });
    this.newItem = { description: '', amount: 0 };
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }
}
