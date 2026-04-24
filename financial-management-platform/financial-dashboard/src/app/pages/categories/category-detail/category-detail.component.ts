import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, DecimalPipe } from '@angular/common';

interface CategoryItem {
  description: string;
  amount: string;
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
  newItem: CategoryItem = { description: '', amount: '' };

  get total(): number {
    return this.items.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
  }

  addItem() {
    if (!this.newItem.description || !(parseFloat(String(this.newItem.amount)) > 0)) return;
    this.items.push({ description: this.newItem.description, amount: this.newItem.amount });
    this.newItem = { description: '', amount: '' };
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }
}
