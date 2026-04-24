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
  amount: string;
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
  icon = '📦';
  items: CategoryItem[] = [];
  newItem: CategoryItem = { description: '', amount: '' };
  showIconPicker = false;
  iconSearch = '';
  editIconSearch = '';

  readonly CATEGORY_ICONS: { emoji: string; label: string }[] = [
    // Housing
    { emoji: '🏠', label: 'home house' }, { emoji: '🏡', label: 'house garden' }, { emoji: '🏢', label: 'office building apartment' }, { emoji: '🚪', label: 'door entrance' }, { emoji: '🛋️', label: 'couch sofa living room' },
    { emoji: '🪴', label: 'plant potted indoor' }, { emoji: '🛁', label: 'bathtub bath' }, { emoji: '🚿', label: 'shower bathroom' }, { emoji: '🛏️', label: 'bed bedroom sleep' }, { emoji: '🪟', label: 'window' },
    // Shopping
    { emoji: '🛒', label: 'shopping cart groceries' }, { emoji: '🛍️', label: 'shopping bag retail' }, { emoji: '👟', label: 'shoes sneakers footwear' }, { emoji: '👗', label: 'dress clothing fashion' }, { emoji: '👜', label: 'handbag purse bag' },
    { emoji: '💍', label: 'ring jewelry accessories' }, { emoji: '💄', label: 'lipstick makeup cosmetics' }, { emoji: '🧴', label: 'lotion personal care hygiene' }, { emoji: '🧹', label: 'broom cleaning household' }, { emoji: '🧺', label: 'basket laundry' },
    { emoji: '🧻', label: 'toilet paper household' }, { emoji: '🪒', label: 'razor shaving grooming' }, { emoji: '🧼', label: 'soap hygiene cleaning' }, { emoji: '🪥', label: 'toothbrush dental hygiene' }, { emoji: '💈', label: 'barber hair salon' },
    // Transport
    { emoji: '🚗', label: 'car vehicle driving' }, { emoji: '🚕', label: 'taxi cab transport' }, { emoji: '🚌', label: 'bus public transport' }, { emoji: '🚂', label: 'train railway transport' }, { emoji: '✈️', label: 'airplane flight travel' },
    { emoji: '🛳️', label: 'ship cruise boat' }, { emoji: '🚲', label: 'bicycle bike cycling' }, { emoji: '🛵', label: 'scooter moped' }, { emoji: '🚴', label: 'cycling bike sport' }, { emoji: '🚁', label: 'helicopter aviation' },
    { emoji: '⛽', label: 'fuel gas petrol' }, { emoji: '🅿️', label: 'parking car' }, { emoji: '🛞', label: 'tire wheel car' }, { emoji: '🚀', label: 'rocket space launch' }, { emoji: '⛵', label: 'sailboat boat sea' },
    // Food & Drink
    { emoji: '🍔', label: 'burger fast food' }, { emoji: '🍕', label: 'pizza food' }, { emoji: '🌮', label: 'taco mexican food' }, { emoji: '🍜', label: 'noodles ramen asian food' }, { emoji: '🍣', label: 'sushi japanese food' },
    { emoji: '🥗', label: 'salad healthy food' }, { emoji: '🍎', label: 'apple fruit healthy' }, { emoji: '🥑', label: 'avocado healthy food' }, { emoji: '🍷', label: 'wine drinks alcohol' }, { emoji: '☕', label: 'coffee hot drink cafe' },
    { emoji: '🍺', label: 'beer drinks alcohol' }, { emoji: '🍰', label: 'cake dessert sweets' }, { emoji: '🍫', label: 'chocolate sweets candy' }, { emoji: '🍞', label: 'bread bakery' }, { emoji: '🥩', label: 'meat steak food' },
    { emoji: '🥦', label: 'broccoli vegetables healthy' }, { emoji: '🧃', label: 'juice drinks' }, { emoji: '🍳', label: 'egg cooking breakfast' }, { emoji: '🫙', label: 'jar preserves food' }, { emoji: '🛒', label: 'supermarket groceries' },
    // Health & Medical
    { emoji: '💊', label: 'pill medicine medication' }, { emoji: '🏥', label: 'hospital medical health' }, { emoji: '🩺', label: 'stethoscope doctor health' }, { emoji: '💉', label: 'syringe injection vaccine' }, { emoji: '🩹', label: 'bandage first aid' },
    { emoji: '🦷', label: 'tooth dental dentist' }, { emoji: '👁️', label: 'eye vision optician' }, { emoji: '🧘', label: 'yoga meditation wellness' }, { emoji: '🏋️', label: 'gym weights fitness' }, { emoji: '🧠', label: 'brain mental health' },
    // Entertainment & Leisure
    { emoji: '🎮', label: 'gaming video games console' }, { emoji: '🎭', label: 'theater arts performance' }, { emoji: '🎵', label: 'music notes audio' }, { emoji: '🎸', label: 'guitar music instrument' }, { emoji: '🎬', label: 'cinema movie film' },
    { emoji: '📺', label: 'tv television streaming' }, { emoji: '🎯', label: 'target darts sport' }, { emoji: '🎲', label: 'dice board game' }, { emoji: '⚽', label: 'football soccer sport' }, { emoji: '🏀', label: 'basketball sport' },
    { emoji: '🎾', label: 'tennis sport' }, { emoji: '🏊', label: 'swimming pool sport' }, { emoji: '🎨', label: 'art painting creative' }, { emoji: '🏖️', label: 'beach vacation holiday' }, { emoji: '⛷️', label: 'skiing winter sport' },
    { emoji: '🎪', label: 'circus fair amusement' }, { emoji: '🎡', label: 'ferris wheel fun park' }, { emoji: '🎠', label: 'carousel amusement park' }, { emoji: '🎤', label: 'microphone singing karaoke' }, { emoji: '🎻', label: 'violin music classical' },
    // Finance & Money
    { emoji: '💰', label: 'money bag savings wealth' }, { emoji: '💵', label: 'cash banknotes money' }, { emoji: '💳', label: 'credit card payment' }, { emoji: '📈', label: 'chart growth investment stocks' }, { emoji: '🏦', label: 'bank finance' },
    { emoji: '💸', label: 'cash spending money' }, { emoji: '🪙', label: 'coin money change' }, { emoji: '👛', label: 'wallet purse money' }, { emoji: '📉', label: 'chart decline loss' }, { emoji: '💎', label: 'diamond gem luxury' },
    // Education
    { emoji: '📚', label: 'books reading education' }, { emoji: '🎓', label: 'graduation university study' }, { emoji: '✏️', label: 'pencil writing school' }, { emoji: '📝', label: 'memo note writing' }, { emoji: '📖', label: 'open book reading' },
    { emoji: '🔬', label: 'microscope science lab' }, { emoji: '🔭', label: 'telescope astronomy science' }, { emoji: '🖊️', label: 'pen writing stationery' }, { emoji: '📐', label: 'ruler geometry school' }, { emoji: '🧪', label: 'test tube chemistry lab' },
    // Technology
    { emoji: '💻', label: 'laptop computer technology' }, { emoji: '📱', label: 'phone mobile smartphone' }, { emoji: '🖥️', label: 'desktop computer monitor' }, { emoji: '⌨️', label: 'keyboard typing computer' }, { emoji: '🖨️', label: 'printer office' },
    { emoji: '🔌', label: 'plug electricity power' }, { emoji: '💾', label: 'disk storage data' }, { emoji: '🤖', label: 'robot ai technology' }, { emoji: '📡', label: 'satellite antenna signal' }, { emoji: '🖱️', label: 'mouse computer' },
    // Nature & Outdoors
    { emoji: '🌿', label: 'plant nature green' }, { emoji: '🌺', label: 'flower nature garden' }, { emoji: '🌲', label: 'tree forest nature' }, { emoji: '🌊', label: 'wave ocean sea water' }, { emoji: '☀️', label: 'sun sunshine weather' },
    { emoji: '❄️', label: 'snowflake winter cold' }, { emoji: '⛰️', label: 'mountain hiking outdoors' }, { emoji: '🌙', label: 'moon night sleep' }, { emoji: '🌍', label: 'globe earth world travel' }, { emoji: '🌈', label: 'rainbow weather colors' },
    // Animals & Pets
    { emoji: '🐶', label: 'dog pet animal' }, { emoji: '🐈', label: 'cat pet animal' }, { emoji: '🐠', label: 'fish aquarium pet' }, { emoji: '🐾', label: 'paw print pet animal' }, { emoji: '🦋', label: 'butterfly insect nature' },
    { emoji: '🐇', label: 'rabbit bunny pet' }, { emoji: '🐦', label: 'bird animal nature' }, { emoji: '🐢', label: 'turtle reptile pet' },
    // Family & People
    { emoji: '👶', label: 'baby child family' }, { emoji: '👧', label: 'girl child family' }, { emoji: '👦', label: 'boy child family' }, { emoji: '👴', label: 'elderly senior family' }, { emoji: '👨‍👩‍👧', label: 'family parents children' },
    // Tools & Work
    { emoji: '🔧', label: 'wrench repair tools' }, { emoji: '🔨', label: 'hammer tools repair' }, { emoji: '📦', label: 'box package delivery' }, { emoji: '💼', label: 'briefcase work business' }, { emoji: '🗂️', label: 'folder files organisation' },
    { emoji: '📋', label: 'clipboard tasks list' }, { emoji: '📊', label: 'bar chart data report' }, { emoji: '🪛', label: 'screwdriver repair tools' }, { emoji: '🧰', label: 'toolbox repair diy' }, { emoji: '🏗️', label: 'construction building work' },
    // Misc
    { emoji: '🎁', label: 'gift present birthday' }, { emoji: '🔑', label: 'key lock security' }, { emoji: '📰', label: 'newspaper news reading' }, { emoji: '⚡', label: 'lightning electricity bolt' }, { emoji: '⭐', label: 'star favourite rating' },
    { emoji: '🔔', label: 'bell notification alert' }, { emoji: '🏆', label: 'trophy award achievement' }, { emoji: '🔥', label: 'fire hot trending' }, { emoji: '🔒', label: 'lock security private' }, { emoji: '📷', label: 'camera photography' },
    { emoji: '☂️', label: 'umbrella rain weather' }, { emoji: '🧲', label: 'magnet attraction' }, { emoji: '🎀', label: 'ribbon bow gift decoration' }, { emoji: '🧧', label: 'red envelope gift money' }, { emoji: '🪆', label: 'doll toy gift' },
  ];

  get filteredIcons() {
    const q = this.iconSearch.trim().toLowerCase();
    return q ? this.CATEGORY_ICONS.filter(i => i.label.includes(q)) : this.CATEGORY_ICONS;
  }

  get filteredEditIcons() {
    const q = this.editIconSearch.trim().toLowerCase();
    return q ? this.CATEGORY_ICONS.filter(i => i.label.includes(q)) : this.CATEGORY_ICONS;
  }

  get budgetAmount(): number {
    return this.items.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
  }

  editingId = signal<string | null>(null);
  editName = '';
  editIcon = '';
  editItems: CategoryItem[] = [];
  showEditIconPicker = false;

  addCategory(): void {
    if (!this.name.trim()) return;
    this.finance.addCategory({
      name: this.name.trim(),
      icon: this.icon,
      budgetAmount: this.budgetAmount,
      items: this.items.map(item => ({ description: item.description, amount: parseFloat(String(item.amount)) || 0 })),
    });
    this.name = '';
    this.icon = '📦';
    this.items = [];
    this.newItem = { description: '', amount: '' };
    this.showIconPicker = false;
  }

  addItem(): void {
    if (!this.newItem.description || !(parseFloat(String(this.newItem.amount)) > 0)) return;
    this.items.push({ description: this.newItem.description, amount: this.newItem.amount });
    this.newItem = { description: '', amount: '' };
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editName = cat.name;
    this.editIcon = cat.icon;
    this.editItems = cat.items ? cat.items.map(item => ({ description: item.description, amount: String(item.amount) })) : [];
    this.showEditIconPicker = false;
  }

  saveEdit(cat: Category): void {
    const newBudget = this.editItems.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
    this.finance.updateCategory({
      ...cat,
      name: this.editName.trim(),
      icon: this.editIcon,
      budgetAmount: newBudget,
      items: this.editItems.map(item => ({ description: item.description, amount: parseFloat(String(item.amount)) || 0 })),
    });
    this.editingId.set(null);
    this.showEditIconPicker = false;
  }

  removeEditItem(index: number): void {
    this.editItems.splice(index, 1);
  }

  addEditItem(): void {
    this.editItems.push({ description: '', amount: '' });
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

  // Drag-and-drop reordering
  dragSrcIndex: number | null = null;
  dragOverIndex: number | null = null;
  private touchDragging = false;

  onDragStart(index: number): void {
    this.dragSrcIndex = index;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDrop(index: number): void {
    if (this.dragSrcIndex === null || this.dragSrcIndex === index) {
      this.dragSrcIndex = null;
      this.dragOverIndex = null;
      return;
    }
    const cats = [...this.categories()];
    const [moved] = cats.splice(this.dragSrcIndex, 1);
    cats.splice(index, 0, moved);
    this.finance.reorderCategories(cats.map(c => c.id));
    this.dragSrcIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd(): void {
    this.dragSrcIndex = null;
    this.dragOverIndex = null;
  }

  onTouchStart(event: TouchEvent, index: number): void {
    this.dragSrcIndex = index;
    this.touchDragging = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.touchDragging || this.dragSrcIndex === null) return;
    event.preventDefault();
    const touch = event.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest('[data-drag-idx]');
    if (row) {
      const idx = parseInt(row.getAttribute('data-drag-idx') ?? '', 10);
      if (!isNaN(idx)) this.dragOverIndex = idx;
    }
  }

  onTouchEnd(): void {
    if (!this.touchDragging) return;
    this.touchDragging = false;
    if (this.dragOverIndex !== null && this.dragSrcIndex !== null && this.dragOverIndex !== this.dragSrcIndex) {
      this.onDrop(this.dragOverIndex);
    } else {
      this.dragSrcIndex = null;
      this.dragOverIndex = null;
    }
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
